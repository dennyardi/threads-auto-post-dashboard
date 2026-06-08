import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Threads Auto Post Dashboard",
  description: "OAuth and dashboard foundation for official Threads publishing workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
