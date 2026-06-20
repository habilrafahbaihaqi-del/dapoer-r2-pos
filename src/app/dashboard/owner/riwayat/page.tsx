"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Transaction {
  id: string;
  invoice_number: string;
  total: number;
  payment_method: string;
  created_at: string;
}

export default function RiwayatOwnerPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    // Mengambil seluruh transaksi dari semua kasir, urut dari yang terbaru
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setTransactions(data);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Fungsi Export ke Excel
  const exportToExcel = () => {
    if (transactions.length === 0)
      return alert("Tidak ada data untuk diekspor");

    // Format data agar lebih rapi di Excel
    const dataToExport = transactions.map((trx, index) => ({
      No: index + 1,
      Tanggal: formatDate(trx.created_at),
      "Nomor Invoice": trx.invoice_number,
      "Metode Pembayaran": trx.payment_method,
      "Total (Rp)": trx.total,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Transaksi");
    XLSX.writeFile(
      workbook,
      `Laporan_Penjualan_Dapoer_R2_${new Date().getTime()}.xlsx`,
    );
  };

  // Fungsi Export ke PDF
  const exportToPDF = () => {
    if (transactions.length === 0)
      return alert("Tidak ada data untuk diekspor");

    const doc = new jsPDF();
    doc.text("Laporan Penjualan Dapoer R2", 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${formatDate(new Date().toISOString())}`, 14, 22);

    const tableColumn = [
      "No",
      "Tanggal",
      "Nomor Invoice",
      "Metode",
      "Total (Rp)",
    ];
    const tableRows = transactions.map((trx, index) => [
      index + 1,
      formatDate(trx.created_at),
      trx.invoice_number,
      trx.payment_method,
      trx.total.toLocaleString("id-ID"),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
    });

    doc.save(`Laporan_Penjualan_Dapoer_R2_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-inter text-zinc-900">
            Riwayat & Laporan
          </h1>
          <p className="text-zinc-500 font-jakarta mt-2">
            Pantau seluruh riwayat transaksi dan unduh laporan penjualan.
          </p>
        </div>

        {/* Tombol Export */}
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-sm rounded-lg hover:bg-emerald-100 transition-colors font-jakarta flex items-center gap-2"
          >
            📊 Export Excel
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 font-bold text-sm rounded-lg hover:bg-red-100 transition-colors font-jakarta flex items-center gap-2"
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm">
                Tanggal
              </th>
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm">
                Nomor Invoice
              </th>
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm">
                Metode
              </th>
              <th className="px-6 py-4 font-semibold text-zinc-600 font-jakarta text-sm text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-zinc-500 font-jakarta"
                >
                  Memuat data riwayat...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-zinc-500 font-jakarta"
                >
                  Belum ada transaksi yang tercatat di sistem.
                </td>
              </tr>
            ) : (
              transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-zinc-600 font-jakarta text-sm">
                    {formatDate(trx.created_at)}
                  </td>
                  <td className="px-6 py-4 text-zinc-800 font-jakarta font-medium">
                    {trx.invoice_number}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider font-jakarta ${
                        trx.payment_method === "QRIS"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {trx.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-900 font-inter font-bold text-right">
                    Rp {trx.total.toLocaleString("id-ID")}
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
