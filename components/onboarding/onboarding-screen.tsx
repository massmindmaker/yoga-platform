"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ONBOARDING_KEY = "yg_onboarding_seen";
const VIDEO_DURATION = 4000; // 4 секунды видео
const FADE_DURATION = 1000; // 1 секунда затемнения

export function OnboardingScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Показываем только один раз
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem(ONBOARDING_KEY);
      if (!seen) {
        setShow(true);
      }
    }
  }, []);

  const startFadeOut = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setShow(false);
      localStorage.setItem(ONBOARDING_KEY, "1");
    }, FADE_DURATION);
  }, []);

  useEffect(() => {
    if (!show) return;

    // Таймер на 4 секунды, потом затемнение
    const timer = setTimeout(startFadeOut, VIDEO_DURATION);
    return () => clearTimeout(timer);
  }, [show, startFadeOut]);

  // Пропуск по тапу
  const handleSkip = () => {
    if (!fading) startFadeOut();
  };

  if (!show) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            key="onboarding"
            className="fixed inset-0 z-[9999] bg-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: FADE_DURATION / 1000, ease: "easeInOut" }}
            onClick={handleSkip}
          >
            {/* Видео на весь экран */}
            <video
              ref={videoRef}
              src="/onboarding.mp4"
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center" }}
            />

            {/* Затемнение поверх видео */}
            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: fading ? 1 : 0 }}
              transition={{ duration: FADE_DURATION / 1000, ease: "easeInOut" }}
            />

            {/* Нижняя часть — лого + skip */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              {/* Градиент снизу для читаемости текста */}
              <div className="h-40 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 pb-12 px-6 text-center">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                  className="text-3xl font-bold text-white mb-2 tracking-tight"
                >
                  Yoga Studio
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: fading ? 0 : 0.7, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="text-white/70 text-sm"
                >
                  нажмите, чтобы продолжить
                </motion.p>
              </div>
            </div>

            {/* Прогресс-бар сверху */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-safe">
              <div className="h-[3px] bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white/80 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: fading ? "100%" : "80%" }}
                  transition={{ duration: VIDEO_DURATION / 1000, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Приложение всегда рендерится под онбордингом */}
      {children}
    </>
  );
}
