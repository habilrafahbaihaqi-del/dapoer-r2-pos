"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

// Definisi tipe data
interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  category_id: string;
  // Supabase akan mengembalikan relasi kategori dalam bentuk objek
  categories: { name: string };
}

export default function ProdukPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // State untuk form input
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Mengambil data kategori untuk pilihan dropdown
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (categoryData) {
      setCategories(categoryData);
      // Set nilai default dropdown ke kategori pertama jika ada
      if (categoryData.length > 0) setCategoryId(categoryData[0].id);
    }

    // Mengambil data produk beserta nama kategorinya (Join Table)
    const { data: productData } = await supabase
      .from("products")
      .select("id, name, category_id, categories(name)")
      .order("created_at", { ascending: false });

    if (productData) {
      // Kita perlu memberi tahu TypeScript bahwa data yang dikembalikan sesuai dengan interface kita
      setProducts(productData as unknown as Product[]);
    }

    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;

    const { error } = await supabase
      .from("products")
      .insert([{ name, category_id: categoryId }]);

    if (!error) {
      setName("");
      fetchData(); // Refresh tabel setelah menambah data
    } else {
      alert("Gagal menambahkan produk.");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus produk ini?",
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      fetchData();
    } else {
      alert("Gagal menghapus produk.");
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-inter text-zinc-900">
          Manajemen Produk
        </h1>
        <p className="text-zinc-500 font-jakarta mt-2">
          Tambahkan produk baru dan kelompokkan sesuai kategorinya.
        </p>
      </div>

      {/* Form Tambah Produk */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <h2 className="text-lg font-semibold font-inter text-zinc-800 mb-4">
          Tambah Produk Baru
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Produk (Misal: Es Teh Manis)"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-jakarta"
              required
            />
          </div>
          <div className="sm:w-64">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-jakarta bg-white"
              required
            >
              {categories.length === 0 ? (
                <option value="" disabled>
                  Belum ada kategori
                </option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <button
            type="submit"
            disabled={categories.length === 0}
            className="px-6 py-2.5 bg-zinc-900 text-white font-bold rounded-lg hover:bg-zinc-800 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simpan
          </button>
        </form>
        {categories.length === 0 && (
          <p className="text-sm text-amber-600 mt-2 font-jakarta">
            *Anda harus membuat kategori terlebih dahulu sebelum bisa
            menambahkan produk.
          </p>
        )}
      </div>

      {/* Tabel Daftar Produk */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm">
                Nama Produk
              </th>
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm">
                Kategori
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
                  colSpan={3}
                  className="px-6 py-8 text-center text-zinc-500 font-jakarta"
                >
                  Memuat data...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-zinc-500 font-jakarta"
                >
                  Belum ada produk yang ditambahkan.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-6 py-4 text-zinc-800 font-jakarta font-medium">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-jakarta">
                    {product.categories?.name}
                  </td>
                  <td className="px-6 py-4 flex items-center justify-center gap-3">
                    {/* Tombol baru untuk mengatur varian */}
                    <button
                      onClick={() =>
                        (window.location.href = `/dashboard/owner/produk/${product.id}`)
                      }
                      className="text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      Atur Varian
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      onClick={() => handleDelete(product.id)}
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
