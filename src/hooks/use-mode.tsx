"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type UserMode = "student" | "trainer";

interface ModeContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<UserMode>("student");

  const toggleMode = () => {
    setMode((prev) => (prev === "student" ? "trainer" : "student"));
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error("useMode must be used within ModeProvider");
  }
  return context;
}
