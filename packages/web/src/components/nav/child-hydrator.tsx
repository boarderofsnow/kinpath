"use client";

import { useEffect } from "react";
import { useChild } from "@/lib/contexts/child-context";
import type { ChildWithAge } from "@kinpath/shared";

export function ChildHydrator({ profiles }: { profiles: ChildWithAge[] }) {
  const { setChildren } = useChild();
  useEffect(() => {
    setChildren(profiles);
  }, [profiles, setChildren]);
  return null;
}
