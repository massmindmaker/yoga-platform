"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VIDEO_DURATION = 4000;
const FADE_DURATION = 800;

export function OnboardingScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  const startFadeOut = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setShow(false);
    }, FADE_DURATION);
  }, []);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(startFadeOut, VIDEO_DURATION);
    return () => clearTimeout(timer);
  }, [show, startFadeOut]);

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
            <video
              src="/onboarding.mp4"
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            <motion.div
              className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: fading ? 1 : 0 }}
              transition={{ duration: FADE_DURATION / 1000, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </>
  );
}
