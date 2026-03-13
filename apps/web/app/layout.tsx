import type { Metadata } from "next";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { WebThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aauti Learn — AI-Powered Adaptive Tutoring",
  description:
    "Every child deserves a brilliant, patient tutor who knows exactly where they are and what they need next.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WebThemeProvider>
          <UserProvider>{children}</UserProvider>
        </WebThemeProvider>
      </body>
    </html>
  );
}
