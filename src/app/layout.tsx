import type { Metadata } from "next";
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
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
