"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Wallet, CreditCard } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  classesCount: number;
  status: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string | null;
  };
}

export default function TrainerPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: fetch from /api/payments (trainer view)
    setIsLoading(false);
    setPayments([]);
  }, []);

  const totalWeek = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Платежи" />

      <div className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-500">Всего</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalWeek.toLocaleString()} ₽
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-500">Платежей</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {payments.length}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Последние платежи</h2>

          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-purple-100 text-purple-600 text-sm">
                              {payment.user?.firstName?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {payment.user?.firstName || 'Неизвестный'} {payment.user?.lastName || ''}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(payment.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-600">
                          +{payment.amount.toLocaleString()} ₽
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CreditCard}
              title="Нет платежей"
              description="Платежи появятся когда ученики оплатят занятия"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
