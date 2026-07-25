import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Apê 13-01",
  description: "Portal do nosso apartamento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}