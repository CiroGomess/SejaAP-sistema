# routes/toonInsights.py

import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.toonInsightsController import (
    get_toon_insights,
    get_toon_insights_saved_latest,
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

toon_insights_routes = Blueprint("toon_insights_routes", __name__)


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


@toon_insights_routes.get("/toon/insights")
@token_required
def route_get_toon_insights(current_user):
    user_id = request.args.get("user_id", type=int)
    if not user_id or user_id <= 0:
        return jsonify(
            {
                "error": "Missing or invalid user_id",
                "details": "Envie o id do cliente via querystring. Ex: /toon/insights?user_id=10",
            }
        ), 400

    return get_toon_insights(current_user)


# =========================
# NEW ROUTE: consultar dados já salvos (lote mais recente)
# =========================
@toon_insights_routes.get("/toon/insights/saved/latest")
@token_required
def route_get_toon_insights_saved_latest(current_user):
    user_id = request.args.get("user_id", type=int)
    if not user_id or user_id <= 0:
        return jsonify(
            {
                "error": "Missing or invalid user_id",
                "details": "Envie o id do cliente via querystring. Ex: /toon/insights/saved/latest?user_id=10",
            }
        ), 400

    return get_toon_insights_saved_latest(current_user)
