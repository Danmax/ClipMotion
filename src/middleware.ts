import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/projects/:path*",
    "/editor/:path*",
    "/settings/:path*",
    "/characters/:path*",
  ],
};
