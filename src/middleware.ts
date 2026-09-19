import { NextResponse, type NextRequest } from "next/server";

// Host-based routing: admin.<domain> serves the /admin app at the root; the public host never exposes /admin.
// If ADMIN_HOST is unset (local dev), /admin is reachable directly on the single host.
export function middleware(req: NextRequest) {
  const adminHost = process.env.ADMIN_HOST;
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const { pathname } = req.nextUrl;
  if (!adminHost) return NextResponse.next();

  if (host === adminHost) {
    if (pathname.startsWith("/api/")) return NextResponse.next();
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.replace(/^\/admin/, "") || "/";
      return NextResponse.redirect(url, 308);
    }
    const url = req.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    const res = NextResponse.rewrite(url);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
