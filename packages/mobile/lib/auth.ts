import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
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

/**
 * Send a password reset email via Supabase Auth.
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send reset email";
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

/**
 * Sign in with Apple using the native iOS dialog.
 * Falls back gracefully on Android / unsupported devices.
 */
export async function signInWithApple() {
  try {
    if (Platform.OS !== "ios") {
      return { error: { message: "Apple Sign In is only available on iOS" } };
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return { error: { message: "Apple Sign In is not available on this device" } };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { error: { message: "No identity token returned from Apple" } };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    // Apple only provides the name on first sign-in, so update the profile
    if (credential.fullName?.givenName) {
      const displayName = [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean)
        .join(" ");
      await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
    }

    return { data };
  } catch (err: any) {
    // User cancelled the dialog
    if (err?.code === "ERR_REQUEST_CANCELED") {
      return { error: { message: "Sign in was cancelled" } };
    }
    const message = err instanceof Error ? err.message : "Apple sign in failed";
    return { error: { message } };
  }
}

/**
 * Sign in with Google using Supabase OAuth via an in-app browser.
 */
export async function signInWithGoogle() {
  try {
    const redirectTo = makeRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    if (!data?.url) {
      return { error: { message: "No OAuth URL returned" } };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === "success" && result.url) {
      // Extract the fragment params (Supabase returns tokens in the URL fragment)
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

        if (sessionError) {
          return { error: { message: sessionError.message, code: sessionError.code } };
        }

        return { data: sessionData };
      }

      return { error: { message: "Could not extract session from OAuth callback" } };
    }

    // User cancelled or dismissed the browser
    return { error: { message: "Sign in was cancelled" } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google sign in failed";
    return { error: { message } };
  }
}
