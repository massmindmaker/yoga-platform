import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TelegramProvider } from "@/components/providers/telegram-provider";
import { Toaster } from "@/components/ui/sonner";
import { ModeProvider } from "@/src/hooks/use-mode";

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
  themeColor: "#7C3AED",
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
          <ModeProvider>
            <div className="min-h-screen bg-background">
              {children}
            </div>
          </ModeProvider>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: "#1F2937",
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
