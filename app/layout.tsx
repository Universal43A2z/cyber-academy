import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "F1 STACKMIND Cyber Academy",
  description:
    "A cybersecurity career training platform for mentors and mentees. Weekly modules, OTP-verified accounts, attendance, and quiz challenges.",
  icons: [{ rel: "icon", url: "/f1-stackmind-logo.png" }],
};

export const viewport: Viewport = {
  themeColor: "#04070d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${jetbrainsMono.variable}`}>
      <body className="scanline min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}