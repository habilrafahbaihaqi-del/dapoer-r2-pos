"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { recordAuditLog } from "@/utils/supabase/audit";

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  categories: { name: string };
  product_variants: Variant[];
}

interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  originalStock: number; // Disimpan untuk kebutuhan potong stok
}

export default function TransaksiKasirPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // State Keranjang & UI
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // State Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Tunai" | "QRIS">("Tunai");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select(`
        id,
        name,
        categories ( name ),
        product_variants ( id, name, price, stock )
      `);

    if (data) {
      const validProducts = data.filter(
        (p: any) => p.product_variants && p.product_variants.length > 0,
      );
      setProducts(validProducts as unknown as Product[]);
    }
    setLoading(false);
  };

  const openVariantModal = (product: Product) => {
    setSelectedProduct(product);
  };

  const addToCart = (variant: Variant) => {
    if (variant.stock <= 0) {
      alert("Stok habis!");
      return;
    }

    setCart((prev) => {
      const existingItem = prev.find((item) => item.variantId === variant.id);
      if (existingItem) {
        if (existingItem.quantity >= variant.stock) {
          alert("Maksimal stok tercapai!");
          return prev;
        }
        return prev.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        return [
          ...prev,
          {
            variantId: variant.id,
            productId: selectedProduct!.id,
            productName: selectedProduct!.name,
            variantName: variant.name,
            price: variant.price,
            quantity: 1,
            originalStock: variant.stock,
          },
        ];
      }
    });
    setSelectedProduct(null);
  };

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  // FUNGSI UTAMA: Memproses Transaksi ke Database
  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // 1. Dapatkan ID Kasir yang sedang login
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user)
        throw new Error("Gagal mengidentifikasi kasir.");
      const cashierId = userData.user.id;

      // 2. Buat Nomor Invoice Unik (Format: INV-YYYYMMDD-NOMOR)
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${dateStr}-${randomNum}`;

      // 3. Simpan ke tabel transactions
      const { data: trxData, error: trxError } = await supabase
        .from("transactions")
        .insert([
          {
            invoice_number: invoiceNumber,
            cashier_id: cashierId,
            total: totalPrice,
            payment_method: paymentMethod,
          },
        ])
        .select()
        .single();

      if (trxError) throw trxError;

      // 4. Simpan ke tabel transaction_items & Potong Stok secara berurutan
      for (const item of cart) {
        // Simpan item transaksi
        const { error: itemError } = await supabase
          .from("transaction_items")
          .insert([
            {
              transaction_id: trxData.id,
              variant_id: item.variantId,
              quantity: item.quantity,
              price: item.price,
            },
          ]);
        if (itemError) throw itemError;

        // Potong stok (Stok Lama - Jumlah Dibeli)
        const newStock = item.originalStock - item.quantity;
        const { error: stockError } = await supabase
          .from("product_variants")
          .update({ stock: newStock })
          .eq("id", item.variantId);
        if (stockError) throw stockError;
      }

      // 5. Bersihkan keranjang dan berikan notifikasi sukses
      alert(`Transaksi Berhasil!\nInvoice: ${invoiceNumber}`);
      setCart([]);
      setIsCheckoutOpen(false);

      await recordAuditLog(
        "Transaksi Baru",
        `Kasir memproses pembayaran ${paymentMethod} senilai Rp ${totalPrice.toLocaleString("id-ID")} dengan nomor invoice ${invoiceNumber}`,
      );

      fetchProducts(); // Refresh katalog agar sisa stok terbaru muncul
    } catch (error: any) {
      alert("Terjadi kesalahan saat checkout: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="mb-4">
        <h1 className="text-2xl font-bold font-inter text-zinc-900">
          Transaksi
        </h1>
        <p className="text-sm text-zinc-500 font-jakarta mt-1">
          Pilih produk untuk ditambahkan ke keranjang.
        </p>
      </div>

      {/* Grid Produk */}
      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <p className="text-center text-zinc-500 mt-10 font-jakarta text-sm">
            Memuat katalog produk...
          </p>
        ) : products.length === 0 ? (
          <p className="text-center text-zinc-500 mt-10 font-jakarta text-sm">
            Belum ada produk yang siap dijual.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => openVariantModal(product)}
                className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm hover:border-zinc-800 transition-colors text-left flex flex-col h-full active:scale-[0.98]"
              >
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block font-jakarta">
                    {(product.categories as any)?.name}
                  </span>
                  <h3 className="font-bold text-zinc-900 font-inter leading-tight text-sm">
                    {product.name}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Pilih Varian */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold font-inter text-zinc-900">
                Varian {selectedProduct.name}
              </h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-zinc-400 font-bold text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {selectedProduct.product_variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => addToCart(variant)}
                  disabled={variant.stock <= 0}
                  className="w-full flex justify-between items-center p-3.5 rounded-xl border border-zinc-200 hover:border-zinc-800 transition-colors disabled:opacity-50 text-left"
                >
                  <div>
                    <p className="font-bold text-zinc-900 font-inter text-sm">
                      {variant.name}
                    </p>
                    <p
                      className={`text-xs font-semibold mt-1 font-jakarta ${variant.stock > 5 ? "text-green-600" : "text-red-500"}`}
                    >
                      Sisa Stok: {variant.stock}
                    </p>
                  </div>
                  <p className="font-bold text-zinc-900 font-jakarta text-sm">
                    Rp {variant.price.toLocaleString("id-ID")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-16 sm:bottom-4 left-0 right-0 p-4 z-40">
          <div className="max-w-md mx-auto bg-zinc-900 rounded-2xl shadow-xl p-4 flex items-center justify-between border border-zinc-800">
            <div>
              <p className="text-[11px] text-zinc-400 font-jakarta uppercase tracking-wider font-semibold mb-0.5">
                {totalItems} Item Terpilih
              </p>
              <p className="text-lg font-bold text-white font-inter leading-none">
                Rp {totalPrice.toLocaleString("id-ID")}
              </p>
            </div>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-white text-zinc-900 px-5 py-2.5 rounded-xl font-bold text-sm active:scale-[0.95]"
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* Layar Checkout (Tampil Penuh) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-right-8">
          <div className="h-14 border-b border-zinc-200 flex items-center px-4 bg-white sticky top-0">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="text-sm font-bold text-zinc-500 mr-4"
            >
              ← Kembali
            </button>
            <h2 className="text-lg font-bold font-inter text-zinc-900">
              Ringkasan Pesanan
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-32">
            {/* Daftar Item */}
            <div className="space-y-4 mb-8">
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center border-b border-zinc-100 pb-4"
                >
                  <div>
                    <h4 className="font-bold text-zinc-900 font-inter text-sm">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-zinc-500 font-jakarta">
                      {item.variantName} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-zinc-900 font-jakarta text-sm">
                    Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>

            {/* Metode Pembayaran */}
            <h3 className="font-bold text-zinc-900 font-inter mb-3">
              Metode Pembayaran
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button
                onClick={() => setPaymentMethod("Tunai")}
                className={`py-3 rounded-xl border font-bold text-sm font-jakarta transition-colors ${
                  paymentMethod === "Tunai"
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                    : "border-zinc-200 bg-white text-zinc-600"
                }`}
              >
                Tunai
              </button>
              <button
                onClick={() => setPaymentMethod("QRIS")}
                className={`py-3 rounded-xl border font-bold text-sm font-jakarta transition-colors ${
                  paymentMethod === "QRIS"
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                    : "border-zinc-200 bg-white text-zinc-600"
                }`}
              >
                QRIS Display
              </button>
            </div>
          </div>

          {/* Area Bayar */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200">
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="text-sm font-semibold text-zinc-500 font-jakarta">
                Total Pembayaran
              </span>
              <span className="text-2xl font-bold text-zinc-900 font-inter">
                Rp {totalPrice.toLocaleString("id-ID")}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold text-lg active:scale-[0.98] transition-transform shadow-md disabled:opacity-70"
            >
              {isProcessing ? "Memproses..." : `Bayar ${paymentMethod}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
