"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";


export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  console.log("No user logged in");
  return;
}

const { data, error } = await supabase
  .from("orders")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

if (error) {
  console.error(error);
} else {
  setOrders(data || []);
}}

    load();
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      padding: "30px",
      direction: "rtl",
      color: "#fff"
    }}>

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px"
      }}>
        <h2 style={{fontSize:"22px"}}>📦 طلباتي</h2>

        <button
          onClick={() => router.push("/")}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#1f1f1f",
            color: "#fff",
            border: "1px solid #333",
            cursor: "pointer"
          }}
        >
          ⬅️ الرئيسية
        </button>
      </div>

      {/* Orders */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))",
        gap: "20px"
      }}>

        {orders.map(order => (
          <div key={order.id} style={{
            background: "#fff",
            color: "#111",
            padding: "15px",
            borderRadius: "14px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            transition: "0.2s"
          }}>

            {/* رقم الطلب */}
            <div style={{
              fontSize: "12px",
              marginBottom: "10px",
              color: "#888"
            }}>
              #{order.id}
            </div>

            {/* صورة */}
            {order.image_url && (
              <img
                src={order.image_url}
                style={{
                  width: "100%",
                  borderRadius: "10px",
                  marginBottom: "10px"
                }}
              />
            )}

            {/* بيانات */}
            <p><strong>👤</strong> {order.name}</p>
            <p><strong>📞</strong> {order.phone}</p>
            <p><strong>💰</strong> {order.price}</p>

            {/* الحالة */}
            <div style={{
              marginTop: "10px",
              padding: "6px 10px",
              borderRadius: "6px",
              background:
                order.status === "completed"
                  ? "#22c55e"
                  : order.status === "deleted"
                  ? "#ef4444"
                  : "#f59e0b",
              color: "#fff",
              fontSize: "12px",
              width: "fit-content"
            }}>
              {order.status === "completed"
                ? "تم الإنجاز"
                : order.status === "deleted"
                ? "محذوف"
                : "قيد المعالجة"}
            </div>

            {/* أزرار */}
            <div style={{
              display: "flex",
              gap: "10px",
              marginTop: "15px"
            }}>

              <button
                onClick={() =>
                  router.push(`/track?orderId=${order.id}`)
                }
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                🔍 تتبع
              </button>

              <a
                href={`/track?orderId=${order.id}`}
                target="_blank"
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  background: "#2563eb",
                  color: "#fff",
                  textAlign: "center",
                  textDecoration: "none"
                }}
              >
                🖨️ طباعة
              </a>

            </div>

          </div>
        ))}

      </div>

    </main>
  );
}