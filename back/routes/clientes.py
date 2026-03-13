import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.clientesController import (
    create_customer,
    list_customers,
    get_customer,
    update_customer,
    delete_customer,
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

clientes_routes = Blueprint("clientes_routes", __name__)


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


@clientes_routes.post("/customers")
@token_required
def route_create_customer(current_user):
    return create_customer()


@clientes_routes.get("/customers")
@token_required
def route_list_customers(current_user):
    return list_customers()


@clientes_routes.get("/customers/<string:code>")
@token_required
def route_get_customer(current_user, code):
    return get_customer(code)


@clientes_routes.put("/customers/<string:code>")
@token_required
def route_update_customer(current_user, code):
    return update_customer(code)


@clientes_routes.delete("/customers/<string:code>")
@token_required
def route_delete_customer(current_user, code):
    return delete_customer(code)