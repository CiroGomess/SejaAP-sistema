import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.dashclienteController import get_dash_cliente

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

dashcliente_routes = Blueprint("dashcliente_routes", __name__)


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


@dashcliente_routes.get("/dashcliente")
@token_required
def route_get_dash_cliente(current_user):
    user_id = request.args.get("user_id")
    year = request.args.get("year", type=int)

    if not user_id or not str(user_id).strip():
        return jsonify({"error": "user_id é obrigatório"}), 400

    return get_dash_cliente(
        current_user=current_user,
        user_id=user_id,
        year=year,
    )