# curvaABCProduto.py
import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.curvaABCProdutoController import (
    list_curva_abc_produtos,
    get_curva_abc_summary
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

curva_abc_produto_routes = Blueprint("curva_abc_produto_routes", __name__)


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


@curva_abc_produto_routes.get("/curva-abc-produtos")
@token_required
def route_list_curva_abc_produtos(current_user):
    """
    Exemplos:
      /curva-abc-produtos?user_id=10&tipo=produto
      /curva-abc-produtos?user_id=10&tipo=cliente
      /curva-abc-produtos?user_id=10&tipo=produto&year_a=2024&year_b=2025
    """

    user_id = request.args.get("user_id", type=int)

    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=10, type=int)

    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    q = request.args.get("q")

    a_limit = request.args.get("a_limit", default=0.80, type=float)
    b_limit = request.args.get("b_limit", default=0.95, type=float)
    tipo = request.args.get("tipo", default="produto", type=str)

    return list_curva_abc_produtos(
        current_user=current_user,
        user_id=user_id,
        page=page,
        per_page=per_page,
        date_from=date_from,
        date_to=date_to,
        q=q,
        a_limit=a_limit,
        b_limit=b_limit,
        tipo=tipo,
    )


@curva_abc_produto_routes.get("/curva-abc-summary")
@token_required
def route_get_curva_abc_summary(current_user):
    """
    Retorna os totais para os cards do dashboard.
    Exemplo: /curva-abc-summary?user_id=10&year=2025
    """
    user_id = request.args.get("user_id", type=int)
    year = request.args.get("year", type=int)

    return get_curva_abc_summary(
        current_user=current_user,
        user_id=user_id,
        year=year
    )