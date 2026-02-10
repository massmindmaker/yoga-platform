"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Wallet, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

const navItems = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/schedule", label: "Расписание", icon: Calendar },
  { href: "/payments", label: "Платежи", icon: Wallet },
  { href: "/journal", label: "Журнал", icon: BookOpen },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
    >
      <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                onClick={() => haptics.light()}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 rounded-xl mx-1 hover:scale-105 active:scale-95",
                  isActive 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                )}
              >
                <div className="relative">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center"
                  >
                    <Icon className={cn(
                      "w-5 h-5 mb-1 transition-transform duration-200",
                      isActive && "scale-110"
                    )} />
                    <span className={cn(
                      "text-[10px] font-medium transition-all",
                      isActive && "font-semibold"
                    )}>
                      {item.label}
                    </span>
                  </motion.div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
