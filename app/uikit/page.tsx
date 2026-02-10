"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Home, Calendar, Users, Wallet, BookOpen, 
  ChevronRight, Sparkles, Clock, MapPin, Plus,
  CreditCard, Vote, Settings, LogOut
} from "lucide-react";

// Компонент для превью экрана
function ScreenPreview({ 
  title, 
  children, 
  href 
}: { 
  title: string; 
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
      whileHover={{ y: -5 }}
    >
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 flex items-center justify-between">
        <span className="text-white font-medium text-sm">{title}</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-white/30" />
        </div>
      </div>
      <div className="p-0">
        {children}
      </div>
      {href && (
        <Link href={href}>
          <div className="px-4 py-2 bg-gray-50 text-gray-900 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
            Перейти <ChevronRight className="w-4 h-4" />
          </div>
        </Link>
      )}
    </motion.div>
  );
}

// Мини-версия главного экрана
function StudentDashboardMini() {
  return (
    <div className="p-4 space-y-3 scale-75 origin-top">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-3 text-white">
        <p className="text-xs text-gray-100">Добро пожаловать</p>
        <p className="font-bold text-sm">Анна 👋</p>
      </div>
      
      {/* Balance Card */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-500">Баланс</p>
        <p className="text-xl font-bold text-gray-900">5 занятий</p>
      </div>
      
      {/* Class Card */}
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-sm">Хатха-йога</p>
            <p className="text-xs text-gray-500">10:00 • Зал А</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-900">
            М
          </div>
        </div>
      </div>
    </div>
  );
}

// Мини-версия расписания
function ScheduleMini() {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
  return (
    <div className="p-3 scale-75 origin-top">
      {/* Calendar */}
      <div className="flex gap-2 mb-3">
        {days.map((day, i) => (
          <div key={day} className={`flex-1 text-center py-2 rounded-lg text-xs ${i === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Classes */}
      <div className="space-y-2">
        <div className="bg-white rounded-xl p-3 shadow-sm border-l-4 border-gray-500">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold text-sm">Утренняя йога</p>
              <p className="text-xs text-gray-500">08:00 • Хатха</p>
            </div>
            <span className="text-gray-900 font-bold text-sm">1,500₽</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border-l-4 border-gray-500">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold text-sm">Виньяса</p>
              <p className="text-xs text-gray-500">18:00 • Средний</p>
            </div>
            <span className="text-gray-900 font-bold text-sm">1,800₽</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Мини-версия групп
function GroupsMini() {
  return (
    <div className="p-3 space-y-2 scale-75 origin-top">
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-sm">Утренняя йога</p>
            <p className="text-xs text-gray-500">Пн, Ср, Пт • 10:00</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Users className="w-3 h-3" />
            <span>8/12</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-sm">Вечерняя практика</p>
            <p className="text-xs text-gray-500">Вт, Чт • 19:00</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Users className="w-3 h-3" />
            <span>5/10</span>
          </div>
        </div>
      </div>
      <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 text-sm hover:border-purple-400 hover:text-gray-500 transition-colors">
        + Создать группу
      </button>
    </div>
  );
}

// Мини-версия оплаты
function PaymentsMini() {
  return (
    <div className="p-3 space-y-3 scale-75 origin-top">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 text-white">
        <p className="text-xs text-gray-100">Всего потрачено</p>
        <p className="text-2xl font-bold">26,500 ₽</p>
        <p className="text-xs text-gray-100 mt-1">25 занятий</p>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium">4 занятия</p>
            <p className="text-xs text-gray-500">30.01.2024</p>
          </div>
          <span className="text-sm font-semibold text-green-600">4,500₽</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium">8 занятий</p>
            <p className="text-xs text-gray-500">15.01.2024</p>
          </div>
          <span className="text-sm font-semibold text-green-600">8,500₽</span>
        </div>
      </div>
    </div>
  );
}

// Мини-версия голосований
function VotingMini() {
  return (
    <div className="p-3 space-y-3 scale-75 origin-top">
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-sm">Йога в пятницу?</h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Активно</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full mb-3">
          <div className="h-full w-4/5 bg-gray-500 rounded-full" />
        </div>
        <p className="text-xs text-gray-500 mb-3">8 из 10 голосов</p>
        <div className="flex gap-2">
          <button className="flex-1 py-2 bg-gray-100 text-gray-800 rounded-lg text-xs font-medium">07:30</button>
          <button className="flex-1 py-2 bg-gray-100 text-gray-800 rounded-lg text-xs font-medium">18:00</button>
        </div>
      </div>
    </div>
  );
}

// Мини-версия дашборда тренера
function TrainerDashboardMini() {
  return (
    <div className="p-3 space-y-3 scale-75 origin-top">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-3 text-white">
        <p className="text-xs text-gray-100">Здравствуйте</p>
        <p className="font-bold text-sm">Мария 👋</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl p-2 text-center shadow-sm">
          <p className="text-lg font-bold text-gray-900">3</p>
          <p className="text-xs text-gray-500">Сегодня</p>
        </div>
        <div className="bg-white rounded-xl p-2 text-center shadow-sm">
          <p className="text-lg font-bold text-gray-900">45</p>
          <p className="text-xs text-gray-500">Учеников</p>
        </div>
        <div className="bg-white rounded-xl p-2 text-center shadow-sm">
          <p className="text-lg font-bold text-gray-900">85k</p>
          <p className="text-xs text-gray-500">Доход</p>
        </div>
      </div>
      
      {/* Chart Placeholder */}
      <div className="bg-white rounded-xl p-3 shadow-sm h-20 flex items-end justify-around">
        {[40, 60, 45, 80, 55, 70, 65].map((h, i) => (
          <div key={i} className="w-4 bg-gray-200 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

// Навигация между экранами
const navItems = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/schedule", label: "Расписание", icon: Calendar },
  { href: "/groups", label: "Группы", icon: Users },
  { href: "/payments", label: "Платежи", icon: CreditCard },
  { href: "/journal", label: "Журнал", icon: BookOpen },
];

export default function UIKitPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Sparkles className="w-4 h-4" />
            <span>UI Kit & Mockups</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Дизайн-система Yoga Platform</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Мокапы всех экранов приложения. Нажмите на "Перейти" для просмотра реальной страницы.
          </p>
        </div>

        {/* Student Screens */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-900" />
            </div>
            Экраны ученика
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ScreenPreview title="Главный экран" href="/">
              <StudentDashboardMini />
            </ScreenPreview>
            <ScreenPreview title="Расписание" href="/schedule">
              <ScheduleMini />
            </ScreenPreview>
            <ScreenPreview title="Группы" href="/groups">
              <GroupsMini />
            </ScreenPreview>
            <ScreenPreview title="Платежи" href="/payments">
              <PaymentsMini />
            </ScreenPreview>
            <ScreenPreview title="Голосования" href="/voting">
              <VotingMini />
            </ScreenPreview>
            <ScreenPreview title="Журнал" href="/journal">
              <div className="p-8 text-center text-gray-400 text-sm">
                История посещений
              </div>
            </ScreenPreview>
          </div>
        </div>

        {/* Trainer Screens */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Settings className="w-4 h-4 text-gray-900" />
            </div>
            Экраны тренера
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ScreenPreview title="Дашборд" href="/dashboard">
              <TrainerDashboardMini />
            </ScreenPreview>
            <ScreenPreview title="Студенты" href="/students">
              <div className="p-8 text-center text-gray-400 text-sm">
                Список студентов
              </div>
            </ScreenPreview>
            <ScreenPreview title="Журнал тренера" href="/trainer-journal">
              <div className="p-8 text-center text-gray-400 text-sm">
                Учет посещений
              </div>
            </ScreenPreview>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Быстрые действия</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/purchase">
              <motion.div 
                className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CreditCard className="w-6 h-6 text-gray-900 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Купить занятия</p>
              </motion.div>
            </Link>
            <Link href="/groups/create">
              <motion.div 
                className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-6 h-6 text-gray-900 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Создать группу</p>
              </motion.div>
            </Link>
            <Link href="/voting">
              <motion.div 
                className="p-4 bg-green-50 rounded-xl text-center hover:bg-green-100 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Vote className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Голосования</p>
              </motion.div>
            </Link>
            <motion.div 
              className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-colors cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Выйти</p>
            </motion.div>
          </div>
        </div>

        {/* Navigation Reference */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Навигация</h3>
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-100 hover:text-gray-800 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Yoga Platform UI Kit v1.0</p>
          <p className="mt-1">Последнее обновление: {new Date().toLocaleDateString('ru-RU')}</p>
        </div>
      </div>
    </div>
  );
}
