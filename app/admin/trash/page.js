"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Trash() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState([]);
  const router = useRouter();

  async function getOrders() {
    const res = await fetch("/api/order");
    const result = await res.json();

    setOrders(result.data.filter(o => o.status === "deleted"));
  }

  useEffect(() => {
    getOrders();
  }, []);

  const restoreSelected = async () => {
    for (let id of selected) {
      await fetch("/api/order", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id,
          status: "new"
        })
      });
    }

    setSelected([]);
    getOrders();
  };

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

      <h2 style={{marginBottom:"15px"}}>🗑️ سلة المحذوفات</h2>

      <button
        onClick={restoreSelected}
        style={{
          padding:"10px 14px",
          borderRadius:"8px",
          background:"#22c55e",
          color:"#fff",
          border:"none",
          marginBottom:"20px",
          cursor:"pointer"
        }}
      >
        ♻️ استرجاع المحدد ({selected.length})
      </button>

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

            <input
              type="checkbox"
              checked={selected.includes(order.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelected([...selected, order.id]);
                } else {
                  setSelected(selected.filter(id => id !== order.id));
                }
              }}
            />

            <p><strong>👤 الاسم:</strong> {order.name}</p>
            <p><strong>📞 الهاتف:</strong> {order.phone}</p>

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