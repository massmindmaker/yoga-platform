"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VIDEO_DURATION = 4000;
const FADE_DURATION = 800;

export function OnboardingScreen({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);
  const [glitchActive, setGlitchActive] = useState(true);

  useEffect(() => {
    setShow(true);
    // Disable glitch after initial impact
    setTimeout(() => setGlitchActive(false), 1500);
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
            className="fixed inset-0 z-[9999] bg-black overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: FADE_DURATION / 1000, ease: "easeInOut" }}
            onClick={handleSkip}
          >
            {/* Neon Glow Background Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-purple-900/20 to-pink-900/20 animate-pulse" />

            {/* Main Video with Neon Filter */}
            <div className="absolute inset-0 flex items-center justify-center">              <div className="relative w-full h-full">                {/* Neon Glow Behind Video */}
                <div 
                  className="absolute inset-4 rounded-3xl opacity-50 blur-3xl animate-neon-pulse"
                  style={{
                    background: 'linear-gradient(45deg, #00ffff, #ff00ff, #00ffff)',
                    backgroundSize: '400% 400%',
                  }}
                />
                
                {/* Video Container with Effects */}
                <div 
                  className={`relative w-full h-full ${glitchActive ? 'animate-glitch' : ''}`}
                >
                  {/* RGB Split Layers */}
                  <div className="absolute inset-0 mix-blend-screen opacity-50 animate-rgb-shift-cyan">                    <video
                      src="/onboarding.mp4"
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ filter: 'hue-rotate(-30deg) saturate(2)' }}
                    />
                  </div>
                  
                  <div className="absolute inset-0 mix-blend-screen opacity-50 animate-rgb-shift-magenta">                    <video
                      src="/onboarding.mp4"
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      style={{ filter: 'hue-rotate(30deg) saturate(2)' }}
                    />
                  </div>

                  {/* Main Video */}
                  <video
                    src="/onboarding.mp4"
                    autoPlay
                    muted
                    playsInline
                    className="relative w-full h-full object-cover"
                    style={{
                      filter: 'contrast(1.2) saturate(1.3) brightness(1.1) drop-shadow(0 0 20px rgba(0,255,255,0.5)) drop-shadow(0 0 40px rgba(255,0,255,0.3))',
                    }}
                  />

                  {/* Neon Border Frame */}
                  <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-none animate-border-pulse"
                    style={{
                      boxShadow: 'inset 0 0 60px rgba(0,255,255,0.2), 0 0 60px rgba(255,0,255,0.2)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Scanlines Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
              }}
            />

            {/* Vignette */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.8) 100%)',
              }}
            />

            {/* Glitch Lines */}
            {glitchActive && (
              <>
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-cyan-400/50 blur-sm"
                  animate={{
                    top: ['0%', '30%', '60%', '90%', '0%'],
                    opacity: [0, 1, 0.5, 1, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: 2,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="absolute left-0 right-0 h-2 bg-pink-500/30"
                  animate={{
                    top: ['20%', '50%', '80%', '40%', '20%'],
                    scaleX: [1, 1.2, 0.8, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: 3,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute left-0 w-1/3 h-full bg-white/10"
                  animate={{
                    left: ['-33%', '100%'],
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: 2,
                    ease: "linear",
                  }}
                />
              </>
            )}

            {/* Digital Noise */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-10 animate-noise"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Fade Overlay */}
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
