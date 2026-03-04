import type { NextAuthConfig } from "next-auth";

export default {
  pages: {
    signIn: "/login",
    newUser: "/projects",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/projects");
      const isOnEditor = nextUrl.pathname.startsWith("/editor");
      const isOnSettings = nextUrl.pathname.startsWith("/settings");

      if (isOnDashboard || isOnEditor || isOnSettings) {
        return isLoggedIn;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
