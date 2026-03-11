import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.receitaController import (
    create_receita,
    list_receitas,
    get_receita,
    update_receita,
    delete_receita,
    receita_evolutiva,  
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

receita_routes = Blueprint("receita_routes", __name__)


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


@receita_routes.post("/receitas")
@token_required
def route_create_receita(current_user):
    return create_receita(current_user)


@receita_routes.get("/receitas")
@token_required
def route_list_receitas(current_user):
    user_id = request.args.get("user_id", type=int)
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=10, type=int)

    return list_receitas(
        current_user,
        user_id=user_id,
        page=page,
        per_page=per_page,
    )


@receita_routes.get("/receitas/<int:receita_id>")
@token_required
def route_get_receita(current_user, receita_id):
    return get_receita(current_user, receita_id)


@receita_routes.put("/receitas/<int:receita_id>")
@token_required
def route_update_receita(current_user, receita_id):
    return update_receita(current_user, receita_id)


@receita_routes.delete("/receitas/<int:receita_id>")
@token_required
def route_delete_receita(current_user, receita_id):
    return delete_receita(current_user, receita_id)


@receita_routes.get("/receitas/evolutiva")
@token_required
def route_receita_evolutiva(current_user):
    user_id = request.args.get("user_id", type=int)
    ano = request.args.get("ano", type=int)

    if not user_id or not ano:
        return jsonify({"error": "user_id e ano são obrigatórios"}), 400

    return receita_evolutiva(
        current_user=current_user,
        user_id=user_id,
        ano=ano,
    )