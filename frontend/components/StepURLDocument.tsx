'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    RadioGroup,
    FormControlLabel,
    Radio,
    Checkbox,
    Button,
    Paper,
    CircularProgress,
    Divider,
    Select,
    MenuItem,
} from '@mui/material';

import Swal from 'sweetalert2';
import services from '@/services/service';

interface Props {
    onNext: () => void;
}

type OcrPage = {
    index?: number;
    page_index?: number;
    format?: string;
    markdown?: string;
    text?: string;
    content?: string;

    // backend pode mandar assim (como no seu print)
    dimensions?: {
        width?: number;
        height?: number;
        dpi?: number;
    };

    // ou pode mandar direto
    width?: number;
    height?: number;

    has_images?: boolean;
    image_count?: number;

    [key: string]: any;
};

type OcrResult = {
    model?: string;
    ocr_model?: string;
    pageCount?: number;
    page_count?: number;
    pages?: OcrPage[];

    // extras
    metadata?: any;
    source_file?: string;
    [key: string]: any;
};

type VectorizePhase = 'idle' | 'running' | 'completed' | 'failed' | 'timeout';

type VectorizeProgress = {
    percent: number;
    processed_chunks: number;
    total_chunks: number;
    current_page: number;
    total_pages: number;
};

function getCookie(name: string) {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function getPageIndex(p: OcrPage, i: number) {
    return typeof p.index === 'number' ? p.index : typeof p.page_index === 'number' ? p.page_index : i;
}

function getPageText(p: OcrPage) {
    return (p.markdown || p.text || p.content || '').toString();
}

function getPageDims(p: OcrPage) {
    const w = typeof p.width === 'number' ? p.width : p.dimensions?.width;
    const h = typeof p.height === 'number' ? p.height : p.dimensions?.height;
    if (typeof w === 'number' && typeof h === 'number') return `${w}x${h}px`;
    return 'N/A';
}

/**
 * Normaliza o retorno do backend para o formato "OcrResult" usado na UI
 * - No seu print, veio: res.data.result.pages + res.data.result.model + res.data.total_pages
 */
function normalizeOcrResponse(raw: any): OcrResult {
    const result = raw?.result || raw; // se o backend retornar direto no root

    const pages = result?.pages || raw?.pages || [];
    const model = result?.model || raw?.model || result?.ocr_model || raw?.ocr_model;

    const page_count =
        raw?.total_pages ??
        result?.page_count ??
        result?.pageCount ??
        raw?.page_count ??
        raw?.pageCount ??
        (Array.isArray(pages) ? pages.length : 0);

    return {
        model,
        pages: Array.isArray(pages) ? pages : [],
        page_count,
        source_file: raw?.source_file || result?.source_file,
        metadata: result?.metadata || raw?.metadata,
        raw,
    };
}

export default function StepURLDocument({ onNext }: Props) {
    const [url, setUrl] = useState('');
    const [tipo, setTipo] = useState<'pdf' | 'imagem'>('pdf');
    const [embeddings, setEmbeddings] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Resultado OCR (para mostrar igual ao StepUpload)
    const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
    const [viewFormat, setViewFormat] = useState<'markdown' | 'json' | 'all'>('markdown');

    // Vetorização (UI + polling)
    const pollRef = useRef<number | null>(null);
    const pollCountRef = useRef(0);

    const [vectorPhase, setVectorPhase] = useState<VectorizePhase>('idle');
    const [vectorJobId, setVectorJobId] = useState<string | null>(null);
    const [vectorError, setVectorError] = useState<string | null>(null);
    const [embeddingsCreated, setEmbeddingsCreated] = useState<number | null>(null);

    const [vectorProgress, setVectorProgress] = useState<VectorizeProgress>({
        percent: 0,
        processed_chunks: 0,
        total_chunks: 0,
        current_page: 0,
        total_pages: 0,
    });

    useEffect(() => {
        return () => {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
        };
    }, []);

    const isValidUrl = (value: string) => {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    };

    const handleDownloadAllPagesJson = () => {
        if (!ocrResult) return;

        const payload = {
            model: ocrResult.model || ocrResult.ocr_model || 'unknown',
            page_count: ocrResult.page_count ?? ocrResult.pageCount ?? (ocrResult.pages?.length || 0),
            pages: ocrResult.pages || [],
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const urlBlob = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = `ocr_pages_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(urlBlob);
    };

    const handleVectorizeResult = async () => {
        if (!ocrResult) {
            Swal.fire({
                icon: 'warning',
                title: 'Nenhum resultado',
                text: 'Nenhum resultado disponível para vetorizar. Processe uma URL primeiro.',
                confirmButtonColor: '#667EEA',
            });
            return;
        }

        // reset states
        setVectorError(null);
        setEmbeddingsCreated(null);
        setVectorPhase('running');
        setVectorJobId(null);
        setVectorProgress({
            percent: 0,
            processed_chunks: 0,
            total_chunks: 0,
            current_page: 0,
            total_pages: 0,
        });

        // clear previous polling
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        pollCountRef.current = 0;

        try {
            const pages = Array.isArray(ocrResult.pages) ? ocrResult.pages : [];
            if (pages.length === 0) {
                throw new Error('Nenhuma página encontrada no resultado. Processe a URL novamente.');
            }

            const pagesToVectorize = pages.filter((p) => {
                const md = (p.markdown || '').toString().trim();
                return md.length > 0;
            });

            if (pagesToVectorize.length === 0) {
                throw new Error('Nenhuma página com conteúdo encontrada para vetorização.');
            }

            const optimizedResult = {
                model: ocrResult.model,
                pages: pagesToVectorize.map((p) => ({
                    index: p.index ?? p.page_index ?? 0,
                    markdown: p.markdown,
                    format: p.format,
                    dimensions: p.dimensions,
                    has_images: p.has_images,
                    image_count: p.image_count,
                })),
                metadata: ocrResult.metadata || {},
            };

            const csrf = getCookie('csrftoken');

            const startRes = await services('/api/vectorize-result', {
                method: 'POST',
                data: {
                    ocr_result: optimizedResult,
                    source_file: ocrResult.source_file || 'processed_document',
                },
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrf ? { 'X-CSRFToken': csrf } : {}),
                },
            });

            if (!startRes?.success) {
                throw new Error(startRes?.data?.error || startRes?.data?.message || 'Erro ao vetorizar resultado');
            }

            const jobId = startRes?.data?.job_id;
            if (!jobId) {
                throw new Error('Backend não retornou job_id.');
            }

            setVectorJobId(jobId);

            const maxPolls = 300; // 50min

            const pollOnce = async () => {
                const progressRes = await services(`/api/vectorize-progress/${jobId}`, {
                    method: 'GET',
                    headers: {
                        ...(csrf ? { 'X-CSRFToken': csrf } : {}),
                    },
                });

                if (!progressRes?.success) {
                    throw new Error(progressRes?.data?.error || progressRes?.data?.message || 'Erro ao obter progresso');
                }

                const d = progressRes.data;
                const p = d?.progress || {};

                const percent = Number(p.percent || 0);

                setVectorProgress({
                    percent,
                    processed_chunks: Number(p.processed_chunks || 0),
                    total_chunks: Number(p.total_chunks || 0),
                    current_page: Number(p.current_page || 0),
                    total_pages: Number(p.total_pages || 0),
                });

                if (d?.is_complete) {
                    if (pollRef.current) window.clearInterval(pollRef.current);
                    pollRef.current = null;

                    if (d?.status === 'completed') {
                        setVectorPhase('completed');
                        setEmbeddingsCreated(Number(d?.embeddings_created || p.processed_chunks || 0));
                        return;
                    }

                    if (d?.status === 'failed') {
                        setVectorPhase('failed');
                        setVectorError(d?.error || 'Erro desconhecido');
                        return;
                    }
                }
            };

            pollRef.current = window.setInterval(async () => {
                try {
                    pollCountRef.current += 1;

                    if (pollCountRef.current >= maxPolls) {
                        if (pollRef.current) window.clearInterval(pollRef.current);
                        pollRef.current = null;
                        setVectorPhase('timeout');
                        return;
                    }

                    await pollOnce();
                } catch (err) {
                    console.error('Erro ao verificar progresso:', err);
                }
            }, 10000);

            // primeira verificação após 2s
            setTimeout(async () => {
                try {
                    await pollOnce();
                } catch (err) {
                    console.error('Erro na primeira verificação:', err);
                }
            }, 2000);
        } catch (err: any) {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;

            setVectorPhase('failed');
            setVectorError(err?.message || 'Erro ao iniciar vetorização');
        }
    };

    const handleProcessUrl = async () => {
        const trimmed = url.trim();

        if (!trimmed) {
            Swal.fire({
                icon: 'warning',
                title: 'Informe uma URL',
                text: 'Cole a URL do documento/arquivo para processar.',
                confirmButtonColor: '#667EEA',
            });
            return;
        }

        if (!isValidUrl(trimmed)) {
            Swal.fire({
                icon: 'warning',
                title: 'URL inválida',
                text: 'A URL informada não parece válida. Verifique e tente novamente.',
                confirmButtonColor: '#667EEA',
            });
            return;
        }

        const urlType = tipo === 'pdf' ? 'document' : 'image';

        setProcessing(true);

        Swal.fire({
            title: 'Processando...',
            text: 'Enviando URL para o OCR.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        const res = await services('/api/process-url', {
            method: 'POST',
            data: {
                url: trimmed,
                urlType,
                enableVectorization: embeddings,
            },
            headers: { 'Content-Type': 'application/json' },
        });

        setProcessing(false);
        Swal.close();

        if (!res.success) {
            Swal.fire({
                icon: 'error',
                title: 'Erro ao processar URL',
                text: (res.data as any)?.error || (res.data as any)?.message || 'Falha ao chamar /api/process-url.',
                confirmButtonColor: '#667EEA',
            });
            return;
        }

        // Normaliza e exibe igual ao upload
        const normalized = normalizeOcrResponse(res.data);

        try {
            localStorage.setItem('ocr:lastResult', JSON.stringify(res.data));
        } catch { }

        setOcrResult(normalized);
        setViewFormat('markdown');

        // reset vetorização UI (novo resultado)
        setVectorPhase('idle');
        setVectorJobId(null);
        setVectorError(null);
        setEmbeddingsCreated(null);
        setVectorProgress({
            percent: 0,
            processed_chunks: 0,
            total_chunks: 0,
            current_page: 0,
            total_pages: 0,
        });

        Swal.fire({
            icon: 'success',
            title: 'URL processada!',
            text: 'OCR concluído com sucesso. O resultado foi exibido abaixo.',
            confirmButtonColor: '#667EEA',
        });

    
        try {
            localStorage.setItem('ocr:lastResult', JSON.stringify(res.data)); // mantém como você já faz

            const pages = Array.isArray(normalized.pages) ? normalized.pages : [];
            const combinedText = buildCombinedTextFromPages(pages);

            if (combinedText) {
                localStorage.setItem('ocr:lastText', combinedText);
            }
        } catch { }

    };


    function buildCombinedTextFromPages(pages: any[]) {
        const combined = (pages || [])
            .map((p, i) => {
                const pageText = (p?.markdown || p?.text || p?.content || '').toString();
                return `--- Página ${i + 1} ---\n${pageText}`;
            })
            .join('\n\n')
            .trim();

        return combined;
    }







    const modelName = ocrResult?.model || ocrResult?.ocr_model || '—';
    const pageCount = ocrResult?.page_count ?? ocrResult?.pageCount ?? (ocrResult?.pages?.length || 0);

    return (
        <Box>
            <Typography fontWeight={600} mb={1}>
                URL do Documento ou Imagem:
            </Typography>

            <TextField
                fullWidth
                placeholder="https://exemplo.com/documento.pdf"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                sx={{ mb: 3 }}
            />

            <RadioGroup
                row
                value={tipo}
                onChange={(e) => setTipo(e.target.value as 'pdf' | 'imagem')}
                sx={{ mb: 3 }}
            >
                <FormControlLabel value="pdf" control={<Radio />} label="Documento (PDF)" />
                <FormControlLabel value="imagem" control={<Radio />} label="Imagem" />
            </RadioGroup>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={embeddings}
                            onChange={(e) => setEmbeddings(e.target.checked)}
                            sx={{ color: '#667EEA', '&.Mui-checked': { color: '#667EEA' } }}
                        />
                    }
                    label={
                        <Box>
                            <Typography fontWeight={500}>🔍 Gerar embeddings vetoriais (busca semântica)</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Cria vetores para busca semântica nos documentos processados
                            </Typography>
                        </Box>
                    }
                />
            </Paper>

            <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={handleProcessUrl}
                disabled={processing}
                sx={{
                    py: 1.4,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    background: 'linear-gradient(90deg, #667EEA, #764DA5)',
                    '&:hover': { background: 'linear-gradient(90deg, #5A6FE0, #6A4496)' },
                    mb: 4,
                }}
            >
                {processing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={18} sx={{ color: 'white' }} />
                        Processando...
                    </Box>
                ) : (
                    'Processar URL'
                )}
            </Button>

            {/* ===========================
          RESULTADO DO OCR (igual upload)
      =========================== */}
            {ocrResult && (
                <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#667EEA' }}>
                            Resultado do OCR
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                onClick={handleVectorizeResult}
                                disabled={vectorPhase === 'running'}
                                sx={{
                                    background:
                                        vectorPhase === 'completed'
                                            ? '#4caf50'
                                            : 'linear-gradient(90deg, #667EEA, #764DA5)',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                }}
                            >
                                {vectorPhase === 'running'
                                    ? '⏳ Vetorizando...'
                                    : vectorPhase === 'completed'
                                        ? '✅ Vetorizado'
                                        : '🔍 Vetorizar Resultado'}
                            </Button>

                            <Button
                                variant="contained"
                                onClick={handleDownloadAllPagesJson}
                                sx={{
                                    background: 'linear-gradient(90deg, #667EEA, #764DA5)',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                }}
                            >
                                📥 Baixar Todas as Páginas (JSON)
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 2 }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Modelo usado:
                            </Typography>
                            <Typography fontWeight={700}>{modelName}</Typography>
                        </Box>

                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Total de páginas:
                            </Typography>
                            <Typography fontWeight={700}>{pageCount}</Typography>
                        </Box>

                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Formato de visualização:
                            </Typography>
                            <Select
                                size="small"
                                value={viewFormat}
                                onChange={(e) => setViewFormat(e.target.value as any)}
                                sx={{ minWidth: 160 }}
                            >
                                <MenuItem value="markdown">Tabela (Markdown)</MenuItem>
                                <MenuItem value="json">JSON</MenuItem>
                                <MenuItem value="all">Todos</MenuItem>
                            </Select>
                        </Box>
                    </Box>

                    {/* Status da Vetorização (barra + resultado) */}
                    {vectorPhase !== 'idle' && (
                        <Box sx={{ mt: 2, mb: 2 }}>
                            {vectorPhase === 'running' && (
                                <Box
                                    sx={{
                                        background: '#fff',
                                        border: '2px solid #667EEA',
                                        borderRadius: 2,
                                        p: 2,
                                    }}
                                >
                                    <Typography fontWeight={700} sx={{ mb: 1 }}>
                                        ⏳ Gerando embeddings vetoriais...
                                    </Typography>

                                    <Box
                                        sx={{
                                            background: '#e0e0e0',
                                            borderRadius: 10,
                                            height: 25,
                                            overflow: 'hidden',
                                            mb: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                height: '100%',
                                                width: `${vectorProgress.percent}%`,
                                                transition: 'width 0.3s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontWeight: 800,
                                                fontSize: 13,
                                                background: 'linear-gradient(90deg, #667EEA 0%, #764DA5 100%)',
                                            }}
                                        >
                                            {vectorProgress.percent.toFixed(1)}%
                                        </Box>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                        {vectorProgress.total_chunks > 0
                                            ? `Processando: ${vectorProgress.processed_chunks}/${vectorProgress.total_chunks} chunks (Página ${vectorProgress.current_page}/${vectorProgress.total_pages})`
                                            : `Processando página ${vectorProgress.current_page}/${vectorProgress.total_pages}...`}
                                    </Typography>

                                    {vectorJobId && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                                            Job: {vectorJobId}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {vectorPhase === 'completed' && (
                                <Box
                                    sx={{
                                        background: '#e8f5e9',
                                        border: '2px solid #4caf50',
                                        borderRadius: 2,
                                        p: 2,
                                    }}
                                >
                                    <Typography fontWeight={800}>✅ Vetorização Concluída!</Typography>
                                    <Typography variant="body2">
                                        {embeddingsCreated ?? vectorProgress.processed_chunks} chunks vetoriais criados e salvos no banco de dados.
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Use a aba "🔍 Documentos Vetorizados" para visualizar e buscar.
                                    </Typography>
                                </Box>
                            )}

                            {vectorPhase === 'failed' && (
                                <Box
                                    sx={{
                                        background: '#ffebee',
                                        border: '2px solid #f44336',
                                        borderRadius: 2,
                                        p: 2,
                                    }}
                                >
                                    <Typography fontWeight={800}>❌ Erro ao iniciar vetorização:</Typography>
                                    <Typography variant="body2">{vectorError || 'Erro desconhecido'}</Typography>
                                </Box>
                            )}

                            {vectorPhase === 'timeout' && (
                                <Box
                                    sx={{
                                        background: '#fff3cd',
                                        border: '2px solid #ffc107',
                                        borderRadius: 2,
                                        p: 2,
                                    }}
                                >
                                    <Typography fontWeight={800}>⏱️ Tempo limite excedido</Typography>
                                    <Typography variant="body2">
                                        A vetorização está demorando mais que o esperado. Verifique o status manualmente.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {(ocrResult.pages || []).map((p, i) => {
                        const idx = getPageIndex(p, i);
                        const text = getPageText(p);
                        const dims = getPageDims(p);

                        return (
                            <Paper key={i} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Typography fontWeight={800} sx={{ color: '#667EEA' }}>
                                            Página {idx + 1}
                                        </Typography>
                                        <Box
                                            sx={{
                                                px: 1.1,
                                                py: 0.4,
                                                borderRadius: 1,
                                                backgroundColor: '#1976d2',
                                                color: '#fff',
                                                fontWeight: 800,
                                                fontSize: 12,
                                            }}
                                        >
                                            Tabela
                                        </Box>
                                    </Box>

                                    <Typography variant="caption" color="text.secondary">
                                        {dims}
                                    </Typography>
                                </Box>

                                {viewFormat === 'markdown' && (
                                    <Box
                                        component="pre"
                                        sx={{
                                            m: 0,
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor: '#F8FAFF',
                                            border: '1px solid #E3E6F0',
                                            maxHeight: 420,
                                            overflow: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            fontSize: 13,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {text || '(sem conteúdo)'}
                                    </Box>
                                )}

                                {viewFormat === 'json' && (
                                    <Box
                                        component="pre"
                                        sx={{
                                            m: 0,
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor: '#0b1020',
                                            color: '#d7e1ff',
                                            border: '1px solid #1b2a55',
                                            maxHeight: 420,
                                            overflow: 'auto',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            fontSize: 12,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {JSON.stringify(p, null, 2)}
                                    </Box>
                                )}

                                {viewFormat === 'all' && (
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                        <Box
                                            component="pre"
                                            sx={{
                                                m: 0,
                                                p: 2,
                                                borderRadius: 2,
                                                backgroundColor: '#F8FAFF',
                                                border: '1px solid #E3E6F0',
                                                maxHeight: 420,
                                                overflow: 'auto',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                fontSize: 13,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {text || '(sem conteúdo)'}
                                        </Box>

                                        <Box
                                            component="pre"
                                            sx={{
                                                m: 0,
                                                p: 2,
                                                borderRadius: 2,
                                                backgroundColor: '#0b1020',
                                                color: '#d7e1ff',
                                                border: '1px solid #1b2a55',
                                                maxHeight: 420,
                                                overflow: 'auto',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                fontSize: 12,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {JSON.stringify(p, null, 2)}
                                        </Box>
                                    </Box>
                                )}
                            </Paper>
                        );
                    })}

                    {/* Se você quiser manter o fluxo em etapas */}
                    <Button
                        variant="outlined"
                        onClick={onNext}
                        sx={{ textTransform: 'none', mt: 1 }}
                    >
                        Próxima etapa
                    </Button>
                </Paper>
            )}
        </Box>
    );
}
