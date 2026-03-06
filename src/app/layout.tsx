import type { Metadata } from "next";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { SessionProvider } from "@/providers/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipMotion - Create Animated Shorts",
  description: "Web-based animation studio for creating 30-second animated shorts with timeline-based keyframe animation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-gray-950 text-white">
        <ClerkProvider>
          <header className="sticky top-0 z-50 flex items-center justify-end gap-2 border-b border-white/10 bg-gray-950/85 px-4 py-2 backdrop-blur">
            <Show when="signed-out">
              <SignInButton mode="redirect">
                <button className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-800">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button className="rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-500">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          <SessionProvider>{children}</SessionProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
