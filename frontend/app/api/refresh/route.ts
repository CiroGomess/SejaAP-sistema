import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5000";

export async function POST() {
  const refresh = (await cookies()).get("sejaap_refresh")?.value;

  if (!refresh) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const r = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok || !data?.access) {
    const res = NextResponse.json({ success: false }, { status: 401 });
    res.cookies.set("sejaap_access", "", { path: "/", maxAge: 0 });
    res.cookies.set("sejaap_refresh", "", { path: "/", maxAge: 0 });
    return res;
  }

  return NextResponse.json({ success: true, access: data.access });
}