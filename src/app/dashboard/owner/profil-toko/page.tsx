"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Store, MapPin, Phone, Save, Building2, FileText } from "lucide-react";

export default function ProfilTokoPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State untuk data toko
  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  const fetchStoreSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setStoreId(data.id);
        setStoreName(data.store_name || "");
        setAddress(data.address || "");
        setPhone(data.phone || "");
      }
    } catch (error) {
      console.error("Gagal memuat profil toko:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert("Nama toko tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("store_settings")
        .update({
          store_name: storeName,
          address: address,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", storeId);

      if (error) throw error;
      alert("Profil toko berhasil diperbarui!");
    } catch (error: any) {
      alert(`Gagal memperbarui profil toko: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header Section */}
      <div className="space-y-2 px-2">
        <h1 className="text-3xl font-bold font-inter text-zinc-900 tracking-tight">
          Profil Toko
        </h1>
        <p className="text-zinc-500 font-jakarta text-sm lg:text-base max-w-2xl">
          Atur identitas resmi bisnis Anda. Informasi ini akan dicetak pada
          setiap struk transaksi pelanggan dan dapat dilihat secara langsung
          pada panel pratinjau.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
          <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-zinc-200"></div>
          <div className="h-96 bg-white rounded-2xl border border-zinc-200"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* KOLOM KIRI: FORMULIR ISIAN DATA UTLET (Mengambil rasi 2/3 space) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 lg:p-8 space-y-8">
              <div className="flex items-center gap-3 text-[#FF5B37]">
                <Building2 size={24} strokeWidth={2.5} />
                <h2 className="text-lg font-bold font-inter text-zinc-800">
                  Informasi Outlet
                </h2>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Nama Toko */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest font-inter">
                    <Store size={14} /> Nama Toko / Brand
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Masukkan nama toko"
                    className="w-full rounded-xl border-2 border-zinc-200 px-5 py-3.5 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-base font-bold"
                    required
                  />
                </div>

                {/* Alamat Lengkap */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest font-inter">
                    <MapPin size={14} /> Alamat Lengkap
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Masukkan alamat lengkap outlet..."
                    rows={3}
                    className="w-full rounded-xl border-2 border-zinc-200 px-5 py-3.5 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-sm lg:text-base resize-none"
                  ></textarea>
                </div>

                {/* Nomor Telepon */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest font-inter">
                    <Phone size={14} /> Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-xl border-2 border-zinc-200 px-5 py-3 text-zinc-900 focus:border-[#FF5B37] focus:outline-none focus:ring-4 focus:ring-[#FF5B37]/10 transition-all font-jakarta text-sm lg:text-base"
                  />
                </div>

                {/* Banner Alur Sistem */}
                <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 mt-6">
                  <p className="text-sm text-zinc-500 font-jakarta leading-relaxed">
                    Perubahan pada profil toko akan langsung berlaku untuk
                    transaksi kasir yang terjadi setelah pembaruan ini disimpan.
                  </p>
                </div>

                {/* Tombol Aksi Simpan */}
                <div className="flex justify-end pt-4 border-t border-zinc-100">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#FF5B37] text-white font-bold rounded-xl hover:bg-[#e04a2a] transition-all shadow-lg shadow-[#FF5B37]/20 flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-70"
                  >
                    <Save size={18} />
                    {isSaving ? "Menyimpan Perubahan..." : "Simpan Profil Toko"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* KOLOM KANAN: LIVE REVIEW PANEL STRUK PRINTER THERMAL (Mengambil rasi 1/3 space) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <FileText size={18} className="text-[#FF5B37]" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-inter">
                Pratinjau Kertas Nota
              </h2>
            </div>

            {/* Wadah Desain Struk Printer Kasir */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-md p-6 relative overflow-hidden font-mono text-zinc-700 text-xs">
              {/* Ornamen Garis Potongan Kertas Gergaji Atas */}
              <div className="absolute top-0 inset-x-0 h-1 bg-[linear-gradient(45deg,transparent_33.333%,#f4f7f6_33.333%,#f4f7f6_66.667%,transparent_66.667%),linear-gradient(-45deg,transparent_33.333%,#f4f7f6_33.333%,#f4f7f6_66.667%,transparent_66.667%)] bg-[size:8px_8px]" />

              <div className="space-y-4 pt-2">
                {/* KOP NOTA STRUK: TERHUBUNG LANGSUNG SECARA DINAMIS */}
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold text-zinc-900 font-inter tracking-tight uppercase break-words px-1">
                    {storeName || "Nama Toko / Brand"}
                  </h3>
                  <p className="whitespace-pre-wrap break-words text-[10px] text-zinc-500 leading-tight px-2">
                    {address || "Alamat lengkap outlet belum diatur"}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Telp: {phone || "-"}
                  </p>
                </div>

                {/* Pembatas Pembayaran */}
                <div className="border-b border-dashed border-zinc-300 w-full my-2" />

                {/* Data Metadata Invoice Dummy */}
                <div className="space-y-0.5 text-zinc-400 text-[10px]">
                  <div className="flex justify-between">
                    <span>No. Nota :</span>
                    <span>INV-20260622-001</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal :</span>
                    <span>22 Jun 2026 12:15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir :</span>
                    <span>Habil Rafah</span>
                  </div>
                </div>

                {/* Pembatas Menu Belanja */}
                <div className="border-b border-dashed border-zinc-300 w-full my-2" />

                {/* Simulasi Transaksi Kasir */}
                <div className="space-y-2 text-[11px]">
                  <div className="space-y-0.5">
                    <div className="flex justify-between font-bold text-zinc-800">
                      <span>Thai Tea (Large)</span>
                      <span>15.000</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 text-[10px]">
                      <span>1 pcs x 15.000</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between font-bold text-zinc-800">
                      <span>Ayam Geprek (Pedas)</span>
                      <span>18.000</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 text-[10px]">
                      <span>1 pcs x 18.000</span>
                    </div>
                  </div>
                </div>

                {/* Pembatas Total Tagihan */}
                <div className="border-b border-dashed border-zinc-300 w-full my-2" />

                {/* Akumulasi Subtotal & Total */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal :</span>
                    <span>33.000</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Pajak (0%):</span>
                    <span>0</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-zinc-900 border-t border-zinc-100 pt-1 mt-1">
                    <span>TOTAL :</span>
                    <span>Rp 33.000</span>
                  </div>
                </div>

                {/* Pembatas Footer */}
                <div className="border-b border-dashed border-zinc-300 w-full my-2" />

                {/* Salam Terima Kasih Struk */}
                <div className="text-center space-y-0.5 pt-1 text-[10px]">
                  <p className="font-bold text-zinc-800 uppercase tracking-wider">
                    Terima Kasih
                  </p>
                  <p className="text-zinc-400">
                    Selamat Menikmati Hidangan Kami
                  </p>
                </div>
              </div>

              {/* Ornamen Garis Potongan Kertas Gergaji Bawah */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-[linear-gradient(45deg,transparent_33.333%,#f4f7f6_33.333%,#f4f7f6_66.667%,transparent_66.667%),linear-gradient(-45deg,transparent_33.333%,#f4f7f6_33.333%,#f4f7f6_66.667%,transparent_66.667%)] bg-[size:8px_8px] rotate-180" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
