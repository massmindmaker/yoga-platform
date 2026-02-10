import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TelegramProvider } from "@/components/providers/telegram-provider";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
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
  themeColor: "#3BCEAC",
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
            <OnboardingScreen>
              <div className="min-h-screen bg-background">
                {children}
              </div>
            </OnboardingScreen>
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
