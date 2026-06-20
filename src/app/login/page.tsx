"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // 1. Proses Login ke Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      setErrorMsg("Email atau password salah.");
      setLoading(false);
      return;
    }

    // 2. Ambil data role pengguna dari tabel profiles
    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profileData) {
        setErrorMsg("Data profil tidak ditemukan.");
        setLoading(false);
        return;
      }

      // 3. Arahkan halaman sesuai role
      if (profileData.role === "owner") {
        router.push("/dashboard/owner");
      } else if (profileData.role === "kasir") {
        router.push("/dashboard/kasir");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sisi Kiri: Visual & Branding */}
      <div className="hidden lg:flex w-1/2 bg-zinc-50 flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
          <span className="text-6xl tracking-widest text-zinc-300">
            🧊 💦 🍃
          </span>
        </div>
        <div className="z-10 flex flex-col items-center">
          <div className="w-32 h-32 mb-8 bg-zinc-200 rounded-full flex items-center justify-center shadow-inner">
            <span className="text-lg font-bold text-zinc-500 font-inter">
              LOGO
            </span>
          </div>
          <h1 className="text-4xl font-bold font-inter text-zinc-800">
            Dapoer R2 POS
          </h1>
          <p className="mt-4 font-jakarta text-zinc-500 max-w-sm text-center leading-relaxed">
            Sistem manajemen operasional harian dan transaksi kasir.
          </p>
        </div>
      </div>

      {/* Sisi Kanan: Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="lg:hidden w-20 h-20 mb-6 bg-zinc-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <span className="text-sm font-bold text-zinc-500 font-inter">
                LOGO
              </span>
            </div>
            <h2 className="text-3xl font-bold font-inter text-zinc-900">
              Masuk ke Akun
            </h2>
            <p className="mt-3 text-zinc-500 font-jakarta">
              Silakan masukkan email dan password Anda.
            </p>
          </div>

          {/* Menampilkan pesan error jika login gagal */}
          {errorMsg && (
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center font-jakarta border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-zinc-700 font-jakarta mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-jakarta transition-colors"
                placeholder="kasir@dapoerr2.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-zinc-700 font-jakarta mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-jakarta transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 transition-transform active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
