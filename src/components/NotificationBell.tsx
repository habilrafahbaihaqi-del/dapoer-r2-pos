"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

interface AuditLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

export default function NotificationBell() {
  const supabase = createClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Ambil 5 riwayat log aktivitas terbaru saat komponen dimuat
    const fetchInitialLogs = async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("id, action, description, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setLogs(data);
    };

    fetchInitialLogs();

    // 2. Berlangganan (Subscribe) ke saluran realtime tabel audit_logs
    const channel = supabase
      .channel("realtime-audit-logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload) => {
          const newLog = payload.new as AuditLog;
          // Masukkan log baru ke urutan paling atas dan batasi maksimal 5 item di memori tampilan
          setLogs((prev) => [newLog, ...prev.slice(0, 4)]);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Menutup dropdown otomatis jika pengguna mengeklik di luar area komponen
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0); // Reset angka notifikasi ketika menu dibuka
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng Notifikasi */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors active:scale-95 flex items-center justify-center"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Konten Dropdown Ringkasan Log */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-zinc-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
            <h4 className="font-bold font-inter text-zinc-900 text-sm">
              Aktivitas Toko
            </h4>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold font-jakarta border border-emerald-100 animate-pulse">
              Realtime
            </span>
          </div>
          <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="p-4 text-center text-xs text-zinc-400 font-jakarta">
                Belum ada aktivitas.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 hover:bg-zinc-50 transition-colors text-left"
                >
                  <p className="text-xs font-bold text-zinc-900 font-inter">
                    {log.action}
                  </p>
                  <p className="text-[11px] text-zinc-600 font-jakarta mt-0.5 leading-relaxed">
                    {log.description}
                  </p>
                  <p className="text-[9px] text-zinc-400 font-jakarta mt-1.5">
                    {new Date(log.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
