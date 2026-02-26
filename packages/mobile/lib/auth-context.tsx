import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import * as authHelpers from "./auth";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: authHelpers.AuthError }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: authHelpers.AuthError }>;
  signOut: () => Promise<{ error?: authHelpers.AuthError }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check current session on mount
    async function getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    }

    getSession();

    // Listen for auth changes
    const subscription = authHelpers.onAuthStateChange((session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    return authHelpers.signIn(email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    return authHelpers.signUp(email, password, displayName);
  };

  const signOut = async () => {
    return authHelpers.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
