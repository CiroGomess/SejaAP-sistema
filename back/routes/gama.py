# routes/gama.py

import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.gamaController import generate_gama_presentation_from_latest_insights

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

gama_routes = Blueprint("gama_routes", __name__)


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


@gama_routes.post("/gama/presentation/from-latest")
@token_required
def route_generate_gama_from_latest(current_user):
    user_id = request.args.get("user_id")
    if not user_id or not str(user_id).strip():
        return jsonify(
            {
                "error": "Missing or invalid user_id",
                "details": "Ex: POST /gama/presentation/from-latest?user_id=<hash>",
            }
        ), 400

    return generate_gama_presentation_from_latest_insights(current_user)