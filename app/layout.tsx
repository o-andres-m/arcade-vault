import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const pressStart = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arcade Vault - Juegos Retro Clásicos",
  description:
    "Juega juegos clásicos arcade y compite por el mejor puntaje. Biblioteca de 8 juegos retro con efectos visuales neón y estética CRT.",
  keywords: ["arcade", "juegos retro", "juegos clásicos", "arcade vault", "neón", "pixel art"],
  authors: [{ name: "Arcade Vault" }],
  creator: "Arcade Vault",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${pressStart.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="av-bg" />
        <div className="av-noise" />
        <div id="root">
          <AuthProvider>{children}</AuthProvider>
          <footer
            style={{
              padding: "24px 32px",
              textAlign: "center",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--ink-faint)",
              borderTop: "1px solid var(--line-2)",
            }}
          >
            <div>© 2026 ARCADE VAULT • v1.0.0</div>
            <div style={{ marginTop: "6px", fontSize: "10px" }}>Todos los derechos reservados</div>
          </footer>
        </div>
      </body>
    </html>
  );
}
