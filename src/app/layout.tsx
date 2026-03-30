import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlowOS - Work Operating System",
  description: "AI-powered workflow automation for modern teams",
  keywords: "workflow, automation, AI, team management, productivity",
  authors: [{ name: "Asanda" }],
  openGraph: {
    title: "FlowOS - Work Operating System",
    description: "AI-powered workflow automation for modern teams",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
