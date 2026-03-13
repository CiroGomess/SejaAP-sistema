# ticketMedio.py

import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.ticketMedioController import (
    list_ticket_medio_produtos,
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

ticket_medio_routes = Blueprint("ticket_medio_routes", __name__)


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


@ticket_medio_routes.get("/ticket-medio-produtos")
@token_required
def route_list_ticket_medio_produtos(current_user):
    user_id = request.args.get("user_id")

    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=10, type=int)

    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    q = request.args.get("q")

    year_a = request.args.get("year_a", default=2024, type=int)
    year_b = request.args.get("year_b", default=2025, type=int)

    return list_ticket_medio_produtos(
        current_user=current_user,
        user_id=user_id,
        page=page,
        per_page=per_page,
        date_from=date_from,
        date_to=date_to,
        q=q,
        year_a=year_a,
        year_b=year_b,
    )