'use client';

import { useRef, useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Checkbox,
    FormControlLabel,
    Select,
    MenuItem,
    Paper,
    CircularProgress,
    Divider,
} from '@mui/material';

import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import Swal from 'sweetalert2';
import services from '@/services/service';

interface Props {
    onNext: () => void;
}

function isExcelFile(file: File) {
    const name = file.name.toLowerCase();
    return name.endsWith('.xlsx') || name.endsWith('.xls');
}

function isPdfFile(file: File) {
    return file.name.toLowerCase().endsWith('.pdf');
}

function isCsvFile(file: File) {
    return file.name.toLowerCase().endsWith('.csv');
}

function isAllowedFile(file: File) {
    const name = file.name.toLowerCase();
    return name.endsWith('.xlsx') || name.endsWith('.csv') || name.endsWith('.pdf');
}

type OcrPage = {
    index?: number;
    page_index?: number;
    format?: string;
    markdown?: string;
    text?: string;
    content?: string;
    dimensions?: { width?: number; height?: number; dpi?: number };
    width?: number;
    height?: number;
    [key: string]: unknown;
};

type OcrResult = {
    model?: string;
    page_count?: number;
    pages?: OcrPage[];
    source_file?: string;
    raw?: unknown; // guarda o payload original p/ debug/download se quiser
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
    if (typeof p.index === 'number') return p.index;
    if (typeof p.page_index === 'number') return p.page_index;
    return i;
}

function getPageText(p: OcrPage) {
    return (p.markdown || p.text || p.content || '').toString();
}

function getPageDims(p: OcrPage) {
    const w = typeof p.width === 'number' ? p.width : p.dimensions?.width;
    const h = typeof p.height === 'number' ? p.height : p.dimensions?.height;
    if (typeof w === 'number' && typeof h === 'number') return `${w}x${h}px`;
    return null;
}

/**
 * Normaliza QUALQUER retorno para o formato que a UI espera.
 * Seu caso atual: res.data.result.pages + res.data.total_pages
 */
function normalizeOcrResponse(data: any): OcrResult {
    const resultNode = data?.result || data;

    const pagesRaw: any[] = Array.isArray(resultNode?.pages)
        ? resultNode.pages
        : Array.isArray(data?.pages)
            ? data.pages
            : [];

    const pages: OcrPage[] = pagesRaw.map((p: any) => {
        const width = typeof p?.width === 'number' ? p.width : p?.dimensions?.width;
        const height = typeof p?.height === 'number' ? p.height : p?.dimensions?.height;

        return {
            ...p,
            width,
            height,
            markdown: p?.markdown ?? p?.content ?? p?.text,
        };
    });

    const page_count =
        data?.total_pages ??
        resultNode?.page_count ??
        data?.page_count ??
        pages.length;

    const model =
        resultNode?.model ??
        data?.model ??
        data?.ocr_model ??
        '—';

    return {
        model,
        page_count,
        pages,
        source_file: data?.source_file ?? resultNode?.source_file,
        raw: data,
    };
}

export default function StepUpload({ onNext }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [files, setFiles] = useState<File[]>([]);
    const [sheet, setSheet] = useState('');
    const [sheets, setSheets] = useState<string[]>([]);
    const [embeddings, setEmbeddings] = useState(true);

    const [loadingSheets, setLoadingSheets] = useState(false);
    const [uploading, setUploading] = useState(false);

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


    // Resultado do OCR (renderizado abaixo, como no index.html)
    const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

    const openFilePicker = () => inputRef.current?.click();

    const fetchExcelSheets = async (file: File) => {
        setLoadingSheets(true);
        setSheets([]);
        setSheet('');

        const fd = new FormData();
        fd.append('file', file);

        const res = await services('/api/list-excel-sheets', {
            method: 'POST',
            data: fd,
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        setLoadingSheets(false);

        if (!res.success) {
            Swal.fire({
                icon: 'error',
                title: 'Erro ao carregar planilhas',
                text: res.data?.error || res.data?.message || 'Falha ao chamar /api/list-excel-sheets',
                confirmButtonColor: '#667EEA',
            });
            return;
        }

        const list = res.data?.sheets || res.data?.data?.sheets || [];

        if (!Array.isArray(list) || list.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Nenhuma planilha encontrada',
                text: 'O endpoint não retornou planilhas para este arquivo.',
                confirmButtonColor: '#667EEA',
            });
            return;
        }

        setSheets(list);
        if (list.length === 1) setSheet(list[0]);
    };

    const handleFiles = async (fileList: FileList | null) => {
        if (!fileList) return;

        const incoming = Array.from(fileList);

        const allowed = incoming.filter(isAllowedFile);
        const rejected = incoming.filter((f) => !isAllowedFile(f));

        if (rejected.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Arquivo inválido',
                html:
                    `Você enviou ${rejected.length} arquivo(s) não suportado(s):<br/>` +
                    `<strong>${rejected.map((f) => f.name).join('<br/>')}</strong><br/><br/>` +
                    `Tipos aceitos: <strong>XLSX, CSV, PDF</strong>.`,
                confirmButtonColor: '#667EEA',
            });
        }

        // Se não tiver nenhum válido, não faz nada
        if (allowed.length === 0) return;

        const last = allowed[allowed.length - 1];

        setFiles((prev) => [...prev, ...allowed]);

        // Excel: buscar sheets; CSV/PDF: limpa seletor
        if (last && isExcelFile(last)) {
            await fetchExcelSheets(last);
        } else {
            setSheets([]);
            setSheet('');
        }
    };


    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await handleFiles(e.target.files);
        e.target.value = '';
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        await handleFiles(e.dataTransfer.files);
    };

    const handleClearAll = () => {
        setFiles([]);
        setSheet('');
        setSheets([]);
        setEmbeddings(true);
        setOcrResult(null);
        localStorage.removeItem('ocr:lastText');
        localStorage.removeItem('ocr:lastResult');
    };

    const handleDownloadAllPagesJson = () => {
        if (!ocrResult) return;

        const payload = {
            model: ocrResult.model,
            page_count: ocrResult.page_count ?? (ocrResult.pages?.length || 0),
            pages: ocrResult.pages || [],
            source_file: ocrResult.source_file,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: 'application/json;charset=utf-8',
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ocr_pages_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleVectorizeResult = async () => {
        if (!ocrResult) {
            Swal.fire({
                icon: 'warning',
                title: 'Nenhum resultado',
                text: 'Nenhum resultado disponível para vetorizar. Processe um arquivo primeiro.',
                confirmButtonColor: '#667EEA',
            });
            return;
        }

        // limpar estado anterior
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

        // limpar polling anterior (se existir)
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        pollCountRef.current = 0;

        try {
            const pages = Array.isArray(ocrResult.pages) ? ocrResult.pages : [];
            if (pages.length === 0) {
                throw new Error('Nenhuma página encontrada no resultado. Processe o documento novamente.');
            }

            // filtrar páginas vazias
            const pagesToVectorize = pages.filter((p) => {
                const md = (p.markdown || '').toString().trim();
                return md.length > 0;
            });

            if (pagesToVectorize.length === 0) {
                throw new Error('Nenhuma página com conteúdo encontrada para vetorização.');
            }

            // payload otimizado (igual seu main.js)
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
                metadata: ocrResult.raw?.metadata || {},
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

            const maxPolls = 300; // 300 * 10s = 50min

            const pollOnce = async () => {
                const progressRes = await services(`/api/vectorize-progress/${jobId}`, {
                    method: 'GET',
                    headers: {
                        ...(csrf ? { 'X-CSRFToken': csrf } : {}),
                    },
                });

                if (!progressRes?.success) {
                    const errorData = progressRes?.data as { error?: string; message?: string } | undefined;
                    throw new Error(errorData?.error || errorData?.message || 'Erro ao obter progresso');
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

                // completou
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

            // polling a cada 10s
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
                } catch (err: unknown) {
                    // mantém rodando, mas loga erro
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
        } catch (err: unknown) {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;

            setVectorPhase('failed');
            setVectorError((err instanceof Error ? err.message : String(err)) || 'Erro ao iniciar vetorização');
        }
    };


    const handleUpload = async () => {
        if (files.length === 0) return;

        const file = files[files.length - 1];

        if (isExcelFile(file) && sheets.length > 1 && !sheet) {
            Swal.fire({
                icon: 'warning',
                title: 'Selecione uma planilha',
                text: 'Este Excel tem múltiplas planilhas. Selecione qual deseja processar.',
                confirmButtonColor: '#667EEA',
            });
            return;
        }

        const fd = new FormData();
        fd.append('file', file);
        fd.append('enableVectorization', embeddings ? 'true' : 'false');
        if (sheet) fd.append('sheetName', sheet);

        setUploading(true);

        Swal.fire({
            title: 'Processando...',
            text: 'Enviando arquivo para o OCR.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        const res = await services('/api/upload', {
            method: 'POST',
            data: fd,
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        setUploading(false);
        Swal.close();

        if (!res.success) {
            const errorData = res.data as { error?: string; message?: string } | undefined;
            Swal.fire({
                icon: 'error',
                title: 'Erro no upload',
                text: errorData?.error || errorData?.message || 'Falha ao chamar /api/upload',
                confirmButtonColor: '#667EEA',
            });
            return;
        }

        // ✅ AQUI: normaliza o retorno real do backend (res.data.result.pages)
        const normalized = normalizeOcrResponse(res.data);

        // opcional: persistir
        try {
            localStorage.setItem('ocr:lastResult', JSON.stringify(res.data));
        } catch { }

        setOcrResult(normalized);

        // ✅ Sempre salvar texto consolidado (é o que as próximas abas precisam)
        const combinedText = (normalized.pages || [])
            .map((p, i) => `--- Página ${i + 1} ---\n${getPageText(p)}`)
            .join('\n\n');

        // 1) Salva SEMPRE o texto (prioridade)
        try {
            localStorage.setItem('ocr:lastText', combinedText);
        } catch (e) {
            // Se estourar quota, ao menos não “silencia” sem você saber
            console.warn('Falha ao salvar ocr:lastText (quota/localStorage):', e);
            Swal.fire({
                icon: 'warning',
                title: 'Documento muito grande',
                text: 'O texto do OCR excedeu o limite do navegador para salvar localmente. Considere salvar no backend ou reduzir o documento.',
                confirmButtonColor: '#667EEA',
            });
        }

        // 2) Salvar resultado bruto é opcional e pode estourar quota (eu sugiro remover)
        // Se você quiser manter, salve um payload MENOR (sem raw completo):
        try {
            const minimal = {
                model: normalized.model,
                page_count: normalized.page_count,
                pages: (normalized.pages || []).map((p) => ({
                    index: p.index ?? p.page_index ?? 0,
                    markdown: p.markdown ?? p.content ?? p.text ?? '',
                    width: p.width,
                    height: p.height,
                    dimensions: p.dimensions,
                    format: p.format,
                })),
                source_file: normalized.source_file,
            };

            localStorage.setItem('ocr:lastResult', JSON.stringify(minimal));
        } catch (e) {
            console.warn('Falha ao salvar ocr:lastResult (quota/localStorage):', e);
        }


        Swal.fire({
            icon: 'success',
            title: 'Arquivo processado!',
            text: 'OCR concluído com sucesso. O resultado foi exibido abaixo.',
            confirmButtonColor: '#667EEA',
        });
    };

    const showSheetSelector =
        files.length > 0 && isExcelFile(files[files.length - 1]);

    const modelName = ocrResult?.model || '—';
    const pageCount =
        ocrResult?.page_count ?? (ocrResult?.pages?.length || 0);

    useEffect(() => {
        return () => {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
        };
    }, []);

    return (
        <Box>
            <input
                ref={inputRef}
                type="file"
                hidden
                multiple
                onChange={handleInputChange}
                accept=".pdf,.xlsx,.csv"
            />

            <Box
                onClick={openFilePicker}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                sx={{
                    border: '2px dashed #764DA5',
                    borderRadius: 3,
                    backgroundColor: '#F3F4FF',
                    py: 6,
                    px: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    mb: 4,
                    '&:hover': { backgroundColor: '#EEF2FF', borderColor: '#667EEA' },
                }}
            >
                <CloudUploadOutlinedIcon sx={{ fontSize: 56, color: '#764DA5', mb: 2 }} />
                <Typography fontWeight={500} mb={1}>
                    Arraste e solte um arquivo aqui ou clique para selecionar
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Formatos suportados: PDF, XLSX, CSV
                </Typography>
            </Box>

            {files.length > 0 && (
                <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                    <Typography fontWeight={600} mb={2}>
                        Arquivo selecionado: <strong>{files[files.length - 1].name}</strong>
                    </Typography>

                    {showSheetSelector && (
                        <>
                            <Typography fontWeight={500} mb={1}>
                                Selecione a planilha:
                            </Typography>

                            <Select
                                fullWidth
                                size="small"
                                value={sheet}
                                displayEmpty
                                onChange={(e) => setSheet(String(e.target.value))}
                                sx={{ mb: 1 }}
                                disabled={loadingSheets}
                            >
                                <MenuItem value="">
                                    {loadingSheets ? 'Carregando planilhas...' : 'Selecione...'}
                                </MenuItem>
                                {sheets.map((s) => (
                                    <MenuItem key={s} value={s}>
                                        {s}
                                    </MenuItem>
                                ))}
                            </Select>

                            {loadingSheets && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="caption" color="text.secondary">
                                        Consultando /api/list-excel-sheets...
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}

                    <FormControlLabel
                        sx={{ mt: 2 }}
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

                    <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            onClick={handleUpload}
                            disabled={uploading || loadingSheets}
                            sx={{
                                background: 'linear-gradient(90deg, #667EEA, #764DA5)',
                                fontWeight: 600,
                                textTransform: 'none',
                            }}
                        >
                            {uploading ? 'Processando...' : 'Processar Arquivo'}
                        </Button>

                        <Button variant="outlined" onClick={handleClearAll} sx={{ textTransform: 'none' }}>
                            Limpar
                        </Button>

                        <Button variant="outlined" onClick={onNext} sx={{ textTransform: 'none' }}>
                            Próxima etapa
                        </Button>
                    </Box>
                </Paper>
            )}

            {/* ===== Resultado do OCR (como no index.html) ===== */}
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
                    </Box>

                    {vectorPhase !== 'idle' && (
                        <Box sx={{ mt: 2 }}>
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
                                    <Typography fontWeight={800}>
                                        ✅ Vetorização Concluída!
                                    </Typography>
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
                                    <Typography fontWeight={800}>
                                        ❌ Erro ao iniciar vetorização:
                                    </Typography>
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
                                    <Typography fontWeight={800}>
                                        ⏱️ Tempo limite excedido
                                    </Typography>
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
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Typography fontWeight={800} sx={{ color: '#667EEA' }}>
                                            Página {idx + 1}
                                        </Typography>

                                        <Box
                                            sx={{
                                                fontSize: 12,
                                                fontWeight: 800,
                                                px: 1.2,
                                                py: 0.3,
                                                borderRadius: 1,
                                                color: '#fff',
                                                backgroundColor: '#1E88E5',
                                            }}
                                        >
                                            Tabela
                                        </Box>
                                    </Box>

                                    {dims && (
                                        <Typography variant="caption" color="text.secondary">
                                            {dims}
                                        </Typography>
                                    )}
                                </Box>

                                <Box
                                    component="pre"
                                    sx={{
                                        m: 0,
                                        p: 2,
                                        borderRadius: 2,
                                        backgroundColor: '#fff',
                                        border: '1px solid #E3E6F0',
                                        borderLeft: '4px solid #667EEA',
                                        maxHeight: 460,
                                        overflow: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {text || '(sem conteúdo)'}
                                </Box>
                            </Paper>
                        );
                    })}
                </Paper>
            )}
        </Box>
    );
}
