import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    // Menggunakan Service Role Key (Hak Akses Dewa) untuk menembus auth.users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Ini akan menghapus dari auth.users (dan otomatis menghapus tabel profiles jika Anda pakai cascade)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Kasir dihapus permanen",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
