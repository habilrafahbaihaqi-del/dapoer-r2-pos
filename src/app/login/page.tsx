"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

// Komponen Logo sekarang memanggil fail gambar asli dari folder public
const DapurLogo = ({ className }: { className?: string }) => (
  <img
    src="/logo.png"
    alt="Logo Dapur R2"
    className={`object-contain ${className}`}
  />
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Autentikasi ke Supabase
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError)
        throw new Error("Email atau password yang Anda masukkan salah.");
      if (!authData.user)
        throw new Error("Tidak dapat menemukan data pengguna.");

      // 2. Cek Role di tabel Profiles untuk menentukan arah Dashboard
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Gagal mengambil data peran (role) profil Anda.");
      }

      // 3. Arahkan pengguna sesuai Role
      if (profile.role.toLowerCase() === "owner") {
        router.push("/dashboard/owner");
      } else if (profile.role.toLowerCase() === "kasir") {
        router.push("/dashboard/kasir");
      } else {
        throw new Error("Peran tidak dikenali. Hubungi administrator.");
      }
    } catch (error: any) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white overflow-hidden font-jakarta select-none">
      {/* =========================================
          PANEL KIRI (BACKGROUND MERAH & WATERMARK)
          Hanya tampil di layar Desktop (lg:flex)
      ============================================= */}
      <div className="hidden lg:flex relative w-1/2 bg-[#9B111E] flex-col items-center justify-center overflow-hidden z-0">
        {/* Efek Watermark Logo Raksasa (Transparan) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
          <DapurLogo className="w-[800px] h-[800px] scale-150 transform translate-y-20 grayscale brightness-200 contrast-125" />
        </div>

        {/* Konten Teks Tengah Kiri */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <DapurLogo className="w-32 h-32 mb-2" />
          <h1 className="text-4xl font-light font-inter text-white tracking-widest leading-none mb-4 mt-2">
            DAPOER
            <br />
            R2
          </h1>
          <div className="w-12 h-[1px] bg-[#D4AF37] mb-6"></div>
          <p className="text-sm text-red-100/80 font-medium max-w-[250px] leading-relaxed">
            Sistem manajemen operasional harian dan transaksi kasir.
          </p>
        </div>

        {/* Garis Miring Emas (Diagonal Trim) di batas kanan */}
        <div className="absolute top-0 -right-4 h-[120%] w-10 bg-gradient-to-b from-[#e8c872] via-[#D4AF37] to-[#aa8920] transform origin-top skew-x-[8deg] shadow-[-15px_0_30px_rgba(0,0,0,0.4)] z-20"></div>
      </div>

      {/* =========================================
          PANEL KANAN (FORM LOGIN PUTIH BERSIH)
      ============================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative z-10 bg-[#fafafa]">
        {/* Dekorasi blur background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none -z-10" />

        <div className="w-full max-w-[420px] p-8 md:p-10 bg-white sm:rounded-3xl sm:border border-zinc-100 sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
          {/* Header Form */}
          <div className="flex flex-col items-center text-center mb-10">
            {/* Logo Khusus Mobile */}
            <div className="lg:hidden mb-6 flex flex-col items-center">
              <DapurLogo className="w-24 h-24 mb-1" />
              <h1 className="text-2xl font-light font-inter text-[#9B111E] tracking-widest leading-none mt-2">
                DAPOER
                <br />
                R2
              </h1>
            </div>

            {/* Logo untuk PC di form */}
            <div className="hidden lg:flex flex-col items-center mb-6">
              <DapurLogo className="w-24 h-24 mb-2" />
              <h1 className="text-2xl font-light font-inter text-[#9B111E] tracking-widest leading-none mt-2">
                DAPOER
                <br />
                R2
              </h1>
            </div>

            <h2 className="text-[22px] font-bold text-zinc-900 font-inter mb-2">
              Masuk ke Akun
            </h2>
            <p className="text-[13px] text-zinc-500 font-medium">
              Silakan masukkan email dan password Anda.
            </p>
          </div>

          {/* Form Autentikasi */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Alert Error */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-bold text-center animate-in fade-in zoom-in duration-300">
                {errorMsg}
              </div>
            )}

            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-zinc-900 font-inter block">
                Email
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kasir@daporr2.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-xl font-jakarta text-[14px] text-zinc-900 focus:outline-none focus:border-[#9B111E] focus:ring-4 focus:ring-[#9B111E]/10 focus:bg-white transition-all placeholder:text-zinc-400"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-zinc-900 font-inter block">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-xl font-jakarta text-[14px] text-zinc-900 focus:outline-none focus:border-[#9B111E] focus:ring-4 focus:ring-[#9B111E]/10 focus:bg-white transition-all tracking-wider placeholder:tracking-normal placeholder:text-zinc-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Tombol Login */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#A81717] hover:bg-[#8B1010] text-white rounded-xl font-bold font-inter text-[15px] transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-[#A81717]/20"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
