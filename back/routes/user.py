import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.userController import (
    register_user,
    login_user,
    list_users,
    get_user,
    update_user,
    delete_user,
)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

user_routes = Blueprint("user_routes", __name__)


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


@user_routes.post("/users/register")
def route_register():
    return register_user()


@user_routes.post("/users/login")
def route_login():
    return login_user()


@user_routes.get("/users")
@token_required
def route_list_users(current_user):
    return list_users(current_user)


@user_routes.get("/users/<int:user_id>")
@token_required
def route_get_user(current_user, user_id):
    return get_user(current_user, user_id)


@user_routes.put("/users/<int:user_id>")
@token_required
def route_update_user(current_user, user_id):
    return update_user(current_user, user_id)


@user_routes.delete("/users/<int:user_id>")
@token_required
def route_delete_user(current_user, user_id):
    return delete_user(current_user, user_id)
