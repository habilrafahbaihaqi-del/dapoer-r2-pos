"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Save, Trash2, FolderPlus } from "lucide-react";

interface CategoryWithCount {
  id: string;
  name: string;
  product_count: number;
}

export default function ManajemenKategoriPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Mengambil kategori sekaligus menghitung jumlah produk di dalamnya
      const { data, error } = await supabase
        .from("categories")
        .select(
          `
          id,
          name,
          products ( id )
        `,
        )
        .order("name", { ascending: true });

      if (data) {
        const formattedData = data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          product_count: cat.products?.length || 0,
        }));
        setCategories(formattedData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase.from("categories").insert([{ name }]);

    if (!error) {
      setName("");
      fetchCategories();
    } else {
      alert("Gagal menambahkan kategori.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Hapus kategori ini? Produk di dalamnya mungkin akan kehilangan kategorinya.",
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) fetchCategories();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-inter text-zinc-900 tracking-tight">
          Manajemen Kategori
        </h1>
        <p className="text-zinc-500 font-jakarta text-sm lg:text-base">
          Kelola kategori produk untuk memudahkan pengelompokan produk di Dapoer
          R2.
        </p>
      </div>

      {/* Form Tambah Kategori Baru - Perbaikan Penjajaran Tombol */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex items-center gap-3 text-[#FF5B37]">
            <FolderPlus size={24} strokeWidth={2.5} />
            <h2 className="text-lg font-bold font-inter text-zinc-800">
              Tambah Kategori Baru
            </h2>
          </div>

          <form onSubmit={handleAdd} className="w-full">
            <div className="flex flex-col space-y-2">
              {/* Label di Atas */}
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter">
                Nama Kategori
              </label>

              {/* Baris Input dan Tombol */}
              <div className="flex flex-col lg:flex-row gap-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Minuman Dingin"
                  className="flex-1 rounded-xl border-2 border-zinc-200 px-5 py-3 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-sm lg:text-base"
                  required
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-[#FF5B37] text-white font-bold rounded-xl hover:bg-[#e04a2a] transition-all shadow-lg shadow-[#FF5B37]/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 whitespace-nowrap"
                >
                  <Save size={18} />
                  {isSubmitting ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>

              {/* Teks Bantuan di Bawah */}
              <p className="text-[11px] text-zinc-400 font-jakarta">
                Masukkan nama kategori produk yang akan ditambahkan.
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Tabel Daftar Kategori - Clean Table (No Icons) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <span className="w-2 h-6 bg-[#FF5B37] rounded-full"></span>
          <h2 className="text-lg font-bold font-inter text-zinc-800">
            Daftar Kategori Aktif
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-5 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter w-20">
                    No
                  </th>
                  <th className="px-6 py-5 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter">
                    Nama Kategori
                  </th>
                  <th className="px-6 py-5 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter text-center">
                    Jumlah Produk
                  </th>
                  <th className="px-6 py-5 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter text-center w-32">
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
                      Memuat data kategori...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-zinc-400 font-jakarta text-sm italic"
                    >
                      Belum ada kategori yang ditambahkan.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, index) => (
                    <tr
                      key={cat.id}
                      className="group hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-6 py-5 text-sm text-zinc-500 font-inter">
                        {index + 1}
                      </td>
                      <td className="px-6 py-5">
                        {/* Menghilangkan ikon sesuai instruksi */}
                        <span className="text-sm lg:text-base font-bold text-zinc-800 font-inter">
                          {cat.name}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-bold font-jakarta border border-zinc-200">
                          {cat.product_count} Produk
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Hapus Kategori"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Table Info */}
          <div className="p-5 bg-zinc-50/30 border-t border-zinc-100 flex justify-between items-center px-6">
            <p className="text-xs font-bold text-zinc-400 font-jakarta">
              Total <span className="text-zinc-900">{categories.length}</span>{" "}
              Kategori
            </p>
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 cursor-not-allowed">
                ‹
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF5B37] text-white font-bold text-xs shadow-md shadow-[#FF5B37]/20">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 cursor-not-allowed">
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
