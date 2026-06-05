import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function requireAdmin(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await supabaseAdmin
    .from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

export async function PUT(req, { params }) {
  const admin = await requireAdmin(req);
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const allowed = [
    "shein_view_orders", "shein_change_status", "shein_delete_orders",
    "shein_set_shipping", "shein_edit_exchange_rate",
    "store_view_orders", "store_manage_products", "store_view_customers",
  ];
  const permissions = {};
  for (const key of allowed) {
    if (key in body) permissions[key] = body[key];
  }

  const { error } = await supabaseAdmin
    .from("employee_permissions")
    .upsert({ user_id: id, ...permissions });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}

export async function DELETE(req, { params }) {
  const admin = await requireAdmin(req);
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await supabaseAdmin.from("profiles").update({ role: "customer" }).eq("id", id);
  await supabaseAdmin.from("employee_permissions").delete().eq("user_id", id);

  return Response.json({ success: true });
}
