import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export const middleware = auth(() => {});

export const config = {
  matcher: [
    "/projects/:path*",
    "/editor/:path*",
    "/settings/:path*",
    "/characters/:path*",
  ],
};
