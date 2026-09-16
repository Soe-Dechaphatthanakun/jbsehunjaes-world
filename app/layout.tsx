import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jbsehunjae's World",
  description: "မြန်မာစာတန်းထိုး ဇာတ်ကားများနှင့် ဇာတ်လမ်းတွဲများကို Jbsehunjae's World တွင် ကြည့်ရှုနိုင်ပါသည်။",
  keywords: "jbsehunjae, jbsehunjae's world, myanmar movies, series, watch movies online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
