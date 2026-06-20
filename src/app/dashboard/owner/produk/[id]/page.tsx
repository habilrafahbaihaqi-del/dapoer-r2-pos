"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface Variant {
  id: string;
  name: string;
  price: number;
}

export default function VarianProdukPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const productId = params.id as string;

  const [productName, setProductName] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk form varian (Stok dihapus)
  const [variantName, setVariantName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    setLoading(true);

    const { data: productData } = await supabase
      .from("products")
      .select("name")
      .eq("id", productId)
      .single();

    if (productData) setProductName(productData.name);

    const { data: variantData } = await supabase
      .from("product_variants")
      .select("id, name, price") // Hanya mengambil id, nama, dan harga
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (variantData) setVariants(variantData);
    setLoading(false);
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantName.trim() || !price) return;

    // Supabase otomatis akan mengisi kolom stock dengan nilai 0
    const { error } = await supabase.from("product_variants").insert([
      {
        product_id: productId,
        name: variantName,
        price: parseInt(price),
      },
    ]);

    if (!error) {
      setVariantName("");
      setPrice("");
      fetchData();
    } else {
      alert("Gagal menambahkan varian.");
    }
  };

  const handleDeleteVariant = async (id: string) => {
    const confirmDelete = window.confirm("Hapus varian ini?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", id);
    if (!error) fetchData();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <button
          onClick={() => router.push("/dashboard/owner/produk")}
          className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 font-jakarta mb-4 flex items-center transition-colors"
        >
          ← Kembali ke Daftar Produk
        </button>
        <h1 className="text-3xl font-bold font-inter text-zinc-900">
          Atur Varian: {productName || "Memuat..."}
        </h1>
        <p className="text-zinc-500 font-jakarta mt-2">
          Tambahkan ukuran dan harga untuk produk ini.
        </p>
      </div>

      {/* Form Tambah Varian (Tanpa Input Stok) */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <form
          onSubmit={handleAddVariant}
          className="flex flex-col sm:flex-row gap-4 items-end"
        >
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-zinc-500 font-jakarta mb-1.5 uppercase tracking-wider">
              Nama Varian
            </label>
            <input
              type="text"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              placeholder="Misal: Small / Medium / Default"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-jakarta"
              required
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-xs font-semibold text-zinc-500 font-jakarta mb-1.5 uppercase tracking-wider">
              Harga (Rp)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="5000"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-jakarta"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-zinc-900 text-white font-bold rounded-lg hover:bg-zinc-800 transition-colors active:scale-[0.98] h-[42px]"
          >
            Tambah
          </button>
        </form>
      </div>

      {/* Tabel Daftar Varian (Tanpa Kolom Stok) */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm">
                Nama Varian
              </th>
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm">
                Harga
              </th>
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm w-24 text-center">
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
            ) : variants.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-zinc-500 font-jakarta"
                >
                  Belum ada varian. Produk ini tidak akan bisa dijual sampai
                  memiliki minimal 1 varian.
                </td>
              </tr>
            ) : (
              variants.map((variant) => (
                <tr
                  key={variant.id}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-6 py-4 text-zinc-800 font-jakarta font-medium">
                    {variant.name}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-jakarta">
                    Rp {variant.price.toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteVariant(variant.id)}
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
