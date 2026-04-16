"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Completed() {
  const [orders, setOrders] = useState([]);
  const router = useRouter();

  async function getOrders() {
    const res = await fetch("/api/order");
    const result = await res.json();

    setOrders(result.data.filter(o => o.status === "completed"));
  }

  useEffect(() => {
    getOrders();
  }, []);

  return (
    <main style={{
      minHeight:"100vh",
      background:"#0f0f0f",
      color:"#fff",
      padding:"30px",
      direction:"rtl"
    }}>

      <button
        onClick={() => router.push("/admin")}
        style={{
          marginBottom:"20px",
          padding:"10px 14px",
          borderRadius:"8px",
          background:"#000",
          color:"#fff",
          border:"none",
          cursor:"pointer"
        }}
      >
        ⬅️ رجوع
      </button>

      <h2 style={{marginBottom:"20px"}}>✅ الطلبات المنجزة</h2>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))",
        gap:"15px"
      }}>

        {orders.map(order => (
          <div key={order.id} style={{
            background:"#fff",
            color:"#111",
            padding:"15px",
            borderRadius:"12px",
            boxShadow:"0 0 10px rgba(0,0,0,0.3)"
          }}>

            <p><strong>👤 الاسم:</strong> {order.name}</p>
            <p><strong>📞 الهاتف:</strong> {order.phone}</p>
            <p><strong>💰 السعر:</strong> {order.price}</p>

            {order.image_url && (
              <img
                src={order.image_url}
                style={{width:"100%", borderRadius:"10px", marginTop:"10px"}}
              />
            )}

          </div>
        ))}

      </div>
    </main>
  );
}