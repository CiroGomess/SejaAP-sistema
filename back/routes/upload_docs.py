import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.uploadDocsController import (
    upload_doc_cliente,
    list_docs_clientes,
    get_doc_cliente,
    download_doc_cliente,
    update_doc_cliente,
    replace_doc_file,
    delete_doc_cliente,
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

upload_docs_routes = Blueprint("upload_docs_routes", __name__)


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


# CREATE (upload)
@upload_docs_routes.post("/docs-clientes/upload")
@token_required
def route_upload_doc_cliente(current_user):
    return upload_doc_cliente(current_user)


# LIST
@upload_docs_routes.get("/docs-clientes")
@token_required
def route_list_docs_clientes(current_user):
    id_cliente = request.args.get("id_cliente")
    categoria = request.args.get("categoria")

    # normaliza id_cliente
    id_cliente_int = None
    if id_cliente is not None and str(id_cliente).strip():
        try:
            id_cliente_int = int(id_cliente)
        except Exception:
            return jsonify({"error": "Invalid id_cliente"}), 400

    return list_docs_clientes(current_user, id_cliente=id_cliente_int, categoria=categoria)


# GET BY ID (metadata)
@upload_docs_routes.get("/docs-clientes/<int:doc_id>")
@token_required
def route_get_doc_cliente(current_user, doc_id):
    return get_doc_cliente(current_user, doc_id)


# READ/DOWNLOAD FILE
@upload_docs_routes.get("/docs-clientes/<int:doc_id>/download")
@token_required
def route_download_doc_cliente(current_user, doc_id):
    return download_doc_cliente(current_user, doc_id)


# UPDATE metadata
@upload_docs_routes.put("/docs-clientes/<int:doc_id>")
@token_required
def route_update_doc_cliente(current_user, doc_id):
    return update_doc_cliente(current_user, doc_id)


# REPLACE file
@upload_docs_routes.put("/docs-clientes/<int:doc_id>/upload")
@token_required
def route_replace_doc_file(current_user, doc_id):
    return replace_doc_file(current_user, doc_id)


# DELETE
@upload_docs_routes.delete("/docs-clientes/<int:doc_id>")
@token_required
def route_delete_doc_cliente(current_user, doc_id):
    return delete_doc_cliente(current_user, doc_id)
