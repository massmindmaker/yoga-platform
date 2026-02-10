"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/src/hooks/use-theme";

export function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme, mounted } = useTheme();

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800"
        aria-label="Toggle theme"
      >
        <Sun className="w-5 h-5 text-gray-400" />
      </button>
    );
  }

  const getIcon = () => {
    switch (theme) {
      case "dark":
        return <Moon className="w-5 h-5 text-white" />;
      case "system":
        return <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-300" />;
      default:
        return <Sun className="w-5 h-5 text-amber-500" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "dark":
        return "Тёмная";
      case "system":
        return "Системная";
      default:
        return "Светлая";
    }
  };

  const getBgColor = () => {
    switch (theme) {
      case "dark":
        return "bg-gray-800 border-gray-700";
      case "system":
        return resolvedTheme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-gray-100 border-gray-300";
      default:
        return "bg-white border-gray-200";
    }
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border-2 transition-colors ${getBgColor()}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      title={`Тема: ${getLabel()}`}
    >
      {getIcon()}
      <span
        className={`text-sm font-medium ${
          resolvedTheme === "dark" ? "text-white" : "text-gray-700"
        }`}
      >
        {getLabel()}
      </span>
    </motion.button>
  );
}
