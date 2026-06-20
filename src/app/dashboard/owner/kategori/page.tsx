"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

// Mendefinisikan tipe data kategori sesuai tabel di database
interface Category {
  id: string;
  name: string;
  created_at: string;
}

export default function KategoriPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  // Mengambil data kategori saat halaman pertama kali dimuat
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCategories(data);
    setLoading(false);
  };

  // Fungsi untuk menambah kategori baru
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const { error } = await supabase.from("categories").insert([{ name }]);
    if (!error) {
      setName("");
      fetchCategories(); // Refresh data setelah berhasil menambah
    } else {
      alert("Gagal menambahkan kategori.");
    }
  };

  // Fungsi untuk menghapus kategori
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus kategori ini?",
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) {
      fetchCategories(); // Refresh data setelah berhasil menghapus
    } else {
      alert("Gagal menghapus kategori.");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-inter text-zinc-900">
          Manajemen Kategori
        </h1>
        <p className="text-zinc-500 font-jakarta mt-2">
          Kelola daftar kategori untuk produk-produk di Dapoer R2.
        </p>
      </div>

      {/* Form Tambah Kategori */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <h2 className="text-lg font-semibold font-inter text-zinc-800 mb-4">
          Tambah Kategori Baru
        </h2>
        <form onSubmit={handleAdd} className="flex gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Minuman Dingin"
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-jakarta"
            required
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-zinc-900 text-white font-bold rounded-lg hover:bg-zinc-800 transition-colors active:scale-[0.98]"
          >
            Simpan
          </button>
        </form>
      </div>

      {/* Tabel Daftar Kategori */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm">
                Nama Kategori
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
            ) : categories.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-8 text-center text-zinc-500 font-jakarta"
                >
                  Belum ada kategori yang ditambahkan.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr
                  key={category.id}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-6 py-4 text-zinc-800 font-jakarta">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors"
                    >
                      Hapus
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
