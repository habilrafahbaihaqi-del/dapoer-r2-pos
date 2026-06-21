"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  User,
  Lock,
  Save,
  ShieldAlert,
  Key,
  Image as ImageIcon,
} from "lucide-react";

// TODO: Sesuaikan nama-nama file ini dengan nama file gambar yang Anda masukkan ke folder public/avatars/
const AVAILABLE_AVATARS = [
  "/avatars/avatar-1.png",
  "/avatars/avatar-2.png",
  "/avatars/avatar-3.png",
  "/avatars/avatar-4.png",
  "/avatars/avatar-5.png",
  "/avatars/avatar-6.png",
];

export default function KeamananAkunPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // State Data Pengguna
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profile) {
          setName(profile.name || "");
          setAvatarUrl(profile.avatar_url || "");
        }
      }
    } catch (error) {
      console.error("Gagal memuat profil pengguna:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Nama tidak boleh kosong.");

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name,
          avatar_url: avatarUrl, // Simpan pilihan avatar ke database
        })
        .eq("id", userId);

      if (error) throw error;
      alert(
        "Profil berhasil diperbarui! Silakan refresh halaman untuk melihat avatar baru Anda di pojok kanan atas.",
      );
    } catch (error: any) {
      alert(`Gagal memperbarui profil: ${error.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6)
      return alert("Password baru minimal harus berisi 6 karakter.");
    if (newPassword !== confirmPassword)
      return alert("Konfirmasi password tidak cocok.");

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      alert("Password akun Anda berhasil diperbarui!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      alert(`Gagal memperbarui password: ${error.message}`);
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="space-y-2 px-2">
        <h1 className="text-3xl font-bold font-inter text-zinc-900 tracking-tight">
          Keamanan & Profil
        </h1>
        <p className="text-zinc-500 font-jakarta text-sm lg:text-base max-w-2xl">
          Kelola informasi personal Anda, atur avatar profil, dan perbarui kata
          sandi secara berkala.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          <div className="h-[500px] bg-white rounded-2xl border border-zinc-200"></div>
          <div className="h-[400px] bg-white rounded-2xl border border-zinc-200"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* KARTU KIRI: INFORMASI PROFIL & AVATAR */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-3 text-[#FF5B37]">
              <User size={24} strokeWidth={2.5} />
              <h2 className="text-lg font-bold font-inter text-zinc-800">
                Profil Personal
              </h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* PEMILIH AVATAR (AVATAR PICKER) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter">
                  Pilih Avatar
                </label>
                <div className="flex flex-wrap gap-4 items-center p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  {/* Opsi 1: Tanpa Avatar (Inisial) */}
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black font-inter transition-all ${
                      avatarUrl === ""
                        ? "bg-[#FF5B37] text-white shadow-lg shadow-[#FF5B37]/30 scale-110 ring-4 ring-white"
                        : "bg-zinc-200 text-zinc-500 hover:bg-zinc-300"
                    }`}
                  >
                    {name ? name.charAt(0).toUpperCase() : "O"}
                  </button>

                  {/* Opsi 2: Daftar Avatar yang Disediakan */}
                  {AVAILABLE_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative w-16 h-16 rounded-2xl overflow-hidden bg-zinc-100 transition-all ${
                        avatarUrl === url
                          ? "shadow-lg shadow-[#FF5B37]/30 scale-110 ring-4 ring-[#FF5B37]"
                          : "hover:scale-105 hover:shadow-md border border-zinc-200"
                      }`}
                    >
                      {/* Tampilan gambar. Jika file belum ada di folder, akan menampilkan ikon fallback */}
                      <img
                        src={url}
                        alt={`Avatar ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback jika gambar belum dimasukkan ke folder public/avatars
                          (e.target as HTMLImageElement).style.display = "none";
                          e.currentTarget.parentElement?.classList.add(
                            "flex",
                            "items-center",
                            "justify-center",
                          );
                        }}
                      />
                      <ImageIcon
                        size={24}
                        className="text-zinc-300 absolute inset-0 m-auto -z-10"
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400 font-jakarta">
                  Pilih wajah digital yang mencerminkan gaya Anda.
                </p>
              </div>

              {/* Input Nama & Email */}
              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter">
                    Email Akun (Read-only)
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3 text-zinc-400 font-jakarta text-sm cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border-2 border-zinc-200 px-4 py-3 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-sm lg:text-base font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#FF5B37] text-white font-bold text-sm rounded-xl hover:bg-[#e04a2a] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 shadow-md shadow-[#FF5B37]/20"
                >
                  <Save size={16} />
                  {isSavingProfile ? "Menyimpan..." : "Simpan Profil & Avatar"}
                </button>
              </div>
            </form>
          </div>

          {/* KARTU KANAN: FORM GANTI PASSWORD (TETAP SAMA SEPERTI SEBELUMNYA) */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-3 text-[#FF5B37]">
              <Key size={24} strokeWidth={2.5} />
              <h2 className="text-lg font-bold font-inter text-zinc-800">
                Ganti Kata Sandi
              </h2>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-xl border-2 border-zinc-200 px-4 py-3 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter">
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full rounded-xl border-2 border-zinc-200 px-4 py-3 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-sm"
                  required
                />
              </div>
              <div className="flex gap-2.5 items-start p-3.5 bg-amber-50 rounded-xl border border-amber-100 text-[#b45309]">
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                <p className="text-xs font-jakarta leading-relaxed">
                  Demi keamanan, jangan gunakan kombinasi password yang mudah
                  ditebak.
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full sm:w-auto px-6 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 shadow-md"
                >
                  <Lock size={16} />
                  {isSavingPassword ? "Memproses..." : "Perbarui Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
