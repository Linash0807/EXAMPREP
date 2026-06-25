import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ZustandHydration from "@/components/providers/ZustandHydration";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GATE 2027 AI Preparation Command Center",
  description: "Futuristic preparation tracker for GATE 2027. Tracks hours, schedules revisions, evaluates feasibility, solves backlog recovery, and computes readiness.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="min-h-full bg-[#050508] text-zinc-100 flex overflow-hidden">
        <ZustandHydration>
          <div className="flex w-full h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto bg-zinc-950/10">
                {children}
              </main>
            </div>
          </div>
        </ZustandHydration>
      </body>
    </html>
  );
}
