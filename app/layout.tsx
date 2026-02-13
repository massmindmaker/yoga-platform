import type { Metadata, Viewport } from "next";
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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
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
