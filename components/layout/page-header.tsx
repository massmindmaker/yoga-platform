"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  rightElement?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function PageHeader({
  title,
  description,
  backHref,
  rightElement,
  className,
  sticky = true,
}: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-white border-b border-gray-100 safe-area-top z-40",
        sticky && "sticky top-0",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </Link>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
            {description && (
              <p className="text-base text-gray-500 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        {rightElement && (
          <div className="flex items-center">{rightElement}</div>
        )}
      </div>
    </motion.header>
  );
}
