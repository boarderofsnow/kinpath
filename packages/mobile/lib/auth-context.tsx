import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import * as authHelpers from "./auth";
import { api } from "./api";
import type { User } from "@supabase/supabase-js";

type AuthResult = { data?: any; error?: authHelpers.AuthError };

interface AuthContextType {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const checkedPendingInvite = useRef(false);

  // Check for and accept pending household invites on login
  useEffect(() => {
    if (!user || checkedPendingInvite.current) return;
    checkedPendingInvite.current = true;
    api.household.acceptPending().catch(() => {
      // Non-fatal: silently ignore if the call fails
    });
  }, [user]);

  useEffect(() => {
    // Check current session on mount
    async function getSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
      } catch (err) {
        // Network errors during cold start are non-fatal;
        // the user can still sign in manually.
        console.warn("Failed to restore session:", err);
      } finally {
        setIsLoading(false);
      }
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

  const signInWithApple = async () => {
    return authHelpers.signInWithApple();
  };

  const signInWithGoogle = async () => {
    return authHelpers.signInWithGoogle();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, signInWithApple, signInWithGoogle }}>
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
