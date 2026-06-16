import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';

import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeBackground } from "./components/ThemeBackground";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "InterviewOS",
  description: "Experience the next decade of hiring intelligence with InterviewOS's AI interviewing platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
        <body className="antialiased">
          <ThemeProvider>
            <ThemeBackground />
            <div className="mesh-bg" />
            <div className="noise-overlay" />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
