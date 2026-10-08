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
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { isFirebaseConfigured } from "@/lib/config";

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
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      console.error("Google sign in error:", err);
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/popup-closed-by-user") {
        return;
      }
      if (e.code === "auth/operation-not-allowed") {
        setError(
          "Google Sign-In is not enabled yet in your Firebase Console (Authentication > Sign-in method > Google)."
        );
      } else if (e.code === "auth/unauthorized-domain") {
        setError(
          "This domain is not authorized. Add your domain to Authorized Domains in Firebase Console (Authentication > Settings)."
        );
      } else {
        setError(e.message || "Failed to sign in with Google.");
      }
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
