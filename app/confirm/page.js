"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmPage() {
  const router = useRouter();

  const [order, setOrder] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("pendingOrder"));
    if (!data) {
      router.push("/");
    } else {
      setOrder(data);
    }
  }, []);

  if (!order) return null;

  return (
    <main style={main}>

      <div style={card}>

        <h2>تأكيد الطلب</h2>

        <p>👤 الاسم: {order.name}</p>
        <p>📞 الهاتف: {order.phone}</p>

        <p>💰 السعر بالدولار: {order.totalUSD}$</p>
        <p>🇱🇾 السعر بالدينار: {order.priceLYD} د.ل</p>

        <p style={{color:"#f59e0b"}}>
          🚚 التوصيل خلال 5 - 10 أيام
        </p>

        <hr />

        <p style={{fontSize:12, color:"#888"}}>
          نحن وسيط شراء مستقل ولسنا تابعين لأي شركة
        </p>

        <button
          onClick={() => router.push("/payment")}
          style={btn}
        >
          تأكيد و متابعة الدفع
        </button>

      </div>

    </main>
  );
}

const main = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#111",
  color: "#fff"
};

const card = {
  background: "#fff",
  color: "#000",
  padding: "25px",
  borderRadius: "12px",
  width: "350px",
  textAlign: "center"
};

const btn = {
  marginTop: "20px",
  padding: "12px",
  width: "100%",
  background: "#22c55e",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer"
};