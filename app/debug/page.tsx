"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const logsArray: string[] = [];
    const addLog = (msg: string) => {
      logsArray.push(`${new Date().toLocaleTimeString()}: ${msg}`);
      setLogs([...logsArray]);
    };

    addLog("Начинаем проверку...");

    const info: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Проверяем наличие Telegram
    const hasTelegram = typeof window !== "undefined" && !!window.Telegram;
    const hasWebApp = typeof window !== "undefined" && !!window.Telegram?.WebApp;
    
    info["hasTelegram"] = hasTelegram;
    info["hasWebApp"] = hasWebApp;
    addLog(`Telegram SDK: ${hasTelegram ? 'ДА' : 'НЕТ'}`);
    addLog(`WebApp: ${hasWebApp ? 'ДА' : 'НЕТ'}`);

    if (hasWebApp && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      
      info["initData_present"] = !!tg.initData;
      info["initData_length"] = tg.initData?.length || 0;
      info["initDataUnsafe_present"] = !!tg.initDataUnsafe;
      info["user_present"] = !!tg.initDataUnsafe?.user;
      info["platform"] = tg.platform;
      info["version"] = tg.version;
      
      addLog(`initData: ${tg.initData ? `ДА (${tg.initData.length} символов)` : 'НЕТ'}`);
      addLog(`initDataUnsafe: ${tg.initDataUnsafe ? 'ДА' : 'НЕТ'}`);
      addLog(`user: ${tg.initDataUnsafe?.user ? 'ДА' : 'НЕТ'}`);
      
      if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        info["user_id"] = user.id;
        info["user_firstName"] = user.first_name;
        info["user_lastName"] = user.last_name;
        info["user_username"] = user.username;
        info["user_photoUrl"] = user.photo_url ? "ЕСТЬ" : "НЕТ";
        addLog(`Имя: ${user.first_name}`);
        addLog(`Фото: ${user.photo_url ? 'ЕСТЬ' : 'НЕТ'}`);
      } else {
        addLog("⚠️ НЕТ ДАННЫХ ПОЛЬЗОВАТЕЛЯ!");
        addLog("Возможные причины:");
        addLog("1. Приложение открыто не через Telegram");
        addLog("2. Неверный домен в настройках бота");
        addLog("3. Бот не имеет разрешения на получение данных");
      }
    } else {
      addLog("⚠️ WebApp не найден - вы не в Telegram!");
    }

    setDebugInfo(info);
    
    // Проверяем что будет через 2 секунды (иногда данные приходят с задержкой)
    setTimeout(() => {
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        addLog("✅ Данные появились через 2 секунды!");
        setDebugInfo(prev => ({
          ...prev,
          user_after_delay: window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name
        }));
      }
    }, 2000);
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">🔍 Диагностика Telegram</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
        <h2 className="font-bold text-yellow-800 mb-2">Данные WebApp:</h2>
        <pre className="text-xs overflow-auto bg-white p-2 rounded">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-50 border border-gray-200 p-4 rounded">
        <h2 className="font-bold text-gray-800 mb-2">Логи:</h2>
        <div className="text-sm space-y-1">
          {logs.map((log, i) => (
            <div key={i} className={log.includes("⚠️") ? "text-red-600" : log.includes("✅") ? "text-green-600" : "text-gray-700"}>
              {log}
            </div>
          ))}
        </div>
      </div>

      {!debugInfo.user_present && (
        <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded">
          <h2 className="font-bold text-red-800 mb-2">⚠️ Проблема найдена!</h2>
          <p className="text-sm text-red-700">
            Telegram не передает данные пользователя. Проверьте:
          </p>
          <ol className="text-sm text-red-700 list-decimal list-inside mt-2 space-y-1">
            <li>Открыто ли приложение через кнопку в чате с ботом?</li>
            <li>Совпадает ли домен в BotFather с текущим?</li>
            <li>Включены ли разрешения бота на получение данных?</li>
          </ol>
        </div>
      )}
    </div>
  );
}
