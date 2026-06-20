import { createClient } from "./client";

export const recordAuditLog = async (action: string, description: string) => {
  const supabase = createClient();
  try {
    // Dapatkan siapa user yang sedang melakukan aksi ini
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Catat aksinya ke database
    await supabase.from("audit_logs").insert([
      {
        user_id: userData.user.id,
        action: action,
        description: description,
      },
    ]);
  } catch (error) {
    console.error("Gagal mencatat audit log:", error);
  }
};
