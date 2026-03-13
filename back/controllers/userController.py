import os
import jwt
from datetime import datetime, timedelta
from flask import request, jsonify
from passlib.hash import django_pbkdf2_sha256

from config.db import get_connection
from utils.helpers import generate_secure_id


JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "120"))


def _row_to_user_dict(row):
    # Fallback: se por algum motivo o SELECT não trouxer client_id
    # (ou vier com menos colunas), não quebra — retorna None.
    client_id = None
    if row and len(row) > 11:
        client_id = row[11]

    return {
        "id": row[0],
        "password": row[1],
        "last_login": row[2],
        "is_superuser": row[3],
        "username": row[4],
        "first_name": row[5],
        "last_name": row[6],
        "email": row[7],
        "is_staff": row[8],
        "is_active": row[9],
        "date_joined": row[10],
        "client_id": client_id,
    }


def generate_token(user):
    payload = {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "client_id": user.get("client_id"),
        "exp": datetime.utcnow() + timedelta(minutes=JWT_EXPIRES_MINUTES),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def register_user():
    data = request.get_json(silent=True) or {}

    required = ["username", "email", "password", "first_name", "last_name"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    username = data["username"].strip()
    email = data["email"].strip().lower()
    password = data["password"]
    first_name = data["first_name"].strip()
    last_name = data["last_name"].strip()

    # client_id pode vir ou não (se não vier, salva NULL)
    client_id = data.get("client_id")
    if client_id in ("", None):
        client_id = None
    else:
        try:
            client_id = int(client_id)
        except Exception:
            return jsonify({"error": "client_id must be an integer"}), 400

    password_hash = django_pbkdf2_sha256.hash(password)

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("SELECT id FROM auth_user WHERE username = %s LIMIT 1;", (username,))
        if cur.fetchone():
            return jsonify({"error": "username already exists"}), 409

        cur.execute("SELECT id FROM auth_user WHERE email = %s LIMIT 1;", (email,))
        if cur.fetchone():
            return jsonify({"error": "email already exists"}), 409

        # GERAÇÃO DO ID SEGURO
        novo_id = generate_secure_id()

        cur.execute(
            """
            INSERT INTO auth_user
                (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined, client_id)
            VALUES
                (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, username, email, first_name, last_name, client_id;
            """,
            (
                novo_id,
                password_hash,
                None,
                False,
                username,
                first_name,
                last_name,
                email,
                False,
                True,
                datetime.utcnow(),
                client_id,
            ),
        )

        row = cur.fetchone()
        conn.commit()

        return jsonify(
            {
                "message": "User created",
                "user": {
                    "id": row[0],
                    "username": row[1],
                    "email": row[2],
                    "first_name": row[3],
                    "last_name": row[4],
                    "client_id": row[5],
                },
            }
        ), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "register failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def login_user():
    data = request.get_json(silent=True) or {}

    login_value = (data.get("username") or data.get("email") or "").strip()
    password = data.get("password") or ""

    if not login_value or not password:
        return jsonify({"error": "username/email and password are required"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT id, password, last_login, is_superuser, username, first_name, last_name, email,
                   is_staff, is_active, date_joined, client_id
            FROM auth_user
            WHERE username = %s OR email = %s
            LIMIT 1;
            """,
            (login_value, login_value.lower()),
        )

        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Invalid credentials"}), 401

        user = _row_to_user_dict(row)

        if not user["is_active"]:
            return jsonify({"error": "User is inactive"}), 403

        if not django_pbkdf2_sha256.verify(password, user["password"]):
            return jsonify({"error": "Invalid credentials"}), 401

        now_utc = datetime.utcnow()
        cur.execute(
            "UPDATE auth_user SET last_login = %s WHERE id = %s;",
            (now_utc, user["id"]),
        )
        conn.commit()

        token = generate_token(user)

        return jsonify(
            {
                "message": "Login success",
                "token": token,
                "user": {
                    "id": user["id"],
                    "username": user["username"],
                    "email": user["email"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "client_id": user.get("client_id"),
                    "is_superuser": bool(user["is_superuser"]),
                    "is_staff": bool(user["is_staff"]),
                    "is_active": bool(user["is_active"]),
                    "last_login": now_utc.isoformat() + "Z",
                },
            }
        ), 200

    except Exception as e:
        return jsonify({"error": "login failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def list_users(current_user):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT id, username, email, first_name, last_name, client_id,
                   is_active, is_staff, is_superuser, date_joined, last_login
            FROM auth_user
            ORDER BY id ASC;
            """
        )
        rows = cur.fetchall()

        users = []
        for r in rows:
            users.append(
                {
                    "id": r[0],
                    "username": r[1],
                    "email": r[2],
                    "first_name": r[3],
                    "last_name": r[4],
                    "client_id": r[5],
                    "is_active": r[6],
                    "is_staff": r[7],
                    "is_superuser": r[8],
                    "date_joined": str(r[9]) if r[9] else None,
                    "last_login": str(r[10]) if r[10] else None,
                }
            )

        return jsonify({"users": users, "requested_by": current_user}), 200

    except Exception as e:
        return jsonify({"error": "list failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def get_user(current_user, user_id: str):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                u.id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.client_id,
                c.code AS client_code,
                u.is_active,
                u.is_staff,
                u.is_superuser,
                u.date_joined,
                u.last_login
            FROM auth_user u
            LEFT JOIN public.clientes c ON c.id = u.client_id
            WHERE u.id = %s
            LIMIT 1;
            """,
            (user_id,),
        )

        r = cur.fetchone()
        if not r:
            return jsonify({"error": "User not found"}), 404

        return jsonify(
            {
                "user": {
                    "id": r[0],
                    "username": r[1],
                    "email": r[2],
                    "first_name": r[3],
                    "last_name": r[4],
                    "client_id": r[5],
                    "client_code": r[6],
                    "is_active": r[7],
                    "is_staff": r[8],
                    "is_superuser": r[9],
                    "date_joined": str(r[10]) if r[10] else None,
                    "last_login": str(r[11]) if r[11] else None,
                },
                "requested_by": current_user,
            }
        ), 200

    except Exception as e:
        return jsonify({"error": "get failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def update_user(current_user, user_id: str):
    data = request.get_json(silent=True) or {}

    allowed = {
        "username",
        "email",
        "first_name",
        "last_name",
        "is_active",
        "is_staff",
        "is_superuser",
        "password",
        "client_id",
    }
    payload = {k: data[k] for k in data.keys() if k in allowed}

    if not payload:
        return jsonify({"error": "No valid fields to update"}), 400

    if "password" in payload and payload["password"]:
        payload["password"] = django_pbkdf2_sha256.hash(payload["password"])
    elif "password" in payload and not payload["password"]:
        payload.pop("password")

    # client_id pode ser None ou int
    if "client_id" in payload:
        if payload["client_id"] in ("", None):
            payload["client_id"] = None
        else:
            try:
                payload["client_id"] = int(payload["client_id"])
            except Exception:
                return jsonify({"error": "client_id must be an integer"}), 400

    set_parts = []
    values = []
    for k, v in payload.items():
        set_parts.append(f"{k} = %s")
        values.append(v)

    values.append(user_id)

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            f"UPDATE auth_user SET {', '.join(set_parts)} WHERE id = %s;",
            tuple(values)
        )
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "User not found"}), 404

        conn.commit()
        return jsonify({"message": "User updated", "requested_by": current_user}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "update failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def delete_user(current_user, user_id: str):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM auth_user WHERE id = %s;", (user_id,))
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "User not found"}), 404

        conn.commit()
        return jsonify({"message": "User deleted", "requested_by": current_user}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "delete failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()