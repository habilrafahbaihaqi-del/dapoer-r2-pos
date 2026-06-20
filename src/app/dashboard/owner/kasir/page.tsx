"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface UserProfile {
  id: string;
  name: string;
}

export default function ManajemenUserPage() {
  const supabase = createClient();
  const [cashiers, setCashiers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "kasir")
      .order("name", { ascending: true });

    if (data) setCashiers(data);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setIsSubmitting(true);

    try {
      // Memanggil API backend yang kita buat
      const res = await fetch("/api/kasir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Akun kasir berhasil dibuat!");
      setName("");
      setEmail("");
      setPassword("");
      fetchCashiers();
    } catch (error: any) {
      alert("Gagal: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Perhatian: Menghapus akun kasir akan menghapus seluruh data login-nya secara permanen. Lanjutkan?",
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/kasir", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error("Gagal menghapus kasir");
      fetchCashiers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-inter text-zinc-900">
          Manajemen User
        </h1>
        <p className="text-zinc-500 font-jakarta mt-2">
          Buat dan kelola akun khusus untuk para kasir.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <h2 className="text-lg font-semibold font-inter text-zinc-800 mb-4">
          Buat Akun Kasir Baru
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-500 font-jakarta mb-1.5 uppercase tracking-wider">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Budi Santoso"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-jakarta"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-500 font-jakarta mb-1.5 uppercase tracking-wider">
                Email (Untuk Login)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kasir1@dapoerr2.com"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-jakarta"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-500 font-jakarta mb-1.5 uppercase tracking-wider">
                Password (Min 6 Karakter)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-jakarta"
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-zinc-900 text-white font-bold rounded-lg hover:bg-zinc-800 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Memproses..." : "Buat Akun"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm">
                Nama Kasir
              </th>
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm w-32 text-center">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {loading ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-8 text-center text-zinc-500 font-jakarta"
                >
                  Memuat data...
                </td>
              </tr>
            ) : cashiers.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-8 text-center text-zinc-500 font-jakarta"
                >
                  Belum ada akun kasir terdaftar.
                </td>
              </tr>
            ) : (
              cashiers.map((cashier) => (
                <tr
                  key={cashier.id}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-6 py-4 text-zinc-800 font-jakarta font-medium">
                    {cashier.name}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(cashier.id)}
                      className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors"
                    >
                      Hapus Akun
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
