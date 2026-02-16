import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { TelegramProvider } from "@/components/providers/telegram-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Yoga Platform",
  description: "Платформа для записи на занятия йогой",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased font-sans">
        <TelegramProvider>
          <div className="min-h-screen bg-background">
            {children}
          </div>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: "#111827",
                color: "#FFFFFF",
                border: "none",
              },
            }}
          />
        </TelegramProvider>
      </body>
    </html>
  );
}
