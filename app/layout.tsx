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
  title: "ServeBox | Tubos de tênis para condomínios",
  description:
    "Gestão de planos de tubos de tênis para condomínios com Next.js e TypeORM.",
};

export const dynamic = "force-dynamic";

const themeScript = `
(() => {
  try {
    const key = "servebox-theme";
    const stored = window.localStorage.getItem(key);
    const mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const theme = mode === "system" ? systemTheme : mode;
    document.documentElement.dataset.themeMode = mode;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.themeMode = "system";
  }
})();
`;

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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AppShell condominiums={condominiums}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}

