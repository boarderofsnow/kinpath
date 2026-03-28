"use client";

import { useEffect } from "react";
import { useChild } from "@/lib/contexts/child-context";
import type { ChildWithAge } from "@kinpath/shared";

export function ChildHydrator({ children }: { children: ChildWithAge[] }) {
  const { setChildren } = useChild();
  useEffect(() => {
    setChildren(children);
  }, [children, setChildren]);
  return null;
}
