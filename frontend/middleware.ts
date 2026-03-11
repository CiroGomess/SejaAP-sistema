import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isPublicRoute(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/logout") ||
    pathname.startsWith("/api/refresh") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  );
}

function isClientAllowedRoute(pathname: string) {
  return (
    pathname === "/dash-cliente" ||  
    pathname.startsWith("/receitas") ||
    pathname.startsWith("/contabilidade") ||
    pathname.startsWith("/analise") ||
    pathname === "/ticket" ||
    pathname === "/ciclo-operacional" ||
    pathname.startsWith("/curva-abc-produtos")
  );
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  const isLogged = !!req.cookies.get("sejaap_refresh")?.value;
  const role = req.cookies.get("sejaap_role")?.value; 
  const isAdmin = role === "admin";

  // ======================
  // LOGIN PAGE
  // ======================
  if (pathname === "/login" && isLogged) {
    const next = searchParams.get("next");

    // Se tiver ?next=... respeita
    if (next && next.startsWith("/")) {
      const url = req.nextUrl.clone();
      url.pathname = next;
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Senão redireciona pelo papel
    const url = req.nextUrl.clone();
    url.pathname = isAdmin ? "/dashboard" : "/dash-cliente";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // ======================
  // ROTAS PÚBLICAS
  // ======================
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // ======================
  // NÃO LOGADO
  // ======================
  if (!isLogged) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ======================
  // ADMIN → acesso total
  // ======================
  if (isAdmin) return NextResponse.next();

  // ======================
  // CLIENTE → só rotas permitidas
  // ======================
  if (isClientAllowedRoute(pathname)) return NextResponse.next();

  // Cliente tentando rota admin → manda para /receitas
  const url = req.nextUrl.clone();
  url.pathname = "/dash-cliente";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};