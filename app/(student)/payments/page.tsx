"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowRight, CreditCard, TrendingUp, Calendar, CheckCircle2, Receipt } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorFallbackInline } from "@/components/ui/error-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/src/hooks/use-user-context";
import { fetchWithRetry } from "@/lib/fetch";

interface PaymentRecord {
  id: string;
  amount: number;
  classesCount: number;
  status: string;
  provider: string;
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

export default function StudentPaymentsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    async function fetchPayments() {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await fetchWithRetry<{ success: boolean; data?: PaymentRecord[]; error?: string }>(
          `/api/payments`
        );
        
        if (data.success) {
          setPayments(data.data || []);
        } else {
          setError(data.error || "Не удалось загрузить платежи");
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError("Не удалось загрузить платежи");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPayments();
  }, [user?.id]);

  const totalSpent = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalClasses = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.classesCount, 0);


  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'COMPLETED': 'Оплачено',
      'PENDING': 'В обработке',
      'FAILED': 'Ошибка',
      'REFUNDED': 'Возвращено',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'COMPLETED': 'bg-green-100 text-green-700',
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'FAILED': 'bg-red-100 text-red-700',
      'REFUNDED': 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader title="Платежи" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 space-y-4"
      >
        {/* Карточка баланса */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-5 h-5 text-white/80" />
                      <span className="text-white/80 text-sm">Текущий баланс</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">{isUserLoading ? "..." : user?.balance || 0}</span>
                      <span className="text-xl text-white/80">
                        {(user?.balance || 0) === 1 ? "занятие" : (user?.balance || 0) <= 4 ? "занятия" : "занятий"}
                      </span>
                    </div>
                  </div>
                  <motion.div
                    className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-white">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-500">Потрачено</span>
                  </div>
                  <p className="font-bold text-gray-900">{isLoading ? "..." : totalSpent.toLocaleString()} ₽</p>
                </div>
                <div className="text-center border-l border-gray-100">
                  <div className="flex items-center justify-center gap-1 mb-1">
                     <Calendar className="w-4 h-4 text-gray-900" />
                    <span className="text-xs text-gray-500">Куплено</span>
                  </div>
                  <p className="font-bold text-gray-900">{isLoading ? "..." : totalClasses} занятий</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* История платежей */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">История платежей</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-14 h-14 rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-1/3 rounded-xl" />
                        <Skeleton className="h-4 w-1/2 rounded-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <p className="text-center text-gray-500 text-sm mt-4">Загрузка платежей...</p>
            </div>
          ) : error ? (
            <ErrorFallbackInline 
              error={error} 
              onRetry={() => window.location.reload()} 
            />
          ) : payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  variants={itemVariants}
                  custom={index}
                  whileHover={{ x: 4 }}
                  className="cursor-pointer"
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{payment.classesCount} занятий</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm text-gray-500">
                                {new Date(payment.createdAt).toLocaleDateString('ru-RU')}
                              </span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(payment.status)}`}>
                                {getStatusLabel(payment.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">
                          {payment.amount.toLocaleString()} ₽
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Receipt}
              title="Нет платежей"
              description="История платежей появится после первой покупки"
            />
          )}
        </motion.div>
      </motion.div>

      {/* Фиксированная кнопка покупки */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-20 left-0 right-0 z-40 px-4 max-w-md mx-auto"
      >
        <Link href="/purchase">
           <Button className="w-full bg-gray-900 hover:bg-black text-white h-14 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all"
          >
            Купить занятия
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
