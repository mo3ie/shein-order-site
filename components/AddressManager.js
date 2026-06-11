"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

const GRAD   = "linear-gradient(135deg,#7c3aed,#3b82f6)";
const PURPLE = "#7c3aed";

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` };
}

export default function AddressManager() {
  const [addresses,  setAddresses]  = useState([]);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [form, setForm] = useState({ label: "المنزل", address_text: "", lat: null, lng: null, is_default: false });

  useEffect(() => { loadAddresses(); }, []);

  const loadAddresses = async () => {
    const res  = await fetch("/api/addresses", { headers: await authHeaders() });
    const data = await res.json();
    if (Array.isArray(data)) setAddresses(data);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ label: "المنزل", address_text: "", lat: null, lng: null, is_default: addresses.length === 0 });
    setShowModal(true);
  };

  const openEdit = (addr) => {
    setEditing(addr);
    setForm({ label: addr.label, address_text: addr.address_text, lat: addr.lat, lng: addr.lng, is_default: addr.is_default });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.address_text.trim()) { alert("أدخل العنوان"); return; }
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const body   = editing ? { id: editing.id, ...form } : form;
    await fetch("/api/addresses", { method, headers: await authHeaders(), body: JSON.stringify(body) });
    await loadAddresses();
    setShowModal(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("حذف هذا العنوان؟")) return;
    await fetch("/api/addresses", { method: "DELETE", headers: await authHeaders(), body: JSON.stringify({ id }) });
    await loadAddresses();
  };

  const handleSetDefault = async (addr) => {
    await fetch("/api/addresses", { method: "PUT", headers: await authHeaders(), body: JSON.stringify({ ...addr, is_default: true }) });
    await loadAddresses();
  };

  const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, color: "#111", boxSizing: "border-box", marginBottom: 12 };
  const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>📍 عناويني</h3>
        <button onClick={openAdd}
          style={{ padding: "8px 16px", borderRadius: 10, background: GRAD, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
          + إضافة عنوان
        </button>
      </div>

      {addresses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 20px", background: "#f9fafb", borderRadius: 14, border: "1px solid #f3f4f6" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏠</div>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>لا توجد عناوين محفوظة بعد</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {addresses.map(addr => (
            <div key={addr.id} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: addr.is_default ? `2px solid ${PURPLE}` : "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>🏷️ {addr.label}</span>
                    {addr.is_default && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: PURPLE, background: "#f5f3ff", padding: "2px 8px", borderRadius: 20 }}>افتراضي</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{addr.address_text}</p>
                  {addr.lat && <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>📍 {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}</p>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!addr.is_default && (
                    <button onClick={() => handleSetDefault(addr)} title="تعيين افتراضي"
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", fontSize: 12 }}>⭐</button>
                  )}
                  <button onClick={() => openEdit(addr)} title="تعديل"
                    style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", fontSize: 12 }}>✏️</button>
                  <button onClick={() => handleDelete(addr.id)} title="حذف"
                    style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff5f5", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", direction: "rtl" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#1e1b4b", marginBottom: 16 }}>
              {editing ? "تعديل العنوان" : "إضافة عنوان جديد"}
            </h3>

            <label style={labelStyle}>تسمية العنوان</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["المنزل", "العمل", "آخر"].map(lbl => (
                <button key={lbl} onClick={() => setForm(f => ({ ...f, label: lbl }))}
                  style={{ flex: 1, padding: "8px", borderRadius: 8, border: form.label === lbl ? `2px solid ${PURPLE}` : "1.5px solid #e5e7eb", background: form.label === lbl ? "#f5f3ff" : "#f9fafb", cursor: "pointer", fontSize: 13, fontWeight: form.label === lbl ? 700 : 400, color: form.label === lbl ? PURPLE : "#374151" }}>
                  {lbl}
                </button>
              ))}
            </div>
            {form.label === "آخر" && (
              <input style={inputStyle} placeholder="اسم مخصص" value={form.label === "آخر" ? "" : form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            )}

            <label style={labelStyle}>العنوان كنص</label>
            <input style={inputStyle} placeholder="مثال: طريق المطار، برج الفاتح، الدور 3" value={form.address_text}
              onChange={e => setForm(f => ({ ...f, address_text: e.target.value }))} />

            <label style={{ ...labelStyle, marginBottom: 8 }}>الموقع على الخريطة (اختياري)</label>
            <MapPicker lat={form.lat} lng={form.lng} onSelect={({ lat, lng }) => setForm(f => ({ ...f, lat, lng }))} />

            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0" }}>
              <input type="checkbox" id="default-chk" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} style={{ width: 16, height: 16 }} />
              <label htmlFor="default-chk" style={{ fontSize: 13, color: "#374151", cursor: "pointer" }}>تعيين كعنوان افتراضي</label>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: "12px", borderRadius: 10, background: GRAD, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
                {saving ? "⏳ جاري الحفظ..." : editing ? "حفظ التعديلات" : "إضافة العنوان"}
              </button>
              <button onClick={() => setShowModal(false)}
                style={{ padding: "12px 18px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", fontSize: 14 }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
