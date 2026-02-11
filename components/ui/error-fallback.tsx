"use client";

import { WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  error?: string;
  onRetry?: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <WifiOff className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Не удалось загрузить данные
      </h3>
      {error && (
        <p className="text-sm text-gray-500 mb-4 max-w-xs">
          {error}
        </p>
      )}
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Повторить попытку
        </Button>
      )}
    </div>
  );
}

export function ErrorFallbackInline({ error, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-white rounded-xl shadow-sm">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6 text-gray-500" />
      </div>
      <p className="text-sm text-gray-600 mb-3">
        {error || "Не удалось загрузить данные"}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          size="sm"
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Повторить
        </Button>
      )}
    </div>
  );
}
