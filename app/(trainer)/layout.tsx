"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, BookOpen, Wallet } from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Панель", icon: LayoutDashboard, href: "/dashboard" },
  { id: "groups", label: "Группы", icon: Users, href: "/groups" },
  { id: "journal", label: "Журнал", icon: BookOpen, href: "/trainer-journal" },
  { id: "payments", label: "Платежи", icon: Wallet, href: "/trainer-payments" },
];

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md mx-auto"
      >
        {children}
      </motion.main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            const Icon = tab.icon;
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="flex flex-col items-center justify-center w-16 h-full relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gray-100 rounded-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                <div className="relative z-10 flex flex-col items-center">
                  <Icon
                    size={20}
                    className={isActive ? "text-gray-900" : "text-gray-400"}
                  />
                  <span
                    className={`text-[10px] mt-1 ${
                      isActive ? "text-gray-900 font-medium" : "text-gray-400"
                    }`}
                  >
                    {tab.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
