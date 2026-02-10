"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { UserProvider } from "@/src/hooks/use-user-context";
import { motion } from "framer-motion";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50 pb-20">
        <motion.main
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-md mx-auto"
        >
          {children}
        </motion.main>
        <BottomNav />
      </div>
    </UserProvider>
  );
}
