import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.previsaoVendasController import (
    create_previsao_venda,
    list_previsao_vendas,
    get_previsao_venda,
    update_previsao_venda,
    delete_previsao_venda,
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

previsao_vendas_routes = Blueprint("previsao_vendas_routes", __name__)


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


@previsao_vendas_routes.post("/previsao-vendas")
@token_required
def route_create(current_user):
    return create_previsao_venda(current_user)


@previsao_vendas_routes.get("/previsao-vendas")
@token_required
def route_list(current_user):
    user_id = request.args.get("user_id", type=int)
    return list_previsao_vendas(current_user, user_id)


@previsao_vendas_routes.get("/previsao-vendas/<int:venda_id>")
@token_required
def route_get(current_user, venda_id):
    return get_previsao_venda(current_user, venda_id)


@previsao_vendas_routes.put("/previsao-vendas/<int:venda_id>")
@token_required
def route_update(current_user, venda_id):
    return update_previsao_venda(current_user, venda_id)


@previsao_vendas_routes.delete("/previsao-vendas/<int:venda_id>")
@token_required
def route_delete(current_user, venda_id):
    return delete_previsao_venda(current_user, venda_id)
