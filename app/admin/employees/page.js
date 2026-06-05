"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

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
    <main style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#555" }}>⏳ جاري التحميل...</p>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: "28px", direction: "rtl" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid #1f1f1f" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "800", background: "linear-gradient(90deg,#a855f7,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
            إدارة الموظفين
          </h1>
          <p style={{ color: "#555", fontSize: "13px", margin: "2px 0 0" }}>{employees.length} موظف</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowModal(true)} style={{ background: "#7c3aed", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
            + إضافة موظف
          </button>
          <button onClick={() => router.push("/admin")} style={{ background: "#1a1a1a", color: "#aaa", border: "1px solid #333", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontSize: "14px" }}>
            ← العودة
          </button>
        </div>
      </div>

      {/* Employees list */}
      {employees.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#444" }}>
          <p style={{ fontSize: "18px" }}>لا يوجد موظفون بعد</p>
          <p style={{ fontSize: "13px" }}>اضغط &ldquo;+ إضافة موظف&rdquo; لإضافة أول موظف</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {employees.map(emp => (
            <div key={emp.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "16px", padding: "22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: "700", fontSize: "16px" }}>{emp.full_name}</p>
                  <p style={{ margin: "3px 0 0", color: "#666", fontSize: "13px" }}>موظف</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {saving[emp.id] && <span style={{ color: "#a855f7", fontSize: "13px" }}>⏳ جاري الحفظ...</span>}
                  <button onClick={() => removeEmployee(emp.id)} style={{ background: "#ef444415", color: "#ef4444", border: "1px solid #ef444430", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
                    إزالة
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                  const val = emp.permissions?.[key] ?? false;
                  return (
                    <div
                      key={key}
                      onClick={() => updatePermission(emp.id, key, !val)}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        background: "#1a1a1a", borderRadius: "10px", padding: "10px 14px",
                        cursor: "pointer", border: `1px solid ${val ? "#7c3aed44" : "#2a2a2a"}`,
                        transition: "0.2s",
                      }}
                    >
                      <div style={{
                        width: "38px", height: "20px", borderRadius: "999px",
                        background: val ? "#7c3aed" : "#333",
                        position: "relative", flexShrink: 0, transition: "0.2s",
                      }}>
                        <div style={{
                          position: "absolute", top: "3px",
                          left: val ? "20px" : "3px",
                          width: "14px", height: "14px",
                          borderRadius: "50%", background: "#fff", transition: "0.2s",
                        }} />
                      </div>
                      <span style={{ fontSize: "13px", color: val ? "#fff" : "#666" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: "20px", padding: "32px", width: "360px" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: "18px", fontWeight: "700" }}>إضافة موظف جديد</h2>
            {formError && <p style={{ background: "#fee2e2", color: "#dc2626", padding: "10px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px" }}>{formError}</p>}
            <input placeholder="الاسم الكامل" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={inputStyle} />
            <input placeholder="البريد الإلكتروني" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
            <input placeholder="كلمة المرور" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={inputStyle} />
            <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
              <button onClick={createEmployee} disabled={formLoading} style={{ flex: 1, padding: "12px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "700" }}>
                {formLoading ? "جاري الإنشاء..." : "إنشاء حساب"}
              </button>
              <button onClick={() => { setShowModal(false); setFormError(""); }} style={{ padding: "12px 18px", background: "#1a1a1a", color: "#aaa", border: "1px solid #333", borderRadius: "10px", cursor: "pointer" }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "1px solid #333",
  background: "#1a1a1a",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};
