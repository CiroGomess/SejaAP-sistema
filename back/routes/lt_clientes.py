# routes/lt_clientes.py

import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.ltClienteController import list_lt_clientes

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

lt_clientes_routes = Blueprint("lt_clientes_routes", __name__)


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


@lt_clientes_routes.get("/lt-clientes/<string:user_id>")
@token_required
def route_list_lt_clientes(current_user, user_id):
    # paginação vem por querystring:
    # /lt-clientes/<user_id>?page=1&per_page=100
    return list_lt_clientes(current_user=current_user, user_id=user_id)