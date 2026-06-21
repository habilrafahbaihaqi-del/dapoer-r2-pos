import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // 1. Inisialisasi Supabase menggunakan Service Role Key (Akses Bypass RLS)
    // Ingat: Jangan pernah menaruh key ini di sisi klien (frontend)!
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 2. Buat akun kredensial login di tabel auth.users Supabase
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Langsung aktif tanpa perlu verifikasi email
      });

    if (authError) throw authError;

    const userId = authData.user.id;

    // 3. Masukkan data ke tabel profiles menggunakan ID asli dari Auth
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: userId,
          name: name,
          role: "kasir",
          email: email,
        },
      ]);

    // Jika gagal membuat profil, batalkan (hapus) akun auth yang baru dibuat agar tidak ada data yatim piatu
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    return NextResponse.json(
      { success: true, message: "Akun kasir berhasil dibuat" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Gagal membuat kasir di backend:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
