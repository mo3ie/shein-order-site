import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { cookies } from "next/headers";

export async function POST(req) {
  const { token } = await req.json();

  if (!token) {
    return Response.json({ error: "No token" }, { status: 401 });
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  const { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("role, name")
    .eq("email", user.email)
    .single();

  if (!adminUser) {
    return Response.json({ error: "Not an admin" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_role", adminUser.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return Response.json({ role: adminUser.role, name: adminUser.name });
}
