"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface ChildContextValue {
  selectedChildId: string | "all";
  setSelectedChildId: (id: string | "all") => void;
}

const ChildContext = createContext<ChildContextValue>({
  selectedChildId: "all",
  setSelectedChildId: () => {},
});

export function ChildProvider({ children }: { children: ReactNode }) {
  const [selectedChildId, setSelectedChildId] = useState<string | "all">("all");

  return (
    <ChildContext.Provider value={{ selectedChildId, setSelectedChildId }}>
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  return useContext(ChildContext);
}
