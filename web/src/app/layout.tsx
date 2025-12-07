import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Magang Intel – Internship Competition Viewer",
  description: "Temukan lowongan dengan persaingan terendah di MagangHub.",
  icons: {
    icon: '/person.svg',
  },
  other: {
    "google-site-verification": "kbKoahOWVWWj7WtRmYZb8Fgb7JRg6tWSHi3S6GmpAAk",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} antialiased bg-slate-50 text-slate-900`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
