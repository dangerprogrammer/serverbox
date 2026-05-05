import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AppShell } from "@/app/_components/app-shell";
import { getCondominiumManagementData } from "@/lib/data/admin-management";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ServerBox | Tubos de tênis para condomínios",
  description:
    "Gestão de planos de tubos de tênis para condomínios com Next.js e TypeORM.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const managementData = await getCondominiumManagementData();
  const condominiums = managementData.condominiums
    .map((condominium) => ({
      id: condominium.id,
      name: condominium.name,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell condominiums={condominiums}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}

