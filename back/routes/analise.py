import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.analiseMargemController import (
    create_analise_margem,
    list_analises_margem,
    get_analise_margem,
    update_analise_margem,
    delete_analise_margem,
)

from controllers.analiseMargemImportController import (
    import_analise_margem_xlsx,
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

analise_margem_routes_xlsx = Blueprint("analise_margem_routes_xlsx", __name__)


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


@analise_margem_routes_xlsx.post("/analise-margem")
@token_required
def route_create(current_user):
    return create_analise_margem(current_user)


@analise_margem_routes_xlsx.get("/analise-margem")
@token_required
def route_list(current_user):
    user_id = request.args.get("user_id", type=int)
    return list_analises_margem(current_user, user_id)


@analise_margem_routes_xlsx.get("/analise-margem/<int:margem_id>")
@token_required
def route_get(current_user, margem_id):
    return get_analise_margem(current_user, margem_id)


@analise_margem_routes_xlsx.put("/analise-margem/<int:margem_id>")
@token_required
def route_update(current_user, margem_id):
    return update_analise_margem(current_user, margem_id)


@analise_margem_routes_xlsx.delete("/analise-margem/<int:margem_id>")
@token_required
def route_delete(current_user, margem_id):
    return delete_analise_margem(current_user, margem_id)


# -------------------------
# NOVA ROTA IMPORT XLSX
# -------------------------
@analise_margem_routes_xlsx.post("/analise-margem/import-xlsx")
@token_required
def route_import_xlsx(current_user):
    return import_analise_margem_xlsx(current_user)
