"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  // Quick login buttons for demo
  const demoLogins = [
    {
      name: "Themba (Supervisor)",
      email: "themba@mediaonafrica.co.za",
      password: "password123",
      role: "MANAGER",
    },
    {
      name: "Asanda (Developer)",
      email: "asanda@mediaonafrica.co.za",
      password: "password123",
      role: "USER",
    },
    {
      name: "Sizwe (Developer)",
      email: "sizwe@mediaonafrica.co.za",
      password: "password123",
      role: "USER",
    },
    {
      name: "Shravan (Developer)",
      email: "shravan@mediaonafrica.co.za",
      password: "password123",
      role: "USER",
    },
  ];

  const quickLogin = async (demo: (typeof demoLogins)[0]) => {
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email: demo.email,
      password: demo.password,
      redirect: false,
    });
    if (result?.error) {
      setError("Login failed");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1f3d] to-[#1a3a6e]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00C48C] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#00C48C]/20">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">FlowOS</h1>
          <p className="text-gray-500 mt-1">Workflow Operating System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C48C] focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00C48C] text-white py-2 rounded-lg font-semibold hover:bg-[#00a86b] transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Demo Access</span>
          </div>
        </div>

        {/* Demo Buttons */}
        <div className="space-y-2">
          {demoLogins.map((demo) => (
            <button
              key={demo.email}
              onClick={() => quickLogin(demo)}
              disabled={loading}
              className="w-full text-left px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-gray-800">{demo.name}</p>
                <p className="text-xs text-gray-500">{demo.email}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${demo.role === "MANAGER" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600"}`}
              >
                {demo.role === "MANAGER" ? "Supervisor" : "Team Member"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
