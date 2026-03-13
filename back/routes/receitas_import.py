import os
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify

from controllers.receitaImportController import import_receitas_xlsx

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")

receitas_import_routes = Blueprint("receitas_import_routes", __name__)


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


@receitas_import_routes.post("/receitas/import-xlsx")
@token_required
def route_import_receitas_xlsx(current_user):
    return import_receitas_xlsx(current_user)