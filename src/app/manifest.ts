import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dapoer R2 POS",
    short_name: "Dapoer R2",
    description: "Sistem Aplikasi POS Kasir Dapoer R2",
    start_url: "/login", // Pintu masuk pertama saat aplikasi dibuka dari HP
    display: "standalone", // Membuat aplikasi tampil penuh tanpa bar browser alamat url
    background_color: "#f4f7f6",
    theme_color: "#FF5B37", // Warna tema oranye khas Dapoer R2 pada status bar HP
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
