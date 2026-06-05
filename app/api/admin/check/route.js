import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { cookies } from "next/headers";

export async function POST(req) {
  const { token } = await req.json();
  if (!token) return Response.json({ error: "No token" }, { status: 401 });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return Response.json({ error: "Invalid token" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "employee")) {
    return Response.json({ error: "Not authorized" }, { status: 403 });
  }

  let permissions = null;
  if (profile.role === "employee") {
    const { data: perms } = await supabaseAdmin
      .from("employee_permissions")
      .select("*")
      .eq("user_id", user.id)
      .single();
    permissions = perms;
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_role", profile.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return Response.json({ role: profile.role, name: profile.full_name, permissions });
}
