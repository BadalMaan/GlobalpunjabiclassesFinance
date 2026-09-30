import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Finance",
  description: "Private finance and partner management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}