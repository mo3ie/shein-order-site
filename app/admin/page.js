"use client"

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Admin(){

  
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);


  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/admin/login");
      }
    };

    checkUser();
  }, []);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState({});
  const [shippingMap, setShippingMap] = useState({});
  const [exchangeRate, setExchangeRate] = useState("");
  const [successId, setSuccessId] = useState(null);
  const [saved, setSaved] = useState(false);

const getRate = async () => {
  const { data, error } = await supabase
    .from("settings")
    .select("exchange_rate")
    .eq("id", 1)
    .single();

  if (data) {
    setExchangeRate(data.exchange_rate);
  }
};

useEffect(() => {
  const getRate = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("exchange_rate")
      .eq("id", 1)
      .single();

    if (data) {
      setExchangeRate(data.exchange_rate);
    }
  };

  getRate();
}, []);

  async function getOrders() {
  const res = await fetch("/api/order");
  const result = await res.json();
  
  console.log("RESULT:", result);
 

  

  setOrders(
  result.data.filter(
    (o) => o.status !== "deleted" && o.status !== "completed"
  )
);
  setLoading(false);
}

  async function updateStatus(id, newStatus, order){

  await fetch("/api/order", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
   body: JSON.stringify({
  id,
  status: newStatus
})
  });

  // تحديث القائمة
  getOrders();

  // 👇 إرسال واتساب تلقائي
  if (["ordered", "shipped", "delivered"].includes(newStatus)) {
  sendWhatsApp({ ...order, status: newStatus });
}
}


useEffect(() => {
  console.log("PAGE LOADED");
  getOrders();
}, []);

 function sendWhatsApp(order){

  // تنظيف الرقم
  let phone = order.phone;
  phone = phone.replace(/\D/g, "");

  if(phone.startsWith("0")){
    phone = "218" + phone.slice(1);
  }

  // تحديد الرسالة حسب الحالة
  let text = "";

  if(order.status === "ordered"){
    text = "تم شراء طلبك من شي إن 🛍️";
  }
  else if(order.status === "shipped"){
    text = "تم شحن طلبك وهو في الطريق 🚚";
  }
  else if(order.status === "delivered"){
    text = "تم تسليم طلبك 🎉";
  }
  else {
    text = "تم استلام طلبك";
  }

  // الرسالة النهائية
  const message = `مرحباً ${order.name}
${text}`;

  // الرابط
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  // فتح واتساب
  window.location.href = url;
}

const btnBase = {
  padding: "7px 12px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  marginRight: "5px",
  marginTop: "5px",
  fontSize: "12px",
  fontWeight: "600",
};

const filterBtn = {
  padding: "7px 14px",
  marginRight: "6px",
  borderRadius: "8px",
  border: "1px solid #2a2a2a",
  background: "#1a1a1a",
  color: "#aaa",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "500",
  transition: "0.2s",
};

if (loading) {
  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#555", fontSize: "15px" }}>⏳ جاري التحميل...</p>
    </main>
  );
}

console.log("ADMIN COMPONENT RUNNING");


  return (

    <main style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      padding: "28px",
    }}>

    {/* Header */}
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "24px",
      paddingBottom: "20px",
      borderBottom: "1px solid #1f1f1f",
    }}>
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "2px",
          background: "linear-gradient(90deg,#a855f7,#3b82f6)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0 }}>
          TREND
        </h1>
        <p style={{ color: "#555", fontSize: "13px", margin: "2px 0 0" }}>لوحة الإدارة</p>
      </div>
      <button
        onClick={async () => { await supabase.auth.signOut(); router.push("/admin/login"); }}
        style={{
          background: "transparent", color: "#ef4444",
          border: "1px solid #ef444430", padding: "8px 16px",
          borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600"
        }}
      >
        تسجيل الخروج
      </button>
    </div>

    <div style={{marginBottom:"20px"}}>



    <div style={{
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "14px",
  padding: "20px",
  marginBottom: "20px"
}}>

  <h3 style={{ margin: "0 0 14px 0", color: "#facc15", fontSize: "15px" }}>
    💱 سعر الدولار اليومي
  </h3>

  {/* السعر الحالي المحفوظ */}
  <div style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#22c55e22",
    border: "1px solid #22c55e55",
    borderRadius: "999px",
    padding: "6px 16px",
    marginBottom: "14px"
  }}>
    <span style={{ color: "#86efac", fontSize: "13px" }}>السعر الحالي:</span>
    <strong style={{ color: "#22c55e", fontSize: "18px" }}>{exchangeRate || "—"} د.ل</strong>
  </div>

  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
    <input
      placeholder="أدخل السعر الجديد (مثال: 5.2)"
      value={exchangeRate}
      onChange={(e) => setExchangeRate(e.target.value)}
      type="number"
      step="0.01"
      style={{
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid #444",
        background: "#2d2d2d",
        color: "#fff",
        width: "220px",
        fontSize: "16px",
        outline: "none"
      }}
    />

    <button
      onClick={async () => {
        const { error } = await supabase
          .from("settings")
          .update({ exchange_rate: Number(exchangeRate) })
          .eq("id", 1);

        if (error) {
          alert("❌ فشل التحديث");
        } else {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }
      }}
      style={{
        background: "#22c55e",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "15px"
      }}
    >
      💾 حفظ
    </button>

    {saved && (
      <span style={{ color: "#22c55e", fontWeight: "bold", fontSize: "14px" }}>
        ✅ تم الحفظ
      </span>
    )}
  </div>

</div>



    </div>

<input
  placeholder="🔍 ابحث برقم الهاتف أو الاسم"
  value={search}
  onChange={(e)=>setSearch(e.target.value)}
  style={{
    padding: "12px 16px",
    width: "100%",
    marginBottom: "16px",
    borderRadius: "10px",
    border: "1px solid #2a2a2a",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  }}
/>
<div style={{marginBottom:"15px"}}>

  <button 
    style={{
      ...filterBtn,
      background: filterStatus === "all" ? "#3b82f6" : "#4d4e4d"
    }}
    onClick={()=>setFilterStatus("all")}
  >
    الكل
  </button>

  <button 
    style={{
      ...filterBtn,
      background: filterStatus === "new" ? "#3b82f6" : "#4d4e4d"
    }}
    onClick={()=>setFilterStatus("new")}
  >
    جديد
  </button>

  <button 
    style={{
      ...filterBtn,
      background: filterStatus === "ordered" ? "#3b82f6" : "#4d4e4d"
    }}
    onClick={()=>setFilterStatus("ordered")}
  >
    تم الشراء
  </button>

  <button 
    style={{
      ...filterBtn,
      background: filterStatus === "shipped" ? "#3b82f6" : "#4d4e4d"
    }}
    onClick={()=>setFilterStatus("shipped")}
  >
    تم الشحن
  </button>

</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#fff", margin: 0 }}>
          الطلبات الحالية <span style={{ color: "#555", fontWeight: "400", fontSize: "14px" }}>({orders.filter(o => filterStatus === "all" || o.status === filterStatus).length})</span>
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => router.push("/admin/trash")} style={{
            padding: "8px 14px", borderRadius: "8px",
            background: "#ef444415", color: "#ef4444",
            border: "1px solid #ef444430", cursor: "pointer", fontSize: "13px", fontWeight: "600"
          }}>🗑️ المحذوفات</button>
          <button onClick={() => router.push("/admin/completed")} style={{
            padding: "8px 14px", borderRadius: "8px",
            background: "#22c55e15", color: "#22c55e",
            border: "1px solid #22c55e30", cursor: "pointer", fontSize: "13px", fontWeight: "600"
          }}>✅ المنجزة</button>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))",
        gap: "16px"
      }}>

        {(orders || [])
  .filter((order) =>
    (filterStatus === "all" || order.status === filterStatus) &&
    (
      order.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.phone?.includes(search)
    )
  )
  .map((order) => {




const base = Number(order.price || 0);
const profit = base * 0.01;
const totalUSD = base + profit;
const priceLYD = Number(exchangeRate || 0) ? totalUSD * Number(exchangeRate || 0) : 0;
const shippingValue = Number(shipping[order.id] || 0);
const finalTotal = priceLYD + shippingValue;

console.log("PRICE:", order.price);
console.log("RATE:", exchangeRate);
console.log("SHIPPING:", shipping[order.id]);

   return (

    
          <div key={order.id} style={{
            background: "#fff",
            color: "#111",
            border: "1px solid #e8e8e8",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            padding: "18px",
            borderRadius: "16px",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e)=> { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.1)"; }}
          onMouseLeave={(e)=> { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.06)"; }}
>

<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px"
}}>

  <span style={{
    fontSize: "12px",
    background: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: "999px",
    color: "#333",
    fontWeight: "500"
  }}>
    📦 #{order.id.slice(0, 8)}
  </span>

</div>

<span
  onClick={() => navigator.clipboard.writeText(order.id)}
  style={{
    fontSize: "12px",
    background: "#000",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "999px",
    cursor: "pointer"
  }}
>
  📦 نسخ ID
</span>

<button 
  onClick={()=>updateStatus(order.id, "deleted", order)} 
  style={{
    ...btn,
    background: "#ef4444",
    color: "#fff"
  }}
>
  حذف
</button>

            <p><strong>👤 الاسم:</strong> {order.name}</p>
            <p><strong>📞 الهاتف:</strong> {order.phone}</p>
            <p><strong>💰 السعر:</strong> {order.price}</p>

            <p>
              <strong>🛒 السلة:</strong><br/>
              <a
  href={order.cart_link}
  target="_blank"
  style={{
    display: "block",
    marginTop: "10px",
    marginBottom: "10px",
    transition: "0.2s",
    padding: "10px",
    textAlign: "center",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    fontWeight: "bold"
  }}

  onMouseOver={(e)=> e.target.style.background="#000"}
onMouseOut={(e)=> e.target.style.background="#2563eb"}
>
  🌐 فتح المنتج
</a>
            </p>

{order.image_url && (
  <img
  src={order.image_url}
  className="w-25 h-25 object-cover cursor-pointer hover:scale-105 transition"
  onClick={() => setSelectedImage(order.image_url)}
/>
)}



<input
  placeholder="سعر الشحن"
  style={{
    width:"100%",
    padding:"10px",
    marginTop:"10px",
    borderRadius:"8px",
    border:"2px solid #ddd",      // 👈 إطار
    outline:"none",
    fontSize:"14px",
    transition:"0.3s"
  }}
  onFocus={(e)=> e.target.style.border="2px solid #000"}   // 👈 عند الضغط
  onBlur={(e)=> e.target.style.border="2px solid #ddd"}    //

  value={shipping[order.id] || ""}
  onChange={(e) =>
    setShipping({
      ...shipping,
      [order.id]: e.target.value,
    })
  }
/>



<div style={{ fontSize: "13px", margin: "10px 0", background: "#f9fafb", borderRadius: "10px", padding: "12px", border: "1px solid #e5e7eb" }}>
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#6b7280" }}>
    <span>📦 السعر الأصلي</span><strong>{base.toFixed(2)} $</strong>
  </div>
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#f97316" }}>
    <span>💸 العمولة (1%)</span><strong>{profit.toFixed(2)} $</strong>
  </div>
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#2563eb" }}>
    <span>💵 الإجمالي بالدولار</span><strong>{totalUSD.toFixed(2)} $</strong>
  </div>
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#666" }}>
    <span>💱 سعر الدولار</span><strong>{exchangeRate || "—"} د.ل</strong>
  </div>
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#059669" }}>
    <span>🇱🇾 الإجمالي بالليبي</span><strong>{priceLYD.toFixed(2)} د.ل</strong>
  </div>
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#7c3aed" }}>
    <span>🚚 الشحن</span><strong>{shippingValue} د.ل</strong>
  </div>
  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e5e7eb", color: "#15803d", fontWeight: "bold" }}>
    <span>💰 الإجمالي النهائي</span><strong style={{ fontSize: "15px" }}>{finalTotal.toFixed(2)} د.ل</strong>
  </div>
</div>


<button
  onClick={async () => {
    const res = await fetch("/api/order", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: order.id,
        shipping: shipping[order.id],
        exchange_rate: exchangeRate,
        price_lyd: priceLYD,
        final_total: finalTotal
      })
    });

    if (res.ok) {
      setSuccessId(order.id);
      setTimeout(() => setSuccessId(null), 2000);
    }
  }}

  style={{
  background:"#000",
  color:"#fff",
  border:"none",
  borderRadius:"10px",
  padding:"12px",
  width:"100%",
  marginTop:"10px",
  cursor:"pointer",
  fontWeight:"600"
}}
  onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
  onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
>

  
 <div style={{
  display: "flex",
  background:"#000",
  color:"#fff",
  alignItems: "center",
  gap: "12px",
  justifyContent: "space-between",
  margin: "12px , 0"
}}>


    💾 حفظ السعر


  {successId === order.id && (
    <span
  style={{
  color: "#16a34a",
  marginLeft: "10px",
  fontSize: "13px"
}}
>
  ✓ تم الحفظ
</span>
  )}

</div>
</button>




            <p style={{marginTop: "10px",
              marginBottom: "10px"
            }}>
              <strong>📦 الحالة :</strong>
              <span style={{
                marginLeft:5,
                padding:"3px 8px",
                margin: "12px, 0",
                marginRight: "10px",
                borderRadius:"6px",
                background:getStatusColor(order.status)
              }}>
                {order.status}
              </span>
            </p>

            <div style={{marginTop:"10px"}}>

              <button 
  onClick={()=>updateStatus(order.id, "ordered", order)} 
  style={{
    ...btn,
    background: order.status === "ordered" ? "#3b82f6" : "#e5e7eb",
    color: order.status === "ordered" ? "#fff" : "#000"
  }}
>
  تم الشراء
</button>

<button 
  onClick={()=>updateStatus(order.id, "shipped", order)} 
  style={{
    ...btn,
    background: order.status === "shipped" ? "#8b5cf6" : "#e5e7eb",
    color: order.status === "shipped" ? "#fff" : "#000"
  }}
>
  تم الشحن
</button>

<button 
  onClick={()=>updateStatus(order.id, "delivered", order)} 
  style={{
    ...btn,
    background: order.status === "delivered" ? "#10b981" : "#e5e7eb",
    color: order.status === "delivered" ? "#fff" : "#000"
  }}
>
  تم التسليم
</button>

<button 
  onClick={()=>updateStatus(order.id, "completed", order)} 
  style={{
    ...btn,
    background: "#22c55e",
    color: "#fff"
  }}
>
  منجز
</button>

              <button 
  onClick={()=>sendWhatsApp(order)}
  style={{
    ...btnBase,
    background:"#25D366",
borderRadius:"8px",
padding:"6px 12px"
  }}
>
  واتساب
</button>

            </div>
            

          </div>
   );
})}

{selectedImage && (
  <div
    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn animate-zoom in"
    onClick={() => setSelectedImage(null)}
  >
    <img
      src={selectedImage}
      onClick={(e) => e.stopPropagation()}
      className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl animate-zoomIn "
    />

    <button
  className="absolute top-5 right-5 text-white text-2xl"
  onClick={() => setSelectedImage(null)}
>
  ✕
</button>

  </div>
)}


{selectedLink && (
  <div
    onClick={() => setSelectedLink(null)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "90%",
        height: "90%",
        background: "#fff",
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative"
      }}
    >
      <button
        onClick={() => setSelectedLink(null)}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "#000",
          color: "#fff",
          border: "none",
          padding: "6px 10px",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        ✕
      </button>

      <iframe
        src={selectedLink}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  </div>
)}

      </div>

    </main>
    )};


// ألوان الحالات
function getStatusColor(status){

  if(status === "new") return "#f59e0b";
  if(status === "ordered") return "#3b82f6";
  if(status === "shipped") return "#8b5cf6";
  if(status === "delivered") return "#10b981";

  return "#444";
}

const btn = {
  padding: "7px 12px",
  borderRadius: "8px",
  border: "1px solid #e0e0e0",
  background: "#f8f8f8",
  color: "#333",
  marginRight: "6px",
  marginTop: "4px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "500",
  transition: "0.2s",
};

