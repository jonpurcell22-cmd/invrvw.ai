import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Intrvw.ai — AI Interview Coaching",
    template: "%s · Intrvw.ai",
  },
  description:
    "Practice the interview you're actually walking into. Tailored questions from your resume and job description. Scored answers with personalized coaching. Free to start.",
  metadataBase: new URL("https://intrvw.ai"),
  openGraph: {
    title: "Intrvw.ai — AI Interview Coaching",
    description:
      "Tailored questions. Scored answers. Personalized coaching built from your actual background. Free to start — no signup required.",
    url: "https://intrvw.ai",
    siteName: "Intrvw.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intrvw.ai — AI Interview Coaching",
    description:
      "Practice the interview you're actually walking into. Free to start.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--fg)]">
        {children}
      </body>
    </html>
  );
}
