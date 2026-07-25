"use client";

import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { firebaseAuth, firestore, initialAdminEmail } from "./firebase";

export type UserRole = "admin" | "manager" | "member";
export type ProfileStatus = "active" | "pending" | "disabled";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: ProfileStatus;
  unitId: string;
  unitName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface FirebaseSession {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const SessionContext = createContext<FirebaseSession | null>(null);

function friendlyAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  const messages: Record<string, string> = {
    "auth/invalid-credential": "電子郵件或密碼不正確。",
    "auth/email-already-in-use": "此電子郵件已經註冊。",
    "auth/weak-password": "密碼強度不足，請至少輸入 8 個字元。",
    "auth/popup-closed-by-user": "Google 登入視窗已關閉。",
    "auth/popup-blocked": "瀏覽器阻擋了登入視窗，請允許彈出式視窗後重試。",
    "auth/unauthorized-domain": "目前網站尚未加入 Firebase 授權網域。",
    "auth/too-many-requests": "嘗試次數過多，請稍後再試。",
  };
  return messages[code] ?? "登入暫時無法完成，請稍後再試。";
}

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopProfile: (() => void) | undefined;

    const stopAuth = onAuthStateChanged(firebaseAuth, async (nextUser) => {
      stopProfile?.();
      setUser(nextUser);
      setProfile(null);

      if (!nextUser?.email) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const profileRef = doc(firestore, "profiles", nextUser.uid);
      const isInitialAdmin =
        nextUser.email.toLowerCase() === initialAdminEmail.toLowerCase();
      const fallbackName =
        nextUser.displayName ?? nextUser.email.split("@")[0] ?? "使用者";

      try {
        const existingProfile = await getDoc(profileRef);
        if (!existingProfile.exists()) {
          await setDoc(profileRef, {
              uid: nextUser.uid,
              email: nextUser.email.toLowerCase(),
              displayName: fallbackName,
              role: isInitialAdmin ? "admin" : "member",
              status: isInitialAdmin ? "active" : "pending",
              unitId: "chest-medicine",
              unitName: "胸腔內科病房",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
        }

        stopProfile = onSnapshot(
          profileRef,
          (snapshot) => {
            setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
            setLoading(false);
          },
          () => {
            setError("無法讀取使用者權限，請聯絡系統管理員。");
            setLoading(false);
          },
        );
      } catch {
        setError("無法建立使用者資料，請檢查 Firestore 安全規則。");
        setLoading(false);
      }
    });

    return () => {
      stopProfile?.();
      stopAuth();
    };
  }, []);

  const value = useMemo<FirebaseSession>(
    () => ({
      user,
      profile,
      loading,
      error,
      clearError: () => setError(""),
      loginWithEmail: async (email, password) => {
        setError("");
        try {
          await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
        } catch (loginError) {
          setError(friendlyAuthError(loginError));
          throw loginError;
        }
      },
      registerWithEmail: async (email, password, displayName) => {
        setError("");
        try {
          const credential = await createUserWithEmailAndPassword(
            firebaseAuth,
            email.trim(),
            password,
          );
          await setDoc(
            doc(firestore, "profiles", credential.user.uid),
            {
              uid: credential.user.uid,
              email: email.trim().toLowerCase(),
              displayName: displayName.trim() || email.split("@")[0],
              role: "member",
              status: "pending",
              unitId: "chest-medicine",
              unitName: "胸腔內科病房",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        } catch (registerError) {
          setError(friendlyAuthError(registerError));
          throw registerError;
        }
      },
      loginWithGoogle: async () => {
        setError("");
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          await signInWithPopup(firebaseAuth, provider);
        } catch (googleError) {
          setError(friendlyAuthError(googleError));
          throw googleError;
        }
      },
      logout: () => signOut(firebaseAuth),
    }),
    [error, loading, profile, user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useFirebaseSession() {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useFirebaseSession must be used inside FirebaseProvider");
  }
  return session;
}
