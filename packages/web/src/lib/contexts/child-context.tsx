"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ChildWithAge } from "@kinpath/shared";

interface ChildContextValue {
  selectedChildId: string | "all";
  setSelectedChildId: (id: string | "all") => void;
  children: ChildWithAge[];
  setChildren: (children: ChildWithAge[]) => void;
}

const ChildContext = createContext<ChildContextValue>({
  selectedChildId: "all",
  setSelectedChildId: () => {},
  children: [],
  setChildren: () => {},
});

export function ChildProvider({ children }: { children: ReactNode }) {
  const [selectedChildId, setSelectedChildId] = useState<string | "all">("all");
  const [childProfiles, setChildProfiles] = useState<ChildWithAge[]>([]);

  const setChildren = useCallback((c: ChildWithAge[]) => {
    setChildProfiles(c);
  }, []);

  return (
    <ChildContext.Provider
      value={{ selectedChildId, setSelectedChildId, children: childProfiles, setChildren }}
    >
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  return useContext(ChildContext);
}
