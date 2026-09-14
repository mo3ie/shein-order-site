"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import AdminShell, { useAdminGuard, StatCard } from "@/app/components/AdminShell";
import { Card, SectionTitle, Field, Button, Icon, I, inputStyle, PRIMARY, INK, MUTED, FAINT, LINE, CHIP, CARD } from "@/app/components/ui";

const PERMISSION_LABELS = {
  shein_view_orders: "عرض طلبات شي إن",
  shein_change_status: "تغيير حالة الطلب",
  shein_delete_orders: "حذف الطلبات",
  shein_set_shipping: "تحديد سعر الشحن",
  shein_edit_exchange_rate: "تعديل سعر الدولار",
  store_view_orders: "عرض طلبات المتجر",
  store_manage_products: "إدارة المنتجات",
  store_view_customers: "عرض العملاء",
};

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", password: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState({});

  const fetchEmployees = useCallback(async (t) => {
    setLoading(true);
    const res = await fetch("/api/admin/employees", {
      headers: { Authorization: `Bearer ${t}` },
    });
    const result = await res.json();
    setEmployees(result.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.push("/admin/login"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", data.session.user.id).single();

      if (profile?.role !== "admin") { router.push("/admin"); return; }

      setToken(data.session.access_token);
      fetchEmployees(data.session.access_token);
    };
    init();
  }, [router, fetchEmployees]);

  async function createEmployee() {
    setFormError("");
    if (!form.email || !form.full_name || !form.password) {
      setFormError("جميع الحقول مطلوبة");
      return;
    }
    setFormLoading(true);
    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    setFormLoading(false);
    if (!res.ok) { setFormError(result.error || "حدث خطأ"); return; }
    setShowModal(false);
    setForm({ email: "", full_name: "", password: "" });
    fetchEmployees(token);
  }

  async function updatePermission(employeeId, key, value) {
    setSaving(s => ({ ...s, [employeeId]: true }));
    const current = employees.find(e => e.id === employeeId)?.permissions || {};
    await fetch(`/api/admin/employees/${employeeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...current, [key]: value }),
    });
    setEmployees(prev => prev.map(e =>
      e.id === employeeId
        ? { ...e, permissions: { ...(e.permissions || {}), [key]: value } }
        : e
    ));
    setSaving(s => ({ ...s, [employeeId]: false }));
  }

  async function removeEmployee(id) {
    if (!confirm("هل تريد إزالة هذا الموظف؟")) return;
    await fetch(`/api/admin/employees/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setEmployees(prev => prev.filter(e => e.id !== id));
  }

  if (loading) return (
    <AdminShell role="admin" title="الموظفون">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "80px 0" }}>
        <span style={{ width: 42, height: 42, borderRadius: "50%", border: `3px solid ${LINE}`, borderTopColor: PRIMARY, animation: "spin .8s linear infinite" }} />
        <p style={{ color: FAINT, fontSize: 14, fontWeight: 600 }}>جاري التحميل...</p>
      </div>
    </AdminShell>
  );

  const GROUPS = [
    { title: "طلبات شي إن", icon: I.cart, keys: ["shein_view_orders", "shein_change_status", "shein_delete_orders", "shein_set_shipping", "shein_edit_exchange_rate"] },
    { title: "المتجر", icon: I.box, keys: ["store_view_orders", "store_manage_products", "store_view_customers"] },
  ];

  return (
    <AdminShell
      role="admin"
      title="الموظفون"
      subtitle="من يدخل اللوحة، وماذا يُسمح له أن يفعل فيها."
      actions={
        <Button onClick={() => setShowModal(true)} icon={I.plus} style={{ width: "auto", padding: "12px 20px", fontSize: 14 }}>
          موظف جديد
        </Button>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard icon={I.users} label="عدد الموظفين" value={employees.length} />
        <StatCard icon={I.shield} label="صلاحيات ممنوحة" tone="var(--t-green-ink)"
          value={employees.reduce((n, e) => n + Object.values(e.permissions || {}).filter(Boolean).length, 0)} />
      </div>

      {employees.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "56px 20px" }}>
          <span style={{ width: 54, height: 54, borderRadius: 18, background: CHIP, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon path={I.users} size={24} color={PRIMARY} />
          </span>
          <p style={{ fontWeight: 800, fontSize: 16 }}>لا موظفين بعد</p>
          <p style={{ fontSize: 13.5, color: FAINT, margin: "6px 0 20px" }}>أضف موظفًا وامنحه ما يحتاجه من صلاحيات فقط.</p>
          <Button onClick={() => setShowModal(true)} icon={I.plus} style={{ width: "auto", margin: "0 auto", padding: "13px 24px" }}>
            موظف جديد
          </Button>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(420px,1fr))", gap: 16 }}>
          {employees.map((emp) => (
            <Card key={emp.id} className="adm-card" pad={18}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ width: 44, height: 44, borderRadius: 15, background: "linear-gradient(150deg,#7c3aed,#3b82f6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 900, flexShrink: 0 }}>
                  {(emp.full_name || emp.email || "؟")[0].toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800 }}>{emp.full_name || "بلا اسم"}</div>
                  <div style={{ fontSize: 12.5, color: FAINT, direction: "ltr", textAlign: "start", overflow: "hidden", textOverflow: "ellipsis" }}>{emp.email}</div>
                </div>
                {saving[emp.id] && (
                  <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${LINE}`, borderTopColor: PRIMARY, animation: "spin .8s linear infinite" }} />
                )}
                <button onClick={() => removeEmployee(emp.id)} title="إزالة الموظف"
                  style={{ background: "var(--t-red-bg)", border: "none", borderRadius: 11, padding: "9px 11px", cursor: "pointer", color: "var(--t-red-ink)", display: "flex" }}>
                  <Icon path={I.trash} size={16} />
                </button>
              </div>

              {GROUPS.map((g) => (
                <div key={g.title} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                    <Icon path={g.icon} size={15} color={PRIMARY} />
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: MUTED }}>{g.title}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {g.keys.map((key) => {
                      const on = !!emp.permissions?.[key];
                      return (
                        <button key={key} onClick={() => updatePermission(emp.id, key, !on)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "start",
                            padding: "10px 12px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                            border: `1.5px solid ${on ? PRIMARY : LINE}`,
                            background: on ? CHIP : CARD, color: INK, fontSize: 13.5, fontWeight: on ? 700 : 500,
                          }}>
                          {/* مفتاح لا مربّع: الحالة تُقرأ من بعيد */}
                          <span style={{
                            width: 34, height: 20, borderRadius: 20, flexShrink: 0, position: "relative",
                            background: on ? PRIMARY : LINE, transition: "background .16s",
                          }}>
                            <span style={{
                              position: "absolute", top: 3, insetInlineStart: on ? 17 : 3,
                              width: 14, height: 14, borderRadius: "50%", background: "#fff",
                              transition: "inset-inline-start .16s",
                            }} />
                          </span>
                          {PERMISSION_LABELS[key]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}

      {/* ── موظف جديد ── */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{
          position: "fixed", inset: 0, background: "rgba(22,19,31,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: CARD, borderRadius: 22, padding: 22, width: 420, maxWidth: "94vw", boxShadow: "0 24px 60px rgba(22,19,31,0.28)" }}>
            <SectionTitle icon={I.users}>موظف جديد</SectionTitle>

            {formError && (
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "var(--t-red-bg)", border: "1px solid var(--t-red-line)", color: "var(--t-red-ink)", borderRadius: 13, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
                <Icon path={I.alert} size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{formError}</span>
              </div>
            )}

            <Field label="الاسم الكامل">
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="اسم الموظف" style={inputStyle} />
            </Field>
            <Field label="البريد الإلكتروني">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com" style={{ ...inputStyle, direction: "ltr", textAlign: "left" }} />
            </Field>
            <Field label="كلمة المرور" hint="يستطيع الموظف تغييرها بعد أول دخول.">
              <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" style={inputStyle} />
            </Field>

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <Button onClick={createEmployee} disabled={formLoading} icon={I.plus}
                style={{ flex: 1, opacity: formLoading ? 0.65 : 1 }}>
                {formLoading ? "جاري الإنشاء..." : "إنشاء"}
              </Button>
              <Button kind="ghost" onClick={() => setShowModal(false)} style={{ width: "auto", padding: "0 22px" }}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
