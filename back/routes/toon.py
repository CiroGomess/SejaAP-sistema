# toon.py
import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.toonController import toon_abc_ano_recente

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

toon_routes = Blueprint("toon_routes", __name__)


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


@toon_routes.get("/toon")
@token_required
def route_toon(current_user):
    # /toon?user_id=<hash>
    user_id = request.args.get("user_id")
    return toon_abc_ano_recente(current_user, user_id=user_id)