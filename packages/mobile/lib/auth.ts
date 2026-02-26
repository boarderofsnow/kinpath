import { supabase } from "./supabase";

export interface AuthError {
  message: string;
  code?: string;
}

export async function signUp(email: string, password: string, displayName: string) {
  try {
    // Sign up with email and password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during sign up";
    return { error: { message } };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during sign in";
    return { error: { message } };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during sign out";
    return { error: { message } };
  }
}

export function onAuthStateChange(callback: (session: any) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return subscription;
}
