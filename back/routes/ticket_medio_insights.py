# routes/ticket_medio_insights.py

import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.ticketMedioInsightsController import (
    get_ticket_medio_insights,
    get_ticket_medio_insights_saved_latest,
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

ticket_medio_insights_routes = Blueprint("ticket_medio_insights_routes", __name__)


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


@ticket_medio_insights_routes.get("/ticket-medio/insights")
@token_required
def route_ticket_medio_insights(current_user):
    return get_ticket_medio_insights(current_user=current_user)


@ticket_medio_insights_routes.get("/ticket-medio/insights/saved/latest")
@token_required
def route_ticket_medio_insights_saved_latest(current_user):
    return get_ticket_medio_insights_saved_latest(current_user=current_user)