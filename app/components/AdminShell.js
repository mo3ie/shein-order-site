"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useTheme } from "@/lib/theme";
import { Icon, I, PRIMARY, INK, MUTED, FAINT, LINE, CARD, CHIP, SOLID, ON_SOLID, PAGE } from "@/app/components/ui";

/**
 * إطار لوحة الإدارة.
 *
 * كانت اللوحة سوداء ثابتة (#080810) لا تتبع ثيم الموقع ولا مفرداته، وكل صفحة
 * فيها تكتب ترويستها وأزرارها من جديد. هذا الإطار يوحّدها: شريط علوي واحد
 * بروابط الأقسام، مبدّل مظهر، وخروج — والصفحة تضع محتواها فقط.
 *
 * الأقسام تُخفى بحسب الدور: الموظف لا يرى ما لا يملك صلاحيته.
 */
const SECTIONS = [
  { key: "orders",    href: "/admin",            label: "الطلبات",    icon: I.cart },
  { key: "completed", href: "/admin/completed",  label: "المنجزة",    icon: I.check },
  { key: "trash",     href: "/admin/trash",      label: "المحذوفات",  icon: I.trash },
  { key: "employees", href: "/admin/employees",  label: "الموظفون",   icon: I.users, adminOnly: true },
  { key: "price",     href: "/admin/price-test", label: "اختبار السعر", icon: I.search, adminOnly: true },
];

export function useAdminGuard() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/admin/login"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role, full_name").eq("id", data.user.id).single();
      if (!profile || (profile.role !== "admin" && profile.role !== "employee")) {
        router.push("/admin/login"); return;
      }
      setRole(profile.role);
      if (profile.role === "employee") {
        const { data: perms } = await supabase
          .from("employee_permissions").select("*").eq("user_id", data.user.id).single();
        setPermissions(perms);
      }
      setChecking(false);
    })();
  }, [router]);

  /** صلاحية: المدير يملك كل شيء، والموظف ما مُنح له. */
  const can = (key) => role === "admin" || (permissions && permissions[key] === true);
  return { role, permissions, can, checking };
}

export default function AdminShell({ role, title, subtitle, actions, children, width = 1400 }) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolved, toggle } = useTheme();

  const logout = async () => { await supabase.auth.signOut(); router.push("/admin/login"); };
  const visible = SECTIONS.filter((s) => !s.adminOnly || role === "admin");

  return (
    <main style={{ minHeight: "100vh", background: PAGE, color: INK, direction: "rtl" }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        .adm-card { animation: fadeIn .28s ease both; }
        .adm-nav a:hover { color: ${PRIMARY}; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: ${PRIMARY}; box-shadow: 0 0 0 3px rgba(124,58,237,.12); }
      `}</style>

      <header style={{
        background: CARD, borderBottom: `1px solid ${LINE}`, padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
          <a href="/admin" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: INK }}>
            <span style={{ width: 34, height: 34, borderRadius: 11, background: "linear-gradient(150deg,#7c3aed,#3b82f6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15 }}>T</span>
            <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: "-0.3px" }}>
              إدارة <span style={{ color: PRIMARY }}>ترند</span>
            </span>
          </a>

          <nav className="adm-nav" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {visible.map((s) => {
              const on = pathname === s.href;
              return (
                <a key={s.key} href={s.href} style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 11,
                  textDecoration: "none", fontSize: 13.5, fontWeight: on ? 800 : 600,
                  color: on ? PRIMARY : MUTED, background: on ? CHIP : "transparent",
                  transition: "background .15s, color .15s",
                }}>
                  <Icon path={s.icon} size={16} />
                  {s.label}
                </a>
              );
            })}
          </nav>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {role && (
            <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, background: CHIP, borderRadius: 20, padding: "5px 12px" }}>
              {role === "admin" ? "مدير" : "موظف"}
            </span>
          )}
          <button onClick={toggle} aria-label="المظهر" style={{
            width: 34, height: 34, borderRadius: "50%", border: `1px solid ${LINE}`, background: "none",
            color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {resolved === "dark"
              ? <Icon path={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></>} size={15} stroke={2} />
              : <Icon path={<path d="M21 12.8A8.5 8.5 0 1111.2 3a6.6 6.6 0 009.8 9.8z" />} size={15} stroke={2} />}
          </button>
          <button onClick={logout} style={{
            padding: "8px 14px", borderRadius: 11, border: `1px solid ${LINE}`, background: "none",
            color: MUTED, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
          }}>
            خروج
          </button>
        </div>
      </header>

      <div style={{ padding: "24px 28px 60px", maxWidth: width, margin: "0 auto" }}>
        {(title || actions) && (
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <div>
              {title && <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.6px", margin: 0 }}>{title}</h1>}
              {subtitle && <p style={{ fontSize: 13.5, color: MUTED, margin: "5px 0 0" }}>{subtitle}</p>}
            </div>
            {actions}
          </div>
        )}
        {children}
      </div>
    </main>
  );
}

/** بطاقة رقم في الأعلى: عدد أو مبلغ مع أيقونته. */
export function StatCard({ icon, label, value, unit, tone = PRIMARY, onClick, active }) {
  return (
    <div onClick={onClick} className="adm-card" style={{
      background: CARD, borderRadius: 16, padding: "15px 16px", boxShadow: "0 2px 10px rgba(22,19,31,0.05)",
      border: active ? `1.5px solid ${tone}` : "1.5px solid transparent",
      cursor: onClick ? "pointer" : "default", display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ width: 40, height: 40, borderRadius: 13, background: CHIP, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon path={icon} size={19} color={tone} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.5px" }}>
          {value}{unit ? <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }}> {unit}</span> : null}
        </div>
        <div style={{ fontSize: 12.5, color: FAINT, marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

export { PRIMARY, INK, MUTED, FAINT, LINE, CARD, CHIP, SOLID, ON_SOLID, PAGE };
