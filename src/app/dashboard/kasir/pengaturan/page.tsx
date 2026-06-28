"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  LogOut,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Image as ImageIcon,
} from "lucide-react";

// DAFTAR AVATAR STATIS (Sama seperti Owner)
const AVAILABLE_AVATARS = [
  "/avatars/avatar-1.png",
  "/avatars/avatar-2.png",
  "/avatars/avatar-3.png",
  "/avatars/avatar-4.png",
  "/avatars/avatar-5.png",
  "/avatars/avatar-6.png",
];

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

export default function KasirPengaturanPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // State Profil (Nama & Avatar)
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // State Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);

  // State Logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user)
        throw new Error("Gagal mengambil data autentikasi");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, role, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      setProfile({
        id: user.id,
        name: profileData.name,
        email: user.email || "",
        role: profileData.role,
        avatar_url: profileData.avatar_url,
      });

      // Set nilai default form
      setEditName(profileData.name || "");
      setEditAvatarUrl(profileData.avatar_url || "");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA SIMPAN PROFIL (Nama & Avatar Picker) ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !profile) return alert("Nama tidak boleh kosong.");

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: editName,
          avatar_url: editAvatarUrl,
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Update UI Lokal
      setProfile({ ...profile, name: editName, avatar_url: editAvatarUrl });
      alert("Profil berhasil diperbarui!");

      // Pemicu event global agar Header.tsx (jika ada) bisa ikut ter-refresh fotonya
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (error: any) {
      alert(`Gagal memperbarui profil: ${error.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6)
      return alert("Kata sandi baru minimal 6 karakter!");
    if (newPassword !== confirmPassword)
      return alert("Konfirmasi kata sandi tidak cocok!");

    setIsUpdatingAuth(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      alert("Kata sandi berhasil diperbarui!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      alert(`Gagal memperbarui kata sandi: ${error.message}`);
    } finally {
      setIsUpdatingAuth(false);
    }
  };

  const handleLogout = async () => {
    const confirmOut = window.confirm(
      "Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem?",
    );
    if (!confirmOut) return;

    setIsLoggingOut(true);
    try {
      if (profile) {
        await supabase.from("audit_logs").insert([
          {
            user_name: profile.name,
            role: "kasir",
            action: "LOGOUT",
            description: "Kasir mengakhiri sesi dan keluar dari sistem.",
          },
        ]);
      }
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error: any) {
      alert(`Gagal keluar: ${error.message}`);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 px-2 sm:px-0">
      <div className="space-y-1.5">
        <h1 className="text-2xl md:text-3xl font-black font-inter text-zinc-900 tracking-tight">
          Pengaturan Akun
        </h1>
        <p className="text-sm font-jakarta text-zinc-500">
          Kelola identitas profil, avatar, dan sesi tugas Anda.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 size={32} className="animate-spin text-zinc-300" />
          <p className="text-zinc-400 font-jakarta text-sm animate-pulse">
            Memuat data profil...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KOLOM KIRI: Identitas, Form Nama, & Avatar Picker */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
              {/* Header Kartu Profil */}
              <div className="h-20 bg-gradient-to-br from-zinc-100 to-zinc-50 relative border-b border-zinc-100">
                <div className="absolute -bottom-10 left-0 right-0 mx-auto w-20 h-20 bg-white border-4 border-white shadow-md rounded-full flex items-center justify-center text-zinc-400 z-10">
                  {editAvatarUrl ? (
                    <img
                      src={editAvatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-xl font-black font-inter text-[#FF5B37] bg-orange-50 w-full h-full rounded-full flex items-center justify-center">
                      {editName ? editName.charAt(0).toUpperCase() : "K"}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-12 pb-6 px-6 text-center space-y-1 relative z-0">
                <p className="text-[11px] text-zinc-400 font-jakarta flex items-center justify-center gap-1.5 truncate">
                  <Mail size={12} /> {profile?.email}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-zinc-800 text-white text-[9px] font-bold font-jakarta uppercase tracking-widest rounded-full shadow-sm">
                    KASIR
                  </span>
                </div>
              </div>

              {/* Form Ganti Nama & Avatar */}
              <form
                onSubmit={handleUpdateProfile}
                className="px-5 pb-5 space-y-5 border-t border-zinc-100 pt-5 bg-zinc-50/50"
              >
                {/* 1. Input Nama */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 font-inter uppercase tracking-wider block">
                    Nama Tampilan
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    placeholder="Masukkan nama"
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl font-inter text-sm font-bold text-zinc-800 focus:outline-none focus:border-[#FF5B37] focus:ring-2 focus:ring-[#FF5B37]/10 transition-all text-center"
                  />
                </div>

                {/* 2. Avatar Picker (Gaya Grid Mini) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 font-inter uppercase tracking-wider block text-center">
                    Pilih Avatar
                  </label>
                  <div className="flex flex-wrap justify-center gap-2">
                    {/* Tombol Hapus Avatar (Inisial) */}
                    <button
                      type="button"
                      onClick={() => setEditAvatarUrl("")}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black font-inter transition-all ${
                        editAvatarUrl === ""
                          ? "bg-[#FF5B37] text-white ring-2 ring-offset-1 ring-[#FF5B37]"
                          : "bg-white border border-zinc-200 text-zinc-400 hover:bg-zinc-100"
                      }`}
                    >
                      {editName ? editName.charAt(0).toUpperCase() : "O"}
                    </button>

                    {/* Looping Pilihan Avatar */}
                    {AVAILABLE_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAvatarUrl(url)}
                        className={`w-10 h-10 rounded-xl overflow-hidden bg-white transition-all ${
                          editAvatarUrl === url
                            ? "ring-2 ring-offset-1 ring-[#FF5B37] scale-110"
                            : "border border-zinc-200 hover:scale-105"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Avatar ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            e.currentTarget.parentElement?.classList.add(
                              "flex",
                              "items-center",
                              "justify-center",
                            );
                          }}
                        />
                        <ImageIcon
                          size={16}
                          className="text-zinc-300 absolute inset-0 m-auto -z-10"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tombol Simpan */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={
                      isSavingProfile ||
                      (editName === profile?.name &&
                        editAvatarUrl === profile?.avatar_url)
                    }
                    className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold font-inter text-xs transition-all active:scale-95 disabled:opacity-30 disabled:bg-zinc-200 disabled:text-zinc-400 flex items-center justify-center gap-2"
                  >
                    {isSavingProfile ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {isSavingProfile ? "Menyimpan..." : "Simpan Profil"}
                  </button>
                </div>
              </form>
            </div>

            {/* Tombol Logout (Kiri Bawah) */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold font-inter text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogOut size={16} />
              )}
              {isLoggingOut ? "Keluar Sistem..." : "Akhiri Sesi (Logout)"}
            </button>
          </div>

          {/* KOLOM KANAN: Pengaturan Keamanan Kata Sandi */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-6 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 font-inter text-lg">
                    Pembaruan Keamanan
                  </h3>
                  <p className="text-xs text-zinc-500 font-jakarta">
                    Ubah kata sandi secara berkala untuk menjaga keamanan kasir.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleUpdatePassword}
                className="p-6 space-y-6 flex-1 flex flex-col"
              >
                <div className="space-y-4 flex-1">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 font-inter">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-11 pr-12 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl font-jakarta text-sm focus:outline-none focus:border-[#FF5B37] focus:ring-2 focus:ring-[#FF5B37]/10 transition-all text-zinc-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 font-inter">
                      Konfirmasi Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Ketik ulang kata sandi baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-11 pr-12 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl font-jakarta text-sm focus:outline-none focus:border-[#FF5B37] focus:ring-2 focus:ring-[#FF5B37]/10 transition-all text-zinc-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <button
                    type="submit"
                    disabled={
                      isUpdatingAuth || !newPassword || !confirmPassword
                    }
                    className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold font-inter text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                  >
                    {isUpdatingAuth ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={16} />
                    )}
                    {isUpdatingAuth ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
