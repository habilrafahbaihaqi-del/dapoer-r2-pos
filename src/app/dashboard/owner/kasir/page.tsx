"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  UserPlus,
  Users,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Plus,
} from "lucide-react";

interface CashierProfile {
  id: string;
  name: string;
  email: string;
}

export default function ManajemenKasirPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [cashiers, setCashiers] = useState<CashierProfile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk form tambah kasir
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, role, email");

      if (error) {
        alert(`Gagal memuat kasir: ${error.message}`);
        return;
      }

      if (data) {
        const cashierRows = data.filter(
          (profile: any) => profile.role?.toLowerCase() === "kasir",
        );

        const formattedCashiers = cashierRows.map((cashier) => ({
          id: cashier.id,
          name: cashier.name,
          email: cashier.email || "-",
        }));

        setCashiers(formattedCashiers);
      }
    } catch (error) {
      console.error("Crash system:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword) return;
    if (newPassword.length < 6) {
      alert("Password minimal harus 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/create-cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal terhubung ke server");
      }

      alert(
        `Sukses! Akun kasir ${newName} sudah dibuat dan siap digunakan untuk login.`,
      );
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      fetchCashiers();
    } catch (error: any) {
      alert(`Gagal membuat akun kasir: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // PERBAIKAN: Fungsi Hard Delete menembus auth.users via API Route
  const handleDeleteCashier = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus permanen kasir ${name}? Email akan dibebaskan dan bisa digunakan kembali.`,
    );
    if (!confirmDelete) return;

    try {
      // Memanggil API Route yang sudah dilengkapi Service Role Key
      const response = await fetch("/api/delete-kasir", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal menghapus dari sistem Auth");
      }

      alert("Kasir berhasil dihapus permanen!");
      fetchCashiers(); // Segarkan tabel kasir
    } catch (error: any) {
      alert(`Gagal menghapus kasir: ${error.message}`);
    }
  };

  const getInitials = (name: string) => {
    const words = name.trim().split(" ");
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const avatarColors = [
    "bg-red-100 text-red-600",
    "bg-amber-100 text-amber-600",
    "bg-orange-100 text-orange-600",
    "bg-emerald-100 text-emerald-600",
    "bg-blue-100 text-blue-600",
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 relative">
      {/* Header Section */}
      <div className="space-y-2 px-2">
        <h1 className="text-3xl font-bold font-inter text-zinc-900 tracking-tight">
          Manajemen Kasir
        </h1>
        <p className="text-zinc-500 font-jakarta text-sm lg:text-base max-w-2xl">
          Kelola akun kasir yang dapat digunakan untuk operasional transaksi di
          outlet.
        </p>
      </div>

      {/* FORM TAMBAH KASIR BARU */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-full overflow-hidden pointer-events-none opacity-40 hidden md:block">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-50 rounded-full blur-2xl"></div>
          <div className="absolute right-10 top-10 flex items-center justify-center">
            <div className="w-24 h-24 bg-red-100/50 rounded-full flex items-center justify-center">
              <User size={48} className="text-red-200" />
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8 space-y-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 text-[#FF5B37] mb-1">
              <UserPlus size={24} strokeWidth={2.5} />
              <h2 className="text-lg font-bold font-inter text-zinc-800">
                Buat Akun Kasir Baru
              </h2>
            </div>
            <p className="text-sm text-zinc-500 font-jakarta">
              Isi data di bawah ini untuk membuat akun kasir.
            </p>
          </div>

          <form onSubmit={handleAddCashier} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-800 font-inter">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full rounded-xl border border-zinc-200 pl-11 pr-4 py-3 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-800 font-inter">
                  Email (Untuk Login)
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Contoh: kasir@dapoerr2.com"
                    className="w-full rounded-xl border border-zinc-200 pl-11 pr-4 py-3 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-800 font-inter">
                  Password (Min. 6 Karakter)
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full rounded-xl border border-zinc-200 pl-11 pr-12 py-3 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-sm"
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
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 py-3.5 bg-[#cc1a1a] text-white font-bold rounded-xl hover:bg-[#a61313] transition-all shadow-md flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-70"
              >
                <Plus size={18} strokeWidth={3} />
                {isSubmitting ? "Memproses..." : "Buat Akun"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TABEL DAFTAR KASIR AKTIF */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center gap-3 text-[#FF5B37]">
          <Users size={20} strokeWidth={2.5} />
          <h2 className="font-bold text-zinc-800 font-inter text-lg">
            Daftar Akun Kasir
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-5 font-bold text-red-600 text-[11px] uppercase tracking-widest font-inter w-16 text-center">
                  No
                </th>
                <th className="px-6 py-5 font-bold text-red-600 text-[11px] uppercase tracking-widest font-inter">
                  Nama Kasir
                </th>
                <th className="px-6 py-5 font-bold text-red-600 text-[11px] uppercase tracking-widest font-inter">
                  Email
                </th>
                <th className="px-6 py-5 font-bold text-red-600 text-[11px] uppercase tracking-widest font-inter text-center w-32">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-zinc-400 font-jakarta text-sm animate-pulse"
                  >
                    Memuat data kasir...
                  </td>
                </tr>
              ) : cashiers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-zinc-400 font-jakarta text-sm italic"
                  >
                    Belum ada akun kasir yang ditambahkan.
                  </td>
                </tr>
              ) : (
                cashiers.map((cashier, index) => {
                  const colorClass = avatarColors[index % avatarColors.length];

                  return (
                    <tr
                      key={cashier.id}
                      className="group hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-6 py-5 text-sm text-zinc-800 font-inter font-medium text-center">
                        {index + 1}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-inter text-sm ${colorClass}`}
                          >
                            {getInitials(cashier.name)}
                          </div>
                          <span className="text-sm font-bold text-zinc-700 font-inter">
                            {cashier.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-zinc-500 font-jakarta">
                        {cashier.email}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() =>
                            handleDeleteCashier(cashier.id, cashier.name)
                          }
                          className="w-10 h-10 inline-flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors rounded-xl active:scale-95 border border-red-100"
                          title="Hapus Akun Kasir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 bg-zinc-50/30 border-t border-zinc-100 flex justify-between items-center px-6">
          <p className="text-xs font-medium text-zinc-500 font-jakarta">
            Total{" "}
            <span className="font-bold text-red-600">{cashiers.length}</span>{" "}
            akun kasir
          </p>
        </div>
      </div>
    </div>
  );
}
