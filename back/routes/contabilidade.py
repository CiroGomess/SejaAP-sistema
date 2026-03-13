import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.contabilidadeController import (
    upload_contabilidade,
    get_contabilidade_dados,
    get_contabilidade_dashboard,
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

contabilidade_routes = Blueprint("contabilidade_routes", __name__)

# --- Decorator de Autenticação ---
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

# --- Rotas da Contabilidade ---

@contabilidade_routes.post("/contabilidade/upload")
@token_required
def route_upload_contabilidade(current_user):
    """
    Rota para upload de Excel/CSV.
    Inputs (form-data): file, user_id, ano, categoria
    """
    return upload_contabilidade(current_user)


@contabilidade_routes.get("/contabilidade")
@token_required
def route_get_contabilidade(current_user):
    """
    Rota para listar dados com paginação.
    Query Params lidos no controller:
      ?user_id=<hash>
      &ano=2024
      &page=1
      &per_page=10
    """
    return get_contabilidade_dados(current_user)


@contabilidade_routes.get("/contabilidade/dashboard")
@token_required
def route_get_contabilidade_dashboard(current_user):
    """
    GET /contabilidade/dashboard?user_id=<hash>&ano=2026
    """
    return get_contabilidade_dashboard(current_user)