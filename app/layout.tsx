
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { TeamSelectionProvider } from "@/lib/team-selection-context";
import { HeaderContent } from "@/components/header-content";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Belgium Basket Masters Veterans",
  description: "Suivi du championnat de basketball vétérans (+35 ans) en Belgique",
  icons: {
    icon: "/logos/masters-league.jpeg",
    shortcut: "/logos/masters-league.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <LocaleProvider>
            <TeamSelectionProvider>
              <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-blue-50">
                <HeaderContent />
                {/* Main content */}
                {children}
                <Toaster />
              </div>
            </TeamSelectionProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
