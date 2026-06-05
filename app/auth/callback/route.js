import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin/login";

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=no_code`);
  }

  // Exchange code for session using anon client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/admin/login?error=exchange_failed`);
  }

  // Check if user is admin or employee
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "employee")) {
    return NextResponse.redirect(`${origin}/admin/login?error=not_authorized`);
  }

  // Set admin_role cookie so middleware allows access
  const cookieStore = await cookies();
  cookieStore.set("admin_role", profile.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  // Set Supabase session cookies
  const { access_token, refresh_token } = data.session;
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.match(/\/\/([^.]+)\./)?.[1];
  if (projectRef) {
    const sessionVal = JSON.stringify({ access_token, refresh_token, token_type: "bearer" });
    cookieStore.set(`sb-${projectRef}-auth-token`, sessionVal, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  }

  return NextResponse.redirect(`${origin}/admin`);
}
