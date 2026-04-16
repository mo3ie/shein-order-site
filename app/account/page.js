"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  
const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const router = useRouter();

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // جلب المستخدم + طلباته
  useEffect(() => {
    const getData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setOrders(ordersData || []);
      setLoading(false);
    };

    getData();
  }, []);

  // تسجيل خروج
  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return <div style={{ padding: 20 }}>جاري التحميل...</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 20,
        direction: "rtl",
        background: "linear-gradient(...)",
        backgroundImage: "url('/bg.png')",
        backgroundSize: "cover",
        background: "linear-gradient(to bottom, #f8f9fb, #eef1f5)",
      }}
    >
      {/* الكارد الرئيسي */}
      <div
        style={{
          maxWidth: 600,
          margin: "auto",
          background: "#fff",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        {/* معلومات المستخدم */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img
            src={user.user_metadata?.avatar_url || "/avatar.png"}
            alt="avatar"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: 10,
            }}
          />

          <h2>{user.user_metadata?.name || "مستخدم"}</h2>
          <p style={{ color: "#666" }}>{user.email}</p>
        </div>

        {/* أزرار */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => router.push("/")}
            style={btnStyle}
          >
            ➕ طلب جديد
          </button>

          <button
            onClick={logout}
            style={{ ...btnStyle, background: "#ff4d4f" }}
          >
            تسجيل خروج
          </button>
        </div>

        {/* الطلبات */}
        <h3 style={{ marginBottom: 10 }}>طلباتي</h3>

        {orders.length === 0 && (
          <p style={{ color: "#888" }}>لا يوجد طلبات بعد</p>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: "bold" }}>
                  #{order.id.slice(0, 8)}
                </div>
                <div style={{ fontSize: 13, color: "#666" }}>
                  {order.status || "جديد"}
                </div>
              </div>

              <button
                onClick={() =>
                  router.push(`/track?id=${order.id}`)
                }
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "#000",
                  color: "#fff",
                  fontSize: 12,
                }}
              >
                عرض
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// تصميم الزر
const btnStyle = {
  flex: 1,
  padding: 10,
  borderRadius: 10,
  background: "#000",
  color: "#fff",
  border: "none",
};