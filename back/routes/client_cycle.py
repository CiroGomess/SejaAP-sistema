# routes/client_cycle.py

import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.clientCycleController import (
    create_client_cycle_single,
    list_client_cycles,
    get_client_cycle_by_user,
    upsert_client_cycle_single,
    delete_client_cycle_by_user,
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

client_cycle_routes = Blueprint("client_cycle_routes", __name__)


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


@client_cycle_routes.post("/client-cycle-single")
@token_required
def route_create_cycle(current_user):
    return create_client_cycle_single(current_user)


@client_cycle_routes.get("/client-cycle-single")
@token_required
def route_list_cycles(current_user):
    user_id = request.args.get("user_id")
    return list_client_cycles(current_user, user_id=user_id)


@client_cycle_routes.get("/client-cycle-single/<string:user_id>")
@token_required
def route_get_cycle(current_user, user_id):
    return get_client_cycle_by_user(current_user, user_id)


@client_cycle_routes.put("/client-cycle-single")
@token_required
def route_upsert_cycle(current_user):
    return upsert_client_cycle_single(current_user)


@client_cycle_routes.delete("/client-cycle-single/<string:user_id>")
@token_required
def route_delete_cycle(current_user, user_id):
    return delete_client_cycle_by_user(current_user, user_id)