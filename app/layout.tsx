import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TelegramProvider } from "@/components/providers/telegram-provider";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { Toaster } from "@/components/ui/sonner";
import { ModeProvider } from "@/src/hooks/use-mode";
import { ThemeToggle } from "@/components/theme-toggle";

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

// Script to prevent theme flash on load
const themeScript = `
  (function() {
    function getTheme() {
      const theme = localStorage.getItem('theme');
      if (theme === 'dark' || theme === 'light') return theme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (getTheme() === 'dark') {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased font-sans">
        <TelegramProvider>
          <ModeProvider>
            <ThemeToggle />
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
