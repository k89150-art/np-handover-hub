"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useFirebaseSession } from "./FirebaseProvider";

export function AuthGate({ children }: { children: ReactNode }) {
  const {
    user,
    profile,
    loading,
    error,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    clearError,
  } = useFirebaseSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
    } catch {
      // Error is rendered from the session provider.
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="auth-screen auth-loading" aria-live="polite">
        <div className="auth-brand-mark">NP</div>
        <strong>正在確認登入狀態</strong>
        <span className="loading-bar" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <div className="auth-intro">
            <div className="auth-brand">
              <div className="auth-brand-mark">NP</div>
              <div>
                <strong>交班中樞</strong>
                <span>專科護理師多人交班系統</span>
              </div>
            </div>
            <div className="auth-copy">
              <span>SECURE CLINICAL HANDOVER</span>
              <h1>讓每一次交班<br />都有跡可循</h1>
              <p>新病人與 Trouble shooting 分流管理，多人即時同步，完整保留交接與更新紀錄。</p>
            </div>
            <div className="auth-security-note">
              <i>✓</i>
              <span><strong>Firebase 安全驗證</strong>未登入使用者無法存取交班資料</span>
            </div>
          </div>

          <div className="auth-form-side">
            <form className="auth-form" onSubmit={submit}>
              <header>
                <span>{mode === "login" ? "WELCOME BACK" : "REQUEST ACCESS"}</span>
                <h2>{mode === "login" ? "登入交班系統" : "申請使用帳號"}</h2>
                <p>
                  {mode === "login"
                    ? "請使用已核准的帳號登入"
                    : "註冊後需由管理員核准才能進入系統"}
                </p>
              </header>

              <button
                className="google-button"
                type="button"
                onClick={() => void loginWithGoogle().catch(() => undefined)}
              >
                <b>G</b> 使用 Google 帳號登入
              </button>

              <div className="auth-divider"><span>或使用電子郵件</span></div>

              {mode === "register" && (
                <label>
                  <span>顯示名稱</span>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="例：王怡婷 NP"
                    required
                  />
                </label>
              )}
              <label>
                <span>電子郵件</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                <span>密碼</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少 8 個字元"
                  minLength={8}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </label>

              {error && <div className="auth-error">{error}</div>}

              <button className="auth-submit" disabled={submitting} type="submit">
                {submitting
                  ? "處理中…"
                  : mode === "login"
                    ? "登入系統"
                    : "送出申請"}
              </button>

              <button
                className="auth-mode-switch"
                type="button"
                onClick={() => {
                  clearError();
                  setMode(mode === "login" ? "register" : "login");
                }}
              >
                {mode === "login" ? "尚未有帳號？申請使用" : "已有帳號？返回登入"}
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  if (!profile || profile.status !== "active") {
    return (
      <main className="auth-screen">
        <section className="pending-panel">
          <div className="pending-icon">◷</div>
          <span>ACCOUNT REVIEW</span>
          <h1>{profile?.status === "disabled" ? "此帳號已停用" : "帳號等待管理員核准"}</h1>
          <p>
            {profile?.status === "disabled"
              ? "請聯絡系統管理員重新啟用帳號。"
              : `已收到 ${user.email} 的申請。管理員核准後即可使用交班系統。`}
          </p>
          <button onClick={() => void logout()}>登出</button>
        </section>
      </main>
    );
  }

  return children;
}
