"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Wallet,
  QrCode,
  Banknote,
  CheckCircle2,
  X,
  ChevronRight,
  PackageOpen,
} from "lucide-react";

// --- INTERFACES ---
interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  category_id: string;
  categories: { name: string };
  product_variants: Variant[];
}

interface CartItem {
  cart_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  price: number;
  quantity: number;
  stock: number; // PERBAIKAN: Menyimpan data sisa stok untuk pembatasan tombol (+)
  image_url: string | null;
}

export default function KasirUtamaPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Semua");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"TUNAI" | "QRIS">("TUNAI");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase
          .from("products")
          .select(
            `id, name, image_url, category_id, categories(name), product_variants(id, name, price, stock)`,
          )
          .order("name"),
        supabase.from("categories").select("id, name").order("name"),
      ]);

      if (prodRes.data) {
        setProducts(prodRes.data as any as Product[]);
      }
      if (catRes.data) {
        setCategories(catRes.data as any);
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        activeCategory === "Semua" || p.categories?.name === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, activeCategory]);

  // --- CART LOGIC YANG DIPERBAIKI (CEGAH TRANSAKSI BARANG HABIS) ---
  const handleProductClick = (product: Product) => {
    if (!product.product_variants || product.product_variants.length === 0) {
      alert("Produk ini belum memiliki varian/harga. Silakan lapor Owner.");
      return;
    }

    const totalStock = product.product_variants.reduce(
      (sum, v) => sum + v.stock,
      0,
    );
    if (totalStock <= 0) {
      // Tolak jika semua varian stoknya 0
      alert("Maaf, stok produk ini sedang kosong!");
      return;
    }

    if (product.product_variants.length === 1) {
      if (product.product_variants[0].stock <= 0) {
        alert("Maaf, stok produk ini sedang kosong!");
        return;
      }
      addToCart(product, product.product_variants[0]);
    } else {
      setSelectedProduct(product);
      setIsVariantModalOpen(true);
    }
  };

  const addToCart = (product: Product, variant: Variant) => {
    if (variant.stock <= 0) {
      alert("Maaf, stok varian ini sedang kosong!");
      return;
    }

    const cartId = `${product.id}-${variant.id}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.cart_id === cartId);
      if (existing) {
        // PERBAIKAN: Cek agar tidak melebihi stok
        if (existing.quantity >= variant.stock) {
          alert(
            `Maksimal pesanan untuk ${variant.name} adalah ${variant.stock} pcs`,
          );
          return prev;
        }
        return prev.map((item) =>
          item.cart_id === cartId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          cart_id: cartId,
          product_id: product.id,
          variant_id: variant.id,
          product_name: product.name,
          variant_name: variant.name,
          price: variant.price,
          quantity: 1,
          stock: variant.stock,
          image_url: product.image_url,
        },
      ];
    });
    setIsVariantModalOpen(false);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cart_id === cartId) {
          const newQty = item.quantity + delta;
          // PERBAIKAN: Batasi tombol plus agar tidak lewat stok
          if (newQty > item.stock) {
            alert(`Hanya tersisa ${item.stock} pcs untuk produk ini.`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }),
    );
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cart_id !== cartId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const changeAmount =
    paymentMethod === "TUNAI" && typeof amountPaid === "number"
      ? amountPaid - cartTotal
      : 0;

  // --- CHECKOUT LOGIC YANG DIPERBAIKI (PEMOTONGAN STOK OTOMATIS) ---
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (
      paymentMethod === "TUNAI" &&
      (typeof amountPaid !== "number" || amountPaid < cartTotal)
    ) {
      alert("Nominal uang tunai kurang dari total belanja!");
      return;
    }

    setIsProcessing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let cashierName = "Kasir";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        if (profile) cashierName = profile.name;
      }

      // 1. Simpan Transaksi Utama
      const { data: trxData, error: trxError } = await supabase
        .from("transactions")
        .insert([
          {
            total: cartTotal,
            payment_method: paymentMethod,
            cashier_id: user?.id,
            invoice_number: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 10000)}`,
          },
        ])
        .select()
        .single();
      if (trxError) throw trxError;

      // 2. Simpan Item Transaksi
      const itemsToInsert = cart.map((item) => ({
        transaction_id: trxData.id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price,
      }));
      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // 3. PERBAIKAN: Loop untuk memotong stok setiap barang di database
      for (const item of cart) {
        // Kita tarik stok terbaru dari database (jaga-jaga jika ada kasir lain yang transaksi bersamaan)
        const { data: currentVariant } = await supabase
          .from("product_variants")
          .select("stock")
          .eq("id", item.variant_id)
          .single();

        if (currentVariant) {
          // Kurangi stok, pastikan tidak sampai negatif
          const newStock = Math.max(0, currentVariant.stock - item.quantity);
          await supabase
            .from("product_variants")
            .update({ stock: newStock })
            .eq("id", item.variant_id);
        }
      }

      // 4. Catat Log
      await supabase.from("audit_logs").insert([
        {
          user_name: cashierName,
          role: "kasir",
          action: "TRANSAKSI_BARU",
          description: `Memproses transaksi (${trxData.invoice_number}) sebesar Rp ${cartTotal.toLocaleString("id-ID")} via ${paymentMethod}`,
        },
      ]);

      // Refresh tampilan menu di background agar stok terbaru langsung terlihat saat modal ditutup
      fetchProductsAndCategories();
      setCheckoutSuccess(true);
    } catch (error: any) {
      alert(`Gagal memproses transaksi: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeCheckoutAndReset = () => {
    setCheckoutSuccess(false);
    setIsCheckoutModalOpen(false);
    setIsMobileCartOpen(false);
    setCart([]);
    setAmountPaid("");
    setPaymentMethod("TUNAI");
  };

  const CartContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className="text-[#FF5B37]" />
          <h2 className="font-bold text-zinc-800 font-inter text-lg">
            Keranjang
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full text-xs font-bold font-jakarta">
            {cartItemsCount} Item
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-95 rounded-full text-zinc-500 transition-all lg:hidden"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3 opacity-60">
            <PackageOpen size={48} strokeWidth={1} />
            <p className="text-sm font-jakarta font-medium text-center px-8">
              Belum ada produk.
              <br />
              Silakan pilih menu di samping.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {cart.map((item) => (
              <div
                key={item.cart_id}
                className="p-3 bg-white hover:bg-zinc-50 rounded-xl group transition-colors flex gap-3 border border-transparent hover:border-zinc-100"
              >
                <div className="w-14 h-14 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                      <ShoppingBag size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-bold text-zinc-800 font-inter text-sm leading-tight truncate">
                        {item.product_name}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-jakarta mt-0.5">
                        {item.variant_name}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cart_id)}
                      className="text-zinc-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-bold text-[#FF5B37] font-inter text-sm">
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                    </p>
                    <div className="flex items-center gap-3 bg-zinc-100 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.cart_id, -1)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-zinc-600 hover:text-[#FF5B37] active:scale-95"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cart_id, 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-zinc-600 hover:text-[#FF5B37] active:scale-95"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-zinc-500 font-inter">
            Total Tagihan
          </span>
          <span className="text-xl font-black text-zinc-900 font-inter">
            Rp {cartTotal.toLocaleString("id-ID")}
          </span>
        </div>
        <button
          disabled={cart.length === 0}
          onClick={() => setIsCheckoutModalOpen(true)}
          className="w-full py-4 bg-[#FF5B37] text-white rounded-xl font-bold font-inter text-sm shadow-lg shadow-[#FF5B37]/20 hover:bg-[#e04a2a] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
        >
          Proses Pembayaran <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-112px)] lg:h-[calc(100vh-80px)] w-full relative">
      {/* KIRI: KATALOG MENU */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f4f7f6]">
        <div className="p-4 lg:p-6 shrink-0 space-y-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Cari menu apa hari ini?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border-transparent focus:border-[#FF5B37]/30 pl-11 pr-4 py-3.5 rounded-2xl shadow-sm font-jakarta text-sm transition-all outline-none focus:ring-4 focus:ring-[#FF5B37]/10 text-zinc-800"
            />
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            <button
              onClick={() => setActiveCategory("Semua")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeCategory === "Semua" ? "bg-zinc-800 text-white border-zinc-800 shadow-md" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"}`}
            >
              Semua Menu
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeCategory === cat.name ? "bg-zinc-800 text-white border-zinc-800 shadow-md" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-24 lg:pb-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-zinc-400 font-jakarta animate-pulse">
              Menyiapkan menu...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-400 font-jakarta">
              Tidak ada menu yang sesuai.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const startingPrice =
                  product.product_variants.length > 0
                    ? Math.min(...product.product_variants.map((v) => v.price))
                    : 0;

                // Cek total stok untuk label HABIS
                const totalStock = product.product_variants.reduce(
                  (sum, v) => sum + v.stock,
                  0,
                );
                const isOutOfStock = totalStock <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className={`bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm transition-all flex flex-col relative overflow-hidden
                      ${isOutOfStock ? "opacity-60 grayscale cursor-not-allowed" : "hover:shadow-md hover:border-[#FF5B37]/30 cursor-pointer group active:scale-[0.98]"}
                    `}
                  >
                    {/* Label HABIS */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <span className="bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-xs font-black tracking-widest shadow-lg -rotate-12">
                          HABIS
                        </span>
                      </div>
                    )}

                    <div className="aspect-square bg-zinc-50 rounded-xl overflow-hidden mb-3 relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                          <ShoppingBag size={32} />
                        </div>
                      )}
                      {product.product_variants.length > 1 && !isOutOfStock && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-md">
                          {product.product_variants.length} Varian
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 relative z-0">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 truncate">
                        {product.categories?.name}
                      </p>
                      <h3 className="text-sm font-bold text-zinc-800 font-inter leading-tight mb-2 line-clamp-2 flex-1">
                        {product.name}
                      </h3>
                      <p className="text-[#FF5B37] font-bold font-inter text-sm">
                        {product.product_variants.length > 1 ? "Mulai " : ""}Rp{" "}
                        {startingPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* KANAN: KERANJANG (Statis) */}
      <div className="hidden lg:block w-[380px] shrink-0 border-l border-zinc-200 bg-white h-full z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
        <CartContent />
      </div>

      {/* FAB KERANJANG */}
      <button
        onClick={() => setIsMobileCartOpen(true)}
        className="lg:hidden fixed bottom-24 right-4 z-40 bg-[#FF5B37] text-white p-4 rounded-2xl shadow-xl shadow-[#FF5B37]/30 flex items-center justify-center animate-in zoom-in active:scale-95 transition-transform"
      >
        <div className="relative">
          <ShoppingBag size={24} />
          {cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-[#FF5B37] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-[#FF5B37]">
              {cartItemsCount}
            </span>
          )}
        </div>
      </button>

      {/* MODAL LACI KERANJANG */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-[80] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileCartOpen(false)}
          ></div>
          <div className="relative bg-white w-full h-[85vh] rounded-t-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300">
            <CartContent onClose={() => setIsMobileCartOpen(false)} />
          </div>
        </div>
      )}

      {/* MODAL PILIH VARIAN (Dengan Pengecekan Varian Habis) */}
      {isVariantModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 font-inter">
                  {selectedProduct.name}
                </h3>
                <p className="text-sm text-zinc-500 font-jakarta mt-1">
                  Pilih varian yang diinginkan
                </p>
              </div>
              <button
                onClick={() => setIsVariantModalOpen(false)}
                className="text-zinc-400 bg-zinc-100 p-1.5 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {selectedProduct.product_variants.map((variant) => {
                const isVarEmpty = variant.stock <= 0;
                return (
                  <button
                    key={variant.id}
                    disabled={isVarEmpty}
                    onClick={() => addToCart(selectedProduct, variant)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group text-left
                      ${
                        isVarEmpty
                          ? "border-zinc-100 bg-zinc-50 opacity-60 cursor-not-allowed"
                          : "border-zinc-100 hover:border-[#FF5B37] hover:bg-[#FF5B37]/5"
                      }
                    `}
                  >
                    <div>
                      <span
                        className={`font-bold font-inter block ${isVarEmpty ? "text-zinc-500" : "text-zinc-800 group-hover:text-[#FF5B37]"}`}
                      >
                        {variant.name}
                      </span>
                      {isVarEmpty ? (
                        <span className="text-[10px] text-red-500 font-bold font-jakarta mt-0.5 block">
                          Stok Habis
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-medium font-jakarta mt-0.5 block">
                          Sisa {variant.stock} pcs
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-bold ${isVarEmpty ? "text-zinc-400" : "text-zinc-500 group-hover:text-[#FF5B37]"}`}
                    >
                      Rp {variant.price.toLocaleString("id-ID")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT PEMBAYARAN */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-200">
            {!checkoutSuccess ? (
              <>
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                  <h3 className="text-lg font-black text-zinc-900 font-inter flex items-center gap-2">
                    <Wallet className="text-[#FF5B37]" size={20} /> Penyelesaian
                  </h3>
                  <button
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="text-zinc-400 hover:text-zinc-800"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6 bg-white">
                  <div className="text-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
                      Total Tagihan
                    </p>
                    <p className="text-3xl font-black text-zinc-900 font-inter">
                      Rp {cartTotal.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-bold text-zinc-800 font-inter">
                      Metode Pembayaran
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod("TUNAI")}
                        className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${paymentMethod === "TUNAI" ? "border-[#FF5B37] bg-[#FF5B37]/5 text-[#FF5B37]" : "border-zinc-100 text-zinc-500"}`}
                      >
                        <Banknote size={28} className="mb-2" />
                        <span className="font-bold text-sm">Tunai</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("QRIS")}
                        className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${paymentMethod === "QRIS" ? "border-blue-500 bg-blue-50 text-blue-600" : "border-zinc-100 text-zinc-500"}`}
                      >
                        <QrCode size={28} className="mb-2" />
                        <span className="font-bold text-sm">QRIS</span>
                      </button>
                    </div>
                  </div>

                  {paymentMethod === "TUNAI" && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <p className="text-sm font-bold text-zinc-800 font-inter">
                        Uang Diterima
                      </p>
                      <input
                        type="number"
                        value={amountPaid}
                        onChange={(e) =>
                          setAmountPaid(Number(e.target.value) || "")
                        }
                        placeholder="Contoh: 50000"
                        className="w-full text-lg font-bold font-inter px-5 py-4 rounded-2xl border-2 border-zinc-200 focus:border-[#FF5B37] outline-none"
                      />
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                          onClick={() => setAmountPaid(cartTotal)}
                          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold whitespace-nowrap border border-zinc-200"
                        >
                          Uang Pas
                        </button>
                        <button
                          onClick={() => setAmountPaid(20000)}
                          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold whitespace-nowrap border border-zinc-200"
                        >
                          20K
                        </button>
                        <button
                          onClick={() => setAmountPaid(50000)}
                          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold whitespace-nowrap border border-zinc-200"
                        >
                          50K
                        </button>
                        <button
                          onClick={() => setAmountPaid(100000)}
                          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold whitespace-nowrap border border-zinc-200"
                        >
                          100K
                        </button>
                      </div>

                      {typeof amountPaid === "number" &&
                        amountPaid >= cartTotal && (
                          <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100 mt-2 text-emerald-700">
                            <span className="text-sm font-bold font-inter">
                              Kembalian:
                            </span>
                            <span className="text-lg font-black font-inter">
                              Rp {changeAmount.toLocaleString("id-ID")}
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-zinc-100 bg-white">
                  <button
                    disabled={isProcessing}
                    onClick={handleCheckout}
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold font-inter text-sm shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isProcessing ? "Memproses..." : "Konfirmasi Pembayaran"}
                  </button>
                </div>
              </>
            ) : (
              <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500">
                  <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 font-inter mb-1">
                    Transaksi Berhasil!
                  </h3>
                  <p className="text-zinc-500 font-jakarta text-sm">
                    Kembalian:{" "}
                    <span className="font-bold text-zinc-800">
                      Rp {changeAmount.toLocaleString("id-ID")}
                    </span>
                  </p>
                </div>
                <div className="pt-6 w-full">
                  <button
                    onClick={closeCheckoutAndReset}
                    className="w-full py-3.5 bg-zinc-100 text-zinc-800 rounded-xl font-bold font-inter text-sm hover:bg-zinc-200 transition-all active:scale-95"
                  >
                    Tutup & Transaksi Baru
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
