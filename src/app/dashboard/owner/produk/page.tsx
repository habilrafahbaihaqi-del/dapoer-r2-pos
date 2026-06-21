"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Package,
  Search,
  Edit3,
  Trash2,
  UploadCloud,
  Save,
  Lightbulb,
  X,
  Plus,
} from "lucide-react";

interface ProductWithCategory {
  id: string;
  name: string;
  image_url: string | null;
  min_price: number;
  total_variants: number;
  category_id: string;
  categories: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export default function ManajemenProdukPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<
    ProductWithCategory[]
  >([]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    image: null as File | null,
  });

  // --- STATE UNTUK MODAL ATUR VARIAN ---
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithCategory | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isVariantLoading, setIsVariantLoading] = useState(false);

  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const results = products.filter((product) =>
        product.name.toLowerCase().includes(lowercasedSearch),
      );
      setFilteredProducts(results);
    }
  }, [searchTerm, products]);

  // 1. UPDATE: Fetch Produk beserta Kalkulasi Real-time Varian & Harga Termurah
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          image_url,
          category_id,
          categories ( name ),
          product_variants ( price )
        `,
        )
        .order("name", { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedData = data.map((prod: any) => {
          const prodVariants = prod.product_variants || [];
          const total_variants = prodVariants.length;

          // Cari harga termurah, jika tidak ada varian set 0
          const min_price =
            total_variants > 0
              ? Math.min(...prodVariants.map((v: any) => Number(v.price)))
              : 0;

          return {
            id: prod.id,
            name: prod.name,
            image_url: prod.image_url,
            category_id: prod.category_id,
            categories: prod.categories,
            min_price,
            total_variants,
          };
        });
        setProducts(formattedData as ProductWithCategory[]);
        setFilteredProducts(formattedData as ProductWithCategory[]);
      }
    } catch (err) {
      console.error("Gagal memuat produk:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });
    if (data) setCategories(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewProduct({ ...newProduct, image: e.target.files[0] });
    }
  };

  // Fungsi tambahan untuk memproses unggahan berkas ke Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Membuat nama file yang unik berdasarkan timestamp agar tidak saling tumpang tindih
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Mengunggah file ke bucket 'product-images'
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Mengambil URL publik dari file yang berhasil diunggah
      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error("Gagal mengunggah gambar:", error.message);
      return null;
    }
  };

  // Pembaruan fungsi handleAdd untuk mendukung unggah foto nyata
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.category_id) {
      alert("Nama produk dan kategori wajib diisi.");
      return;
    }
    setIsSubmitting(true);

    try {
      let finalImageUrl = null;

      // Jika Owner memilih file gambar, proses unggah dijalankan terlebih dahulu
      if (newProduct.image) {
        finalImageUrl = await uploadImage(newProduct.image);
        if (!finalImageUrl) {
          alert("Gagal mengunggah foto produk, proses penyimpanan dibatalkan.");
          setIsSubmitting(false);
          return;
        }
      }

      // Menyimpan data produk ke tabel database lengkap dengan URL gambarnya
      const { error } = await supabase.from("products").insert([
        {
          name: newProduct.name,
          category_id: newProduct.category_id,
          image_url: finalImageUrl, // URL publik tersimpan di sini
        },
      ]);

      if (error) throw error;

      // Mereset form isian setelah berhasil
      setNewProduct({ name: "", category_id: "", image: null });
      alert("Produk baru berhasil disimpan!");
      fetchProducts();
    } catch (error: any) {
      alert(`Gagal menambahkan produk: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. UPDATE: Logika Hapus Aman (Hapus Varian dulu, baru Produk)
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Hapus produk ini secara permanen? Seluruh varian di dalamnya juga akan terhapus.",
    );
    if (!confirmDelete) return;

    try {
      // Langkah A: Hapus semua varian yang terkait dengan produk ini
      await supabase.from("product_variants").delete().eq("product_id", id);

      // Langkah B: Hapus produk utamanya
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;
      fetchProducts();
    } catch (error: any) {
      alert(`Gagal menghapus produk: ${error.message}`);
    }
  };

  // --- FUNGSI MODAL ATUR VARIAN ---
  const openVariantModal = async (product: ProductWithCategory) => {
    setSelectedProduct(product);
    setIsVariantModalOpen(true);
    fetchVariants(product.id);
  };

  const closeVariantModal = () => {
    setIsVariantModalOpen(false);
    setSelectedProduct(null);
    setVariants([]);
    setNewVariantName("");
    setNewVariantPrice("");
  };

  const fetchVariants = async (productId: string) => {
    setIsVariantLoading(true);
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("price", { ascending: true });

    if (data) setVariants(data);
    setIsVariantLoading(false);
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newVariantName || !newVariantPrice) return;

    const { error } = await supabase.from("product_variants").insert([
      {
        product_id: selectedProduct.id,
        name: newVariantName,
        price: parseInt(newVariantPrice),
        stock: 0, // Default stok 0 saat varian baru dibuat
      },
    ]);

    if (!error) {
      setNewVariantName("");
      setNewVariantPrice("");
      fetchVariants(selectedProduct.id); // Segarkan list di modal
      fetchProducts(); // Segarkan tabel utama agar Total Varian update
    } else {
      alert("Gagal menambahkan varian");
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId);
    if (!error) {
      fetchVariants(selectedProduct!.id);
      fetchProducts();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 relative">
      {/* Header Section */}
      <div className="space-y-2 px-2">
        <h1 className="text-3xl font-bold font-inter text-zinc-900 tracking-tight">
          Manajemen Produk
        </h1>
        <p className="text-zinc-500 font-jakarta text-sm lg:text-base max-w-2xl">
          Tambah, edit, dan kelola produk beserta variannya. Atur harga dan stok
          melalui aksi Atur Varian.
        </p>
      </div>

      {/* Form Tambah Produk Baru */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 lg:p-8 space-y-8">
          <div className="flex items-center gap-3 text-[#FF5B37]">
            <Package size={24} strokeWidth={2.5} />
            <h2 className="text-lg font-bold font-inter text-zinc-800">
              Tambah Produk Baru
            </h2>
          </div>

          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter">
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  placeholder="Contoh: Es Teh Manis"
                  className="w-full rounded-xl border-2 border-zinc-200 px-5 py-3 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-sm lg:text-base"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter">
                  Kategori
                </label>
                <select
                  value={newProduct.category_id}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category_id: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border-2 border-zinc-200 px-5 py-3.5 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-sm lg:text-base bg-white cursor-pointer"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2 flex-1">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter">
                  Unggah Foto Produk
                </label>
                <label className="flex flex-col items-center justify-center gap-3 w-full h-40 border-2 border-zinc-200 border-dashed rounded-xl cursor-pointer bg-zinc-50/50 hover:border-[#FF5B37]/50 hover:bg-[#FF5B37]/5 transition-all">
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <UploadCloud size={32} className="text-[#FF5B37] mb-3" />
                    <p className="text-sm font-bold text-zinc-700 font-inter">
                      {newProduct.image
                        ? newProduct.image.name
                        : "Klik untuk unggah foto"}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-jakarta mt-1">
                      Format: JPG, PNG (Maks. 2MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <div className="space-y-2 flex-1 lg:mt-[1.7rem]">
                <div className="bg-[#FF5B37]/5 rounded-xl border border-[#FF5B37]/10 p-5 flex items-start gap-3 h-40">
                  <Lightbulb size={20} className="text-[#FF5B37] mt-0.5" />
                  <p className="text-sm font-jakarta text-[#e04a2a] leading-relaxed">
                    <strong>Tips:</strong> Gunakan foto dengan latar belakang
                    bersih agar produk terlihat lebih menarik bagi pelanggan di
                    layar POS Kasir.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full lg:w-auto px-8 py-3.5 bg-[#FF5B37] text-white font-bold rounded-xl hover:bg-[#e04a2a] transition-all shadow-lg shadow-[#FF5B37]/20 flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-70"
              >
                <Save size={18} />
                {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tabel Daftar Produk Aktif */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-6 bg-[#FF5B37] rounded-full"></span>
            <h2 className="text-lg font-bold font-inter text-zinc-800">
              Daftar Produk Aktif
            </h2>
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari produk berdasarkan nama..."
              className="w-full rounded-full border border-zinc-200 px-12 py-3 text-sm text-zinc-900 focus:border-[#FF5B37]/50 focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta bg-white"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-5 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter w-16 text-center">
                    No
                  </th>
                  <th className="px-6 py-5 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter min-w-[250px]">
                    Nama Produk
                  </th>
                  <th className="px-6 py-5 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter text-center">
                    Total Varian
                  </th>
                  <th className="px-6 py-5 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter">
                    Harga (Mulai dari)
                  </th>
                  <th className="px-6 py-5 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter">
                    Kategori
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
                      colSpan={6}
                      className="px-6 py-12 text-center text-zinc-400 font-jakarta text-sm animate-pulse"
                    >
                      Memuat data produk...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-zinc-400 font-jakarta text-sm italic"
                    >
                      Belum ada produk yang ditambahkan.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod, index) => (
                    <tr
                      key={prod.id}
                      className="group hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-6 py-5 text-sm text-zinc-500 font-inter text-center">
                        {index + 1}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 shadow-sm flex items-center justify-center text-[#FF5B37]/30 overflow-hidden">
                            {prod.image_url ? (
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={20} strokeWidth={1.5} />
                            )}
                          </div>
                          <span className="text-sm lg:text-base font-bold text-zinc-800 font-inter leading-tight">
                            {prod.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-sm font-medium text-zinc-600 font-jakarta">
                        {prod.total_variants} Varian
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-zinc-900 font-inter">
                        Rp {prod.min_price.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-bold font-jakarta border border-zinc-200">
                          {prod.categories?.name || "Tanpa Kategori"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openVariantModal(prod)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white text-zinc-700 font-medium text-xs rounded-xl hover:bg-zinc-50 hover:text-[#FF5B37] hover:border-[#FF5B37]/30 transition-all border border-zinc-200 active:scale-95 shadow-sm"
                          >
                            <Edit3 size={14} className="text-inherit" />
                            Atur Varian
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="p-2.5 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Produk Permanen"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-5 bg-zinc-50/30 border-t border-zinc-100 flex justify-between items-center px-6">
            <p className="text-xs font-bold text-zinc-400 font-jakarta">
              Total{" "}
              <span className="text-zinc-900">{filteredProducts.length}</span>{" "}
              produk aktif
            </p>
          </div>
        </div>
      </div>

      {/* --- MODAL ATUR VARIAN --- */}
      {isVariantModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 font-inter">
                  Atur Varian Produk
                </h3>
                <p className="text-sm text-zinc-500 font-jakarta">
                  {selectedProduct.name}
                </p>
              </div>
              <button
                onClick={closeVariantModal}
                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Form Tambah Varian Baru di dalam Modal */}
              <form
                onSubmit={handleAddVariant}
                className="flex flex-col sm:flex-row gap-3 mb-8 bg-zinc-50 p-4 rounded-xl border border-zinc-100"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    placeholder="Nama Varian (misal: Large)"
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 text-sm font-jakarta focus:outline-none focus:border-[#FF5B37] focus:ring-1 focus:ring-[#FF5B37]"
                    required
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={newVariantPrice}
                    onChange={(e) => setNewVariantPrice(e.target.value)}
                    placeholder="Harga (misal: 15000)"
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 text-sm font-jakarta focus:outline-none focus:border-[#FF5B37] focus:ring-1 focus:ring-[#FF5B37]"
                    required
                    min="0"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#FF5B37] text-white font-bold text-sm rounded-lg hover:bg-[#e04a2a] transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
                >
                  <Plus size={16} /> Tambah
                </button>
              </form>

              {/* Daftar Varian yang Sudah Ada */}
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter mb-3">
                  Varian Saat Ini
                </h4>
                {isVariantLoading ? (
                  <p className="text-center text-sm text-zinc-400 py-4 animate-pulse">
                    Memuat varian...
                  </p>
                ) : variants.length === 0 ? (
                  <p className="text-center text-sm text-zinc-400 py-4 italic border border-dashed border-zinc-200 rounded-xl">
                    Belum ada varian. Silakan tambahkan varian pertama.
                  </p>
                ) : (
                  variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-zinc-800 font-inter text-sm">
                          {v.name}
                        </p>
                        <p className="text-xs font-medium text-zinc-500 font-jakarta mt-0.5">
                          Harga: Rp {v.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteVariant(v.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Varian"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
