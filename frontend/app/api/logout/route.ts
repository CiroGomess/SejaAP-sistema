import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });

  res.cookies.set("sejaap_access", "", { path: "/", maxAge: 0 });
  res.cookies.set("sejaap_refresh", "", { path: "/", maxAge: 0 });

  return res;
}