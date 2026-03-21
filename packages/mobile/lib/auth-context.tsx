import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import * as authHelpers from "./auth";
import { api } from "./api";
import { queryCache } from "./cache";
import { identifyUser, resetUser } from "./purchases";
import { getHouseholdContext } from "./household";
import type { User } from "@supabase/supabase-js";

type AuthResult = { data?: any; error?: authHelpers.AuthError };

interface AuthContextType {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  /** The user_id to use for shared data queries (children, checklist). For partners, this is the owner's ID. */
  effectiveOwnerId: string | null;
  isPartner: boolean;
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
  const [effectiveOwnerId, setEffectiveOwnerId] = useState<string | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const checkedPendingInvite = useRef(false);
  const identifiedRcUser = useRef<string | null>(null);
  const signingOutRef = useRef(false);

  // Check for and accept pending household invites on login
  useEffect(() => {
    if (!user || checkedPendingInvite.current) return;
    checkedPendingInvite.current = true;
    api.household.acceptPending().catch(() => {
      // Non-fatal: silently ignore if the call fails
    });
  }, [user]);

  // Resolve household context — determines effectiveOwnerId for shared data queries
  useEffect(() => {
    if (!user?.id) {
      setEffectiveOwnerId(null);
      setIsPartner(false);
      return;
    }

    getHouseholdContext(user.id).then((ctx) => {
      setEffectiveOwnerId(ctx.effectiveOwnerId);
      setIsPartner(ctx.isPartner);
    }).catch(() => {
      // Fallback: use own ID if household resolution fails
      setEffectiveOwnerId(user.id);
      setIsPartner(false);
    });
  }, [user?.id]);

  useEffect(() => {
    // Identify user in RevenueCat only when the user ID actually changes
    function identifyIfNeeded(userId: string | undefined) {
      if (userId && userId !== identifiedRcUser.current) {
        identifiedRcUser.current = userId;
        identifyUser(userId).catch(() => {});
      }
    }

    // Check current session on mount
    async function getSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          // Stored refresh token is invalid or revoked — clear it so the
          // autoRefreshToken timer stops hammering the auth server with a
          // dead token (which causes the "Invalid Refresh Token" error loop).
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user || null);
          identifyIfNeeded(session?.user?.id);
        }
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
      // During sign-out, ignore auth events (e.g. TOKEN_REFRESHED) that would
      // re-set session/user and cause a double mount/unmount cycle crash.
      if (signingOutRef.current) return;

      setSession(session);
      setUser(session?.user || null);
      identifyIfNeeded(session?.user?.id);
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
    // Suppress the auth state listener so token-refresh events cannot
    // re-set session/user while async cleanup is in progress.
    signingOutRef.current = true;
    // Clear state first so the route guard navigates immediately,
    // unmounting protected screens before any async work runs.
    setUser(null);
    setSession(null);
    setEffectiveOwnerId(null);
    setIsPartner(false);
    queryCache.clear();
    identifiedRcUser.current = null;
    try {
      await resetUser().catch(() => {});
      return await authHelpers.signOut();
    } finally {
      signingOutRef.current = false;
    }
  };

  const signInWithApple = async () => {
    return authHelpers.signInWithApple();
  };

  const signInWithGoogle = async () => {
    return authHelpers.signInWithGoogle();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, effectiveOwnerId, isPartner, signIn, signUp, signOut, signInWithApple, signInWithGoogle }}>
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
