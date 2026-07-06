import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { ApiClientError } from "../api/client";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(email, password);
      showToast("success", "Account created — let's analyze your first meeting");
      navigate("/app");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start turning meetings into actionable intelligence"
      footerText="Already have an account?"
      footerLink="Sign in"
      footerHref="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-indigo-500 focus:ring-2"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-indigo-500 focus:ring-2"
            placeholder="Minimum 8 characters"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
