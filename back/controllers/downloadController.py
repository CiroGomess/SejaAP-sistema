# controllers/downloadController.py

import os
from flask import send_file, jsonify
from config.db import get_connection

# Define a pasta raiz onde o Flask está rodando (geralmente a pasta 'back')
BASE_DIR = os.getcwd()


def download_document_by_id(doc_id: str):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        # 1. Busca o caminho do arquivo no banco pelo ID
        cur.execute(
            """
            SELECT caminho_arquivo
            FROM public.docs_clientes
            WHERE id = %s
            LIMIT 1;
            """,
            (doc_id,),
        )
        row = cur.fetchone()

        # Se não achou o registro no banco de dados
        if not row:
            return jsonify({"error": "Document not found", "message": "ID não existe no banco de dados."}), 404

        # O caminho salvo no banco (ex: "docs/Mariana_Alves/arquivo.pdf")
        relative_path = row[0]

        if not relative_path:
            return jsonify({"error": "Invalid path", "message": "O caminho do arquivo está vazio no banco."}), 400

        # Remove barras iniciais para garantir que o join funcione
        clean_relative_path = relative_path.lstrip("/\\")

        # Cria o caminho absoluto
        file_path = os.path.join(BASE_DIR, clean_relative_path)

        # 3. Verifica se o arquivo físico existe no disco
        if not os.path.exists(file_path):
            return jsonify({
                "error": "File missing",
                "message": f"O arquivo não foi encontrado no servidor.\nCaminho buscado: {file_path}"
            }), 404

        # 4. Pega o nome do arquivo para o download
        filename = os.path.basename(file_path)

        # 5. Envia o arquivo
        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        print(f"Erro crítico no download: {e}")
        return jsonify({"error": "Internal Error", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()