"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { isFirebaseConfigured } from "@/lib/config";

/** Turn Firebase Auth errors into actionable guidance. */
function describeAuthError(err: unknown): string | null {
  const e = err as { code?: string; message?: string };
  const code = e.code ?? "";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return null; // User dismissed — stay silent.
  }
  if (code === "auth/operation-not-allowed") {
    return "Google Sign-In is not enabled yet in your Firebase Console (Authentication > Sign-in method > Google).";
  }
  if (code === "auth/unauthorized-domain") {
    const host =
      typeof window !== "undefined" ? window.location.hostname : "(this domain)";
    return `This domain ("${host}") is not authorized. Firebase Console > Authentication > Settings > Authorized domains > Add domain > enter "${host}". (Use "localhost", never 127.0.0.1, for local dev.)`;
  }
  if (code === "auth/invalid-api-key" || code.includes("api-key-not-valid")) {
    return "Firebase rejected the API key. Copy the exact NEXT_PUBLIC_FIREBASE_* values from Firebase Console > Project settings into .env.local (restart dev server) and Vercel env vars (then redeploy).";
  }
  if (code === "auth/network-request-failed") {
    return "Network error reaching Google. Check your connection, VPN, DNS or ad-blocker, then retry.";
  }
  return e.message || "Failed to sign in with Google.";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  logout: async () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const firebaseReady = isFirebaseConfigured();
  const [loading, setLoading] = useState(firebaseReady);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) return;

    // Config is present here (firebaseReady), so getFirebaseAuth() won't throw.
    // Loading resolves through the subscription callbacks below.
    const auth = getFirebaseAuth();
    // Complete a redirect-based sign-in (fallback flow) if we're returning
    // from Google. Callbacks below run async, so no render-loop risk.
    getRedirectResult(auth)
      .then((credential) => {
        if (credential?.user) setUser(credential.user);
      })
      .catch((err: unknown) => {
        const code = (err as { code?: string })?.code ?? "";
        if (code === "auth/redirect-cancelled-by-user") return;
        console.error("Redirect sign-in error:", err);
        const message = describeAuthError(err);
        if (message) setError(message);
      });
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error("Auth state error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [firebaseReady]);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      try {
        await signInWithPopup(auth, provider);
      } catch (popupErr: unknown) {
        const code = (popupErr as { code?: string })?.code ?? "";
        // Popup unusable here (blocker, extension interference, broken
        // web storage, flaky network) — fall back to full-page redirect,
        // which always works. getRedirectResult() above completes it.
        if (
          code === "auth/popup-blocked" ||
          code === "auth/internal-error" ||
          code === "auth/network-request-failed" ||
          code === "auth/web-storage-unsupported"
        ) {
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }
    } catch (err: unknown) {
      console.error("Google sign in error:", err);
      const message = describeAuthError(err);
      if (message) setError(message);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
      setError("Failed to sign out.");
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
