import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Menginisialisasi Supabase dengan Service Role Key khusus untuk backend
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // 1. Buat user di sistem Autentikasi (auth.users)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) throw authError;

    // 2. Tambahkan data profilnya ke tabel profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: authData.user.id,
          name,
          role: "kasir",
        },
      ]);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    // Menghapus dari auth.users otomatis akan menghapus data di tabel profiles
    // karena sebelumnya kita membuat relasi menggunakan ON DELETE CASCADE
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
