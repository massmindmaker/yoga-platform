"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  withHeader?: boolean;
  withNav?: boolean;
  animate?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
};

export function PageContainer({
  children,
  className,
  withHeader = true,
  withNav = true,
  animate = true,
}: PageContainerProps) {
  const paddingBottom = withNav ? "pb-20" : "pb-4";
  const paddingTop = withHeader ? "" : "pt-4";

  if (animate) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "min-h-screen bg-gray-50",
          paddingBottom,
          paddingTop,
          className
        )}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50",
        paddingBottom,
        paddingTop,
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      transition={{ delay }}
      className={cn("px-4", className)}
    >
      {children}
    </motion.div>
  );
}
