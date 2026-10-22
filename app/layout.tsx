import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getClient } from "@/lib/client";
import { Providers } from "@/components/layout/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const heading = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const client = getClient();

export const metadata: Metadata = {
  title: `${client.business.name} — AI Admission Assistant (Demo)`,
  description: `${client.business.tagline} A fictional demo of an AI chatbot with lead capture.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${heading.variable} ${body.variable}`}>
      <body>
        <Providers>
          <Navbar name={client.business.name} />
          <main>{children}</main>
          <Footer disclaimer={client.business.disclaimer} />
        </Providers>
      </body>
    </html>
  );
}
