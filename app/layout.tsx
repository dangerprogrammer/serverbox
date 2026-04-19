import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AppShell } from "@/app/_components/app-shell";
import { logoutAdmin } from "@/app/login/actions";
import { getAuthenticatedAdmin } from "@/lib/auth/session";
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
  title: "ServerBox | Bolinhas de tênis para condomínios",
  description:
    "Gestão de planos de bolinhas de tênis para condomínios com Next.js e TypeORM.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await getAuthenticatedAdmin();
  const isAuthenticated = admin !== null;

  const loadSidebarCondominiums = async () => {
    if (!admin) {
      return [] as Array<{ id: string; name: string }>;
    }

    const managementData = await getCondominiumManagementData();

    return managementData.condominiums
      .map((condominium) => ({
        id: condominium.id,
        name: condominium.name,
      }))
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
  };

  const condominiums = await loadSidebarCondominiums();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell logoutAction={logoutAdmin} condominiums={condominiums} isAuthenticated={isAuthenticated}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
