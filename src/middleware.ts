import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Session cookie check for Auth.js / NextAuth v5
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    const callbackUrl = `${pathname}${search}`;
    let feature = "Feature";
    if (pathname.startsWith("/compare")) feature = "Compare";
    else if (pathname.startsWith("/predictor")) feature = "Predictor";
    else if (pathname.startsWith("/shortlist")) feature = "Shortlist";

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    loginUrl.searchParams.set("feature", feature);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/shortlist",
    "/shortlist/:path*",
    "/compare",
    "/compare/:path*",
    "/predictor",
    "/predictor/:path*",
  ],
};