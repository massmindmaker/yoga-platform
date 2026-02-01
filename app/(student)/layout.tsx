"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { motion } from "framer-motion";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <BottomNav />
    </div>
  );
}
