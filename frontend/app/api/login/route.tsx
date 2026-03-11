import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5000";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const identifier = String(body?.identifier ?? "").trim();
  const password = String(body?.password ?? "").trim();

  if (!identifier || !password) {
    return NextResponse.json(
      { success: false, message: "Informe usuário/e-mail e senha." },
      { status: 400 }
    );
  }

  const r = await fetch(`${BACKEND_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: identifier,
      password,
    }),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    return NextResponse.json(
      {
        success: false,
        message: data?.error || data?.message || "Usuário ou senha inválidos.",
      },
      { status: r.status }
    );
  }

  const token = String(data?.token ?? "");
  const user = data?.user ?? null;

  if (!token || !user?.id) {
    return NextResponse.json(
      { success: false, message: "Resposta inválida do backend." },
      { status: 500 }
    );
  }

  // ✅ role baseado no backend
  const isSuperuser = !!user?.is_superuser;
  const role = isSuperuser ? "admin" : "client";

  const res = NextResponse.json({ success: true, token, user });

  // 🔐 Cookie que prova sessão/logado (httpOnly)
  res.cookies.set("sejaap_refresh", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  // (opcional) cookie acessível no browser (você já usa no front)
  res.cookies.set("sejaap_access", token, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  // ✅ NOVO: role em cookie httpOnly para o middleware controlar rotas
  res.cookies.set("sejaap_role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  // (opcional) ajuda a regra de cliente no futuro
  res.cookies.set("sejaap_user_id", String(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  // (opcional) se existir no payload
  if (user?.client_id != null) {
    res.cookies.set("sejaap_client_id", String(user.client_id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
}