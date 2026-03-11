from datetime import datetime
from flask import request, jsonify
from config.db import get_connection
from passlib.hash import django_pbkdf2_sha256

# Campos aceitos pelo INSERT/UPDATE via API
FIELDS = {
    "code",
    "first_name",
    "last_name",
    "email",
    "document",
    "phone",
    "is_whatsapp",
    "company_name",
    "status",
    "notes",
    "cep",
    "street",
    "number",
    "complement",
    "neighborhood",
    "city",
    "state",
    "created_at",
    "updated_at",
    "IPCA",
}

# Campos aceitos para criar usuário junto
USER_FIELDS = {
    "username",
    "email",
    "password",
    "first_name",
    "last_name",
    "is_active",
    "is_staff",
    "is_superuser",
}

def create_customer():
    data = request.get_json(silent=True) or {}

    # ---- valida cliente ----
    required = ["code", "first_name", "last_name", "email"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    payload = {k: data.get(k) for k in FIELDS if k in data}

    # Defaults
    if not payload.get("status"):
        payload["status"] = "active"
    if "is_whatsapp" not in payload:
        payload["is_whatsapp"] = False

    payload["created_at"] = datetime.utcnow()
    payload["updated_at"] = datetime.utcnow()

    # ---- user opcional ----
    user_in = data.get("user")
    create_user = isinstance(user_in, dict)

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        # ========= 1) CRIA CLIENTE =========
        columns = list(payload.keys())
        values = [payload[c] for c in columns]
        placeholders = ", ".join(["%s"] * len(columns))

        sql_customer = f"""
            INSERT INTO public.clientes ({", ".join(columns)})
            VALUES ({placeholders})
            RETURNING id, code, first_name, last_name, email, status, created_at, updated_at, IPCA;
        """

        cur.execute(sql_customer, tuple(values))
        row = cur.fetchone()
        customer_id = row[0]

        created_user_payload = None

        # ========= 2) CRIA USUÁRIO (SE VIER NO BODY) =========
        if create_user:
            user_payload = {k: user_in.get(k) for k in USER_FIELDS if k in user_in}

            required_user = ["username", "email", "password", "first_name", "last_name"]
            missing_user = [k for k in required_user if not user_payload.get(k)]
            if missing_user:
                conn.rollback()
                return jsonify({"error": f"Missing user fields: {', '.join(missing_user)}"}), 400

            username = str(user_payload["username"]).strip()
            email = str(user_payload["email"]).strip().lower()
            password = str(user_payload["password"])

            first_name = str(user_payload["first_name"]).strip()
            last_name = str(user_payload["last_name"]).strip()

            # defaults do usuário
            is_active = bool(user_payload.get("is_active", True))
            is_staff = bool(user_payload.get("is_staff", False))
            is_superuser = bool(user_payload.get("is_superuser", False))

            # Não deixa criar superuser pela API do cliente (segurança básica)
            # Se você quiser permitir, remova esse bloco.
            if is_superuser:
                conn.rollback()
                return jsonify({"error": "Não é permitido criar superuser por este endpoint."}), 403

            # valida duplicidade
            cur.execute("SELECT id FROM public.auth_user WHERE username = %s LIMIT 1;", (username,))
            if cur.fetchone():
                conn.rollback()
                return jsonify({"error": "username already exists"}), 409

            cur.execute("SELECT id FROM public.auth_user WHERE email = %s LIMIT 1;", (email,))
            if cur.fetchone():
                conn.rollback()
                return jsonify({"error": "email already exists"}), 409

            password_hash = django_pbkdf2_sha256.hash(password)

            # OBS: depende do seu auth_user ter a coluna client_id (passo do SQL)
            cur.execute(
                """
                INSERT INTO public.auth_user
                    (password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined, client_id)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, username, email, first_name, last_name, is_superuser, is_staff, is_active, client_id;
                """,
                (
                    password_hash,
                    None,
                    is_superuser,
                    username,
                    first_name,
                    last_name,
                    email,
                    is_staff,
                    is_active,
                    datetime.utcnow(),
                    customer_id,
                ),
            )

            u = cur.fetchone()
            created_user_payload = {
                "id": u[0],
                "username": u[1],
                "email": u[2],
                "first_name": u[3],
                "last_name": u[4],
                "is_superuser": bool(u[5]),
                "is_staff": bool(u[6]),
                "is_active": bool(u[7]),
                "client_id": u[8],
            }

        # ✅ commita tudo (cliente + user)
        conn.commit()

        response = {
            "message": "Customer created" if not created_user_payload else "Customer + User created",
            "customer": {
                "id": row[0],
                "code": row[1],
                "first_name": row[2],
                "last_name": row[3],
                "email": row[4],
                "status": row[5],
                "created_at": str(row[6]) if row[6] else None,
                "updated_at": str(row[7]) if row[7] else None,
                "IPCA": row[8],
            },
        }

        if created_user_payload:
            response["user"] = created_user_payload

        return jsonify(response), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "create failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def list_customers():
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id, code, first_name, last_name, email, document, phone, is_whatsapp,
                company_name, status, notes, cep, street, number, complement, neighborhood,
                city, state, created_at, updated_at, IPCA
            FROM public.clientes
            ORDER BY id ASC;
            """
        )
        rows = cur.fetchall()

        customers = []
        for r in rows:
            customers.append(
                {
                    "id": r[0],
                    "code": r[1],
                    "first_name": r[2],
                    "last_name": r[3],
                    "email": r[4],
                    "document": r[5],
                    "phone": r[6],
                    "is_whatsapp": r[7],
                    "company_name": r[8],
                    "status": r[9],
                    "notes": r[10],
                    "cep": r[11],
                    "street": r[12],
                    "number": r[13],
                    "complement": r[14],
                    "neighborhood": r[15],
                    "city": r[16],
                    "state": r[17],
                    "created_at": str(r[18]) if r[18] else None,
                    "updated_at": str(r[19]) if r[19] else None,
                    "IPCA": r[20],
                }
            )

        return jsonify({"customers": customers}), 200

    except Exception as e:
        return jsonify({"error": "list failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def get_customer(code: str):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id, code, first_name, last_name, email, document, phone, is_whatsapp,
                company_name, status, notes, cep, street, number, complement, neighborhood,
                city, state, created_at, updated_at, IPCA
            FROM public.clientes
            WHERE code = %s
            LIMIT 1;
            """,
            (code,),
        )

        r = cur.fetchone()
        if not r:
            return jsonify({"error": "Customer not found"}), 404

        return jsonify(
            {
                "customer": {
                    "id": r[0],
                    "code": r[1],
                    "first_name": r[2],
                    "last_name": r[3],
                    "email": r[4],
                    "document": r[5],
                    "phone": r[6],
                    "is_whatsapp": r[7],
                    "company_name": r[8],
                    "status": r[9],
                    "notes": r[10],
                    "cep": r[11],
                    "street": r[12],
                    "number": r[13],
                    "complement": r[14],
                    "neighborhood": r[15],
                    "city": r[16],
                    "state": r[17],
                    "created_at": str(r[18]) if r[18] else None,
                    "updated_at": str(r[19]) if r[19] else None,
                    "IPCA": r[20],
                }
            }
        ), 200

    except Exception as e:
        return jsonify({"error": "get failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def update_customer(code: str):
    data = request.get_json(silent=True) or {}
    payload = {k: data[k] for k in data.keys() if k in FIELDS}

    if not payload:
        return jsonify({"error": "No valid fields to update"}), 400

    payload["updated_at"] = datetime.utcnow()

    set_parts = []
    values = []

    for k, v in payload.items():
        set_parts.append(f"{k} = %s")
        values.append(v)

    values.append(code)

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            f"""
            UPDATE public.clientes
            SET {", ".join(set_parts)}
            WHERE code = %s;
            """,
            tuple(values),
        )

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Customer not found"}), 404

        conn.commit()
        return jsonify({"message": "Customer updated"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "update failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


def delete_customer(code: str):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT id FROM public.clientes WHERE code = %s LIMIT 1;",
            (code,),
        )
        row = cur.fetchone()

        if not row:
            conn.rollback()
            return jsonify({"error": "Customer not found"}), 404

        customer_id = row[0]

        cur.execute("DELETE FROM public.clientes WHERE id = %s;", (customer_id,))

        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Customer not found"}), 404

        conn.commit()
        return jsonify({"message": "Customer deleted", "id": customer_id, "code": code}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "delete failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()