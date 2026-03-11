# routes/documentsRoutes.py

import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.donwloadController import download_document_by_id

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

documents_routes = Blueprint("documents_routes", __name__)

# Reutilizando seu decorator de token (Copie isso se estiver em um arquivo utils compartilhado)
def token_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        token = auth.replace("Bearer ", "").strip()
        try:
            decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401

        return fn(decoded, *args, **kwargs)

    return wrapper

# --- ROTA DE DOWNLOAD ---
@documents_routes.get("/documents/download/<int:doc_id>")
@token_required
def route_download_document(current_user, doc_id):
    """
    Rota para baixar arquivo.
    Exemplo: GET /documents/download/4
    """
    return download_document_by_id(doc_id)