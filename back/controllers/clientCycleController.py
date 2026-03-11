# controllers/clientCycleController.py

from flask import request, jsonify
from config.db import get_connection

FIELDS = {
    "user_id",
    "step1", "step2", "step3", "step4",
    "days1", "days2", "days3", "days4",
    "operacional1", "financeiro1",
    "operacional2", "financeiro2",
    "operacional3", "financeiro3",
    "operacional4", "financeiro4",
}

STEP_KEYS = [
    ("step1", "days1", "operacional1", "financeiro1"),
    ("step2", "days2", "operacional2", "financeiro2"),
    ("step3", "days3", "operacional3", "financeiro3"),
    ("step4", "days4", "operacional4", "financeiro4"),
]


def _customer_id_exists(cur, customer_id: int) -> bool:
    cur.execute(
        """
        SELECT 1
        FROM public.clientes
        WHERE id = %s
        LIMIT 1;
        """,
        (customer_id,),
    )
    return cur.fetchone() is not None


def _to_bool(v):
    # aceita true/false, 1/0, "true"/"false"
    if isinstance(v, bool):
        return v
    if v is None:
        return None
    if isinstance(v, int):
        return bool(v)
    if isinstance(v, str):
        s = v.strip().lower()
        if s in ("true", "1", "yes", "y", "sim"):
            return True
        if s in ("false", "0", "no", "n", "nao", "não"):
            return False
    return None


def _validate_payload(data: dict, is_create: bool):
    required = ["user_id"]

    if is_create:
        # create exige tudo
        for a, b, c, d in STEP_KEYS:
            required += [a, b, c, d]

    missing = [k for k in required if data.get(k) is None or data.get(k) == ""]
    if missing:
        return f"Missing fields: {', '.join(missing)}"

    # valida steps/days
    for step_key, days_key, op_key, fin_key in STEP_KEYS:
        if step_key in data and data.get(step_key) is not None:
            if not str(data.get(step_key)).strip():
                return f"Invalid {step_key}: cannot be empty"

        if days_key in data and data.get(days_key) is not None:
            try:
                v = int(data.get(days_key))
            except Exception:
                return f"Invalid {days_key}: must be integer"
            if v < 0:
                return f"Invalid {days_key}: must be >= 0"

        # ✅ valida 1 OU outro (se vier no payload)
        op = _to_bool(data.get(op_key))
        fin = _to_bool(data.get(fin_key))

        if op is not None or fin is not None:
            # se um veio, ambos precisam estar presentes e formar 1-of
            if op is None or fin is None:
                return f"Missing fields: {op_key}, {fin_key}"
            if (1 if op else 0) + (1 if fin else 0) != 1:
                return f"Invalid {step_key}: must select exactly one of {op_key} or {fin_key}"

    return None


def _record_to_dict(r):
    return {
        "id": r[0],
        "user_id": r[1],
        "step1": r[2],
        "step2": r[3],
        "step3": r[4],
        "step4": r[5],
        "days1": r[6],
        "days2": r[7],
        "days3": r[8],
        "days4": r[9],
        "operacional1": r[10],
        "financeiro1": r[11],
        "operacional2": r[12],
        "financeiro2": r[13],
        "operacional3": r[14],
        "financeiro3": r[15],
        "operacional4": r[16],
        "financeiro4": r[17],
        "created_at": r[18].isoformat() if r[18] else None,
        "updated_at": r[19].isoformat() if r[19] else None,
    }


# =========================
# CREATE
# =========================
def create_client_cycle_single(current_user=None):
    data = request.get_json(silent=True) or {}
    err = _validate_payload(data, is_create=True)
    if err:
        return jsonify({"error": err}), 400

    payload = {k: data.get(k) for k in FIELDS if k in data}

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        user_id = int(payload["user_id"])
        if not _customer_id_exists(cur, user_id):
            return jsonify({"error": "Invalid user_id", "details": "user_id must exist in public.clientes.id"}), 400

        cols = list(payload.keys())
        vals = [payload[c] for c in cols]
        placeholders = ", ".join(["%s"] * len(vals))

        sql = f"""
            INSERT INTO public.client_cycle_single ({", ".join(cols)})
            VALUES ({placeholders})
            RETURNING
              id, user_id,
              step1, step2, step3, step4,
              days1, days2, days3, days4,
              operacional1, financeiro1,
              operacional2, financeiro2,
              operacional3, financeiro3,
              operacional4, financeiro4,
              created_at, updated_at;
        """

        cur.execute(sql, tuple(vals))
        r = cur.fetchone()
        conn.commit()

        return jsonify({"message": "Client cycle created", "client_cycle_single": _record_to_dict(r)}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "create failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# LIST (opcional)
# =========================
def list_client_cycles(current_user=None, user_id: int | None = None):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        where_sql = ""
        params = []
        if user_id is not None:
            where_sql = "WHERE user_id = %s"
            params.append(user_id)

        cur.execute(
            f"""
            SELECT
              id, user_id,
              step1, step2, step3, step4,
              days1, days2, days3, days4,
              operacional1, financeiro1,
              operacional2, financeiro2,
              operacional3, financeiro3,
              operacional4, financeiro4,
              created_at, updated_at
            FROM public.client_cycle_single
            {where_sql}
            ORDER BY id ASC;
            """,
            tuple(params),
        )

        rows = cur.fetchall()
        return jsonify({"client_cycles": [_record_to_dict(r) for r in rows]}), 200

    except Exception as e:
        return jsonify({"error": "list failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# GET BY USER_ID
# =========================
def get_client_cycle_by_user(current_user=None, user_id: int = 0):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
              id, user_id,
              step1, step2, step3, step4,
              days1, days2, days3, days4,
              operacional1, financeiro1,
              operacional2, financeiro2,
              operacional3, financeiro3,
              operacional4, financeiro4,
              created_at, updated_at
            FROM public.client_cycle_single
            WHERE user_id = %s
            LIMIT 1;
            """,
            (user_id,),
        )

        r = cur.fetchone()
        if not r:
            return jsonify({"error": "Client cycle not found"}), 404

        return jsonify({"client_cycle_single": _record_to_dict(r)}), 200

    except Exception as e:
        return jsonify({"error": "get failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# UPSERT (recomendado)
# =========================
def upsert_client_cycle_single(current_user=None):
    data = request.get_json(silent=True) or {}

    if not data.get("user_id"):
        return jsonify({"error": "Missing fields: user_id"}), 400

    # no upsert, você pode mandar parcial, mas para ciclo é recomendado mandar tudo
    err = _validate_payload(data, is_create=False)
    if err:
        return jsonify({"error": err}), 400

    user_id = int(data["user_id"])
    payload = {k: data.get(k) for k in FIELDS if k in data and k != "user_id"}

    if not payload:
        return jsonify({"error": "No valid fields to upsert"}), 400

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        if not _customer_id_exists(cur, user_id):
            return jsonify({"error": "Invalid user_id", "details": "user_id must exist in public.clientes.id"}), 400

        insert_cols = ["user_id"] + list(payload.keys())
        insert_vals = [user_id] + [payload[k] for k in payload.keys()]
        placeholders = ", ".join(["%s"] * len(insert_vals))

        set_cols = [f"{k} = EXCLUDED.{k}" for k in payload.keys()]

        sql = f"""
            INSERT INTO public.client_cycle_single ({", ".join(insert_cols)})
            VALUES ({placeholders})
            ON CONFLICT (user_id)
            DO UPDATE SET
              {", ".join(set_cols)}
            RETURNING
              id, user_id,
              step1, step2, step3, step4,
              days1, days2, days3, days4,
              operacional1, financeiro1,
              operacional2, financeiro2,
              operacional3, financeiro3,
              operacional4, financeiro4,
              created_at, updated_at;
        """

        cur.execute(sql, tuple(insert_vals))
        r = cur.fetchone()
        conn.commit()

        return jsonify({"message": "Client cycle upserted", "client_cycle_single": _record_to_dict(r)}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "upsert failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()


# =========================
# DELETE BY USER_ID
# =========================
def delete_client_cycle_by_user(current_user=None, user_id: int = 0):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM public.client_cycle_single WHERE user_id = %s;", (user_id,))
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Client cycle not found"}), 404

        conn.commit()
        return jsonify({"message": "Client cycle deleted"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": "delete failed", "details": str(e)}), 500
    finally:
        if conn:
            conn.close()
