"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/workflows");
      router.refresh();
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: "#0f1f3d" }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full border-2 border-emerald-400" />
          <div className="absolute top-40 right-40 w-32 h-32 rounded-full border border-emerald-400" />
          <div className="absolute bottom-40 left-20 w-48 h-48 rounded-full border border-emerald-400" />
          <div className="absolute bottom-20 left-40 w-24 h-24 rounded-full border-2 border-emerald-400" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-lg"
              style={{ backgroundColor: "#10b981" }}
            >
              M
            </div>
            <span className="text-white font-bold text-xl">
              Media on Africa
            </span>
          </div>

          {/* Hero text */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 mb-8"
              style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-sm font-medium">
                Internal Platform
              </span>
            </div>

            <h1 className="text-5xl font-black leading-tight mb-4 text-white">
              Innovate
              <br />
              <span style={{ color: "#10b981" }}>Africa's</span>
              <br />
              Future
            </h1>

            <p className="text-gray-400 text-base leading-relaxed max-w-sm">
              FlowOS is the internal workflow platform powering Media on
              Africa's projects — from CRM systems to cybersecurity and
              e-learning platforms.
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10">
          <div
            className="grid grid-cols-3 gap-4 p-5 rounded-2xl border border-white/10"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            {[
              { val: "8", label: "Active Workflows" },
              { val: "3", label: "Live Projects" },
              { val: "61%", label: "Avg Progress" },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black" style={{ color: "#10b981" }}>
                  {val}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Ticker */}
          <div className="mt-6 flex gap-6 text-xs font-semibold tracking-widest uppercase text-gray-500">
            {[
              "Cloud Architecture",
              "Data Security",
              "Mobile First",
              "Scalable Systems",
            ].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
              style={{ backgroundColor: "#0f1f3d" }}
            >
              M
            </div>
            <span className="font-bold text-lg" style={{ color: "#0f1f3d" }}>
              Media on Africa
            </span>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="mb-8">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "#0f1f3d" }}
              >
                <span className="text-white font-black text-lg">F</span>
              </div>
              <h2 className="text-2xl font-black" style={{ color: "#0f1f3d" }}>
                Welcome back
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Sign in to your FlowOS account
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: "#0f1f3d" }}
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@mediaonafrica.co.za"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 transition-all"
                    style={{ "--tw-ring-color": "#10b981" } as any}
                    onFocus={(e) =>
                      (e.target.style.boxShadow =
                        "0 0 0 3px rgba(16,185,129,0.2)")
                    }
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  className="block text-sm font-semibold mb-1.5"
                  style={{ color: "#0f1f3d" }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none bg-gray-50 transition-all"
                    onFocus={(e) =>
                      (e.target.style.boxShadow =
                        "0 0 0 3px rgba(16,185,129,0.2)")
                    }
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ backgroundColor: "#0f1f3d" }}
                onMouseEnter={(e) =>
                  !loading &&
                  ((e.target as HTMLElement).style.backgroundColor = "#10b981")
                }
                onMouseLeave={(e) =>
                  !loading &&
                  ((e.target as HTMLElement).style.backgroundColor = "#0f1f3d")
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                  </>
                ) : (
                  "Sign In to FlowOS"
                )}
              </button>
            </form>

            {/* Team hint */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3">
                Media on Africa Team
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: "Themba", color: "from-teal-500 to-green-500" },
                  { name: "Asanda", color: "from-purple-500 to-pink-500" },
                  { name: "Sizwe", color: "from-blue-500 to-cyan-500" },
                  { name: "Shravan", color: "from-orange-500 to-red-500" },
                ].map(({ name, color }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      setEmail(`${name.toLowerCase()}@mediaonafrica.co.za`)
                    }
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${color} flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {name[0]}
                    </div>
                    <span className="text-xs text-gray-500">{name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                Click a name to fill in your email
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Media on Africa · FlowOS Internal
            Platform
          </p>
        </div>
      </div>
    </div>
  );
}
