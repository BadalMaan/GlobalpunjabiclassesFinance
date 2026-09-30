"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [signingIn, setSigningIn] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const supabase = createClient();

      if (!supabase) {
        if (mounted) {
          setError(
            "Finance connection is not configured."
          );
          setLoading(false);
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session) {
        router.replace("/dashboard");
        return;
      }

      setLoading(false);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    setSigningIn(true);

    const supabase = createClient();

    if (!supabase) {
      setError(
        "Finance connection is not configured. Please check the application settings."
      );
      setSigningIn(false);
      return;
    }

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (loginError) {
      setError(
        "The email or password is incorrect."
      );
      setSigningIn(false);
      return;
    }

    router.replace("/dashboard");
  }

  if (loading) {
    return (
      <main className="login-page">
        <div className="login-loading">
          <div className="login-logo-small">
            GF
          </div>

          <div className="login-loading-bar" />
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">

      <div className="login-background-orb orb-one" />
      <div className="login-background-orb orb-two" />

      <div className="login-shell">

        {/* LEFT / BRAND PANEL */}

        <section className="login-brand-panel">

          <div className="login-brand">

            <div className="login-brand-mark">
              GF
            </div>

            <div>
              <div className="login-brand-name">
                Global Finance
              </div>

              <div className="login-brand-subtitle">
                Private finance workspace
              </div>
            </div>

          </div>

          <div className="login-brand-content">

            <div className="login-overline">
              PRIVATE WORKSPACE
            </div>

            <h1>
              Your finances,
              <br />
              <span>beautifully organized.</span>
            </h1>

            <p>
              A secure financial workspace for
              managing income, expenses,
              ownership and settlements in one
              place.
            </p>

          </div>

          <div className="login-security-note">

            <div className="login-security-icon">
              <ShieldCheck size={16} />
            </div>

            <div>
              <strong>
                Private & secure
              </strong>

              <span>
                Authorized members only
              </span>
            </div>

          </div>

        </section>


        {/* LOGIN PANEL */}

        <section className="login-form-panel">

          <div className="login-form-container">

            <div className="login-mobile-logo">
              GF
            </div>

            <div className="login-heading">

              <div className="login-lock">
                <LockKeyhole size={18} />
              </div>

              <div>
                <h2>
                  Welcome back
                </h2>

                <p>
                  Sign in to your finance workspace.
                </p>
              </div>

            </div>


            <form
              onSubmit={handleLogin}
              className="login-form"
            >

              <div className="login-field">

                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  disabled={signingIn}
                />

              </div>


              <div className="login-field">

                <div className="login-label-row">

                  <label htmlFor="password">
                    Password
                  </label>

                </div>

                <div className="login-password">

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    disabled={signingIn}
                  />

                  <button
                    type="button"
                    className="login-eye"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={signingIn}
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

              </div>


              {error && (
                <div className="login-error">
                  <span className="login-error-dot" />
                  <span>{error}</span>
                </div>
              )}


              <button
                type="submit"
                className="login-submit"
                disabled={signingIn}
              >

                {signingIn ? (
                  <>
                    <span className="login-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={17} />
                  </>
                )}

              </button>

            </form>


            <div className="login-footer">

              <div className="login-footer-line" />

              <span>
                GPC Finance
              </span>

              <div className="login-footer-line" />

            </div>

            <p className="login-authorized">
              This workspace is restricted to
              authorized finance members.
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}
