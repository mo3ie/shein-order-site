"use client"
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Tesseract from "tesseract.js";
import { useRouter } from "next/navigation";

export default function orderPage () {

  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [cartLink, setcartLink] = useState("");
 const [orderId, setOrderId] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
const router = useRouter();
  const [image, setImage] = useState(null);
const [text, setText] = useState("");
const [price, setPrice] = useState(null);
const [loading, setLoading] = useState(false);
const [sending, setSending] = useState(false);
const [preview, setPreview] = useState(null);
const [trackId, setTrackId] = useState("");
const [user, setUser] = useState(null);
const [selectedMethod, setSelectedMethod] = useState(null);
const [cardNumber, setCardNumber] = useState("");


const paymentMethods = [
  { id: "moamalat", name: "🏦 معاملات", color: "#16a34a" },
  { id: "edfali", name: "🏧 ادفع لي", color: "#9333ea" },
  { id: "mobicash", name: "📱 موبي كاش", color: "#0284c7" },
  { id: "masrefypay", name: "💳 مصرفي", color: "#ea580c" },
  { id: "yousrpay", name: "💳 يسر باي", color: "#0d9488" },
  { id: "saharpay", name: "💳 صحارة باي", color: "#ca8a04" }
];


useEffect(()=>{


  supabase.auth.getUser().then(({data})=>{
    setUser(data.user);
  });
},[]);


  const handleTrack = () => {
    if (!trackId) {
      alert("أدخل رقم الطلب");
      return;
    }

    window.location.href = `/track?id=${trackId}`;
  };


const [exchangeRate, setExchangeRate] = useState(1);
const base = price || 0; // من الصورة

const profit = base * 0.03;
const totalUSD = base + profit;
const priceLYD = exchangeRate
  ? totalUSD * exchangeRate
  : 0;

useEffect(() => {
  const getRate = async () => {
    const { data, error } = await supabase
  .from("settings")
  .select("exchange_rate")
  .eq("id", 1)
  .single();

if (error) {
  console.error(error);
  return;
}

if (data) {
  setExchangeRate(Number(data.exchange_rate));
}
  };

  getRate();
}, []);









async function handleImage(file) {
  setLoading(true);

  const { data: { text } } = await Tesseract.recognize(file, "eng+ara");

  console.log(text);

  let price = null;

  let matchEn = text.match(/Estimated Price[^0-9]*([\d,]+\.\d+)/i);
  let matchAr = text.match(/السعر المقدر[^0-9]*([\d,]+\.\d+)/i);

  if (matchEn) {
  price = parseFloat(matchEn[1].replace(/,/g, ""));
} else if (matchAr) {
    price = parseFloat(matchAr[1].replace(/,/g, ""));
  }

  if (!price) {
    const anyNumber = text.match(/[\d,]+\.\d+/);
price = anyNumber ? parseFloat(anyNumber[0].replace(/,/g, "")) : 0;
  }

  setPrice(price);

  setLoading(false); // 👈 هذا السطر كان ناقص أو في المكان الخطأ
}
async function handleSubmit() {


const { data: { user } } = await supabase.auth.getUser();


  console.log("IMAGE STATE:", image);
  
  try {
    if (loading) {
  alert("انتظر قليلاً...");
  return;
}

if (!name || !phone || price === null || !image) {
  alert("تأكد من كل البيانات ورفع الصورة");
  return;
}
    setSending(true);

    // 🟡 1. رفع الصورة إلى Supabase
    const fileName = Date.now() + "-" + image.name;

    const { data: uploadData, error: uploadError } =
      await supabase.storage
        .from("orders-images")
        .upload(`public/${fileName}`, image);

    if (uploadError) {
      console.error(uploadError);
      alert("فشل رفع الصورة");
      return;
    }

    // 🟢 2. جلب رابط الصورة
    const { data: publicUrlData } = supabase.storage
      .from("orders-images")
      .getPublicUrl(`public/${fileName}`);

    const imageUrl = publicUrlData.publicUrl;

    // 🟢 3. إرسال الطلب
    const res = await fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  name,
  phone,
  cart_link: cartLink,
  price,
  image_url: imageUrl,
  user_id: user?.id
}),
    });

const result = await res.json();
console.log("RESULT FROM API:", result);

setSending(false);

if (result.success) {
  alert("تم إرسال طلبك ✅ رقم الطلب: " + result.id);

  localStorage.setItem("lastOrderId", result.id);

 

  setName("");
  setPhone("");
  setcartLink("");
  setPrice(null);
  setImage(null);
} else {
  alert("فشل ❌");
}

  } catch (err) {
    console.error(err);
    alert("خطأ ❌");
  }
}

function extractPrice(text) {
  const match = text.match(/\$?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

function calculateFinalPrice(base) {
  let shipping = 15;
  let profit = base * 0.03;

  return Math.round(base + shipping + profit);
}



  

const handlePayment = async () => {
  try {
    if (!name || !phone || price === null || !image) {
      alert("تأكد من كل البيانات");
      return;
    }

    // 1️⃣ رفع الصورة
    const fileName = Date.now() + "-" + image.name;

    const { error } = await supabase.storage
      .from("orders-images")
      .upload(`public/${fileName}`, image);

    if (error) {
      alert("فشل رفع الصورة");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("orders-images")
      .getPublicUrl(`public/${fileName}`);

    const imageUrl = publicUrlData.publicUrl;

    // 2️⃣ إنشاء الطلب في الداتابيس
    const orderRes = await fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        phone,
        cart_link: cartLink,
        price,
        image_url: imageUrl
        
         
      })
    });

    const orderData = await orderRes.json();

    if (!orderData.success) {
      alert("فشل إنشاء الطلب");
      return;
    }

    const orderId = orderData.id; // ✅ هنا الصحيح

    await supabase.from("payments").insert({
  order_id: orderId,
  method: "stripe",
  status: "pending",
  amount: totalUSD
});

    // 3️⃣ إرسال إلى Stripe
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
  amount: totalUSD,

  orderId: orderId
}),
    });

    const data = await res.json();

    window.location.href = data.url;

  } 
  
  
  catch (err) {
  console.error(err);
  alert("خطأ في الدفع");
}
};



const handleDpay = async (method) => {
  try {

    console.log("🔥 METHOD:", method);

    if (!method) {
      alert("اختار طريقة الدفع أولاً");
      return;
    }

    if (!name || !phone || price === null || !image) {
      alert("تأكد من كل البيانات");
      return;
    }

    // 1️⃣ رفع الصورة
    const fileName = Date.now() + "-" + image.name;

    const { error } = await supabase.storage
      .from("orders-images")
      .upload(`public/${fileName}`, image);

    if (error) {
      alert("فشل رفع الصورة");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("orders-images")
      .getPublicUrl(`public/${fileName}`);

    const imageUrl = publicUrlData.publicUrl;

    // 2️⃣ إنشاء الطلب
    const orderRes = await fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        phone,
        cart_link: cartLink,
        price,
        image_url: imageUrl
      })
    });

    const orderData = await orderRes.json();

    if (!orderData.success) {
      alert("فشل إنشاء الطلب");
      return;
    }

    const orderId = orderData.id;
setOrderId(orderId);

    await supabase.from("payments").insert({
  order_id: orderId,
  method: "dpay",
  status: "pending",
  amount: priceLYD
});

   

if (!priceLYD || isNaN(priceLYD)) {
  throw new Error("السعر غير صالح");
}

    // 3️⃣ إرسال لـ DPAY
    const payload = {
      amount: Math.round(Number(priceLYD)) ,
      method: method,
      order_id: orderId // ✅ الحل الحقيقي
    };

console.log("📦 PAYLOAD:", payload);
console.log("💰 FINAL AMOUNT:", priceLYD);



    if (method === "edfali") {
      payload.customer_mobile = phone;
    }

    if (
      method === "mobicash" ||
      method === "masrefypay" || 
      method === "yousrpay" ||
      method === "saharpay"
    ) {
      payload.card_number = cardNumber;
    }

    const res = await fetch("/api/dpay", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    orderId: orderId,
    amount: Math.round(Number(priceLYD)),
    method: method,
    customer_mobile: phone,
    card_number: cardNumber,
    customer_name: name
  })
});

   const data = await res.json();
console.log("DPAY RESPONSE:", data);

if (data.payment_link) {
  window.location.href = data.payment_link;

  localStorage.setItem("lastOrderId", orderId);

} else {
  console.error("❌ DPAY ERROR FULL:", data);  // 👈 مهم
  alert("❌ " + (data.error || "فشل الدفع"));
}
  } catch (err) {
    console.error(err);
    alert("خطأ في الدفع");
  }
};



  return (
    <main style={mainStyle}>



<style>
{`
@keyframes zoomIn {
  from {
    transform: scale(0.7);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
`}
</style>

      <div style={cardStyle}>
        
<div style={{
  display: "flex",
  justifyContent: "center",
  marginBottom: "5px"
}}>

  
  <img
    src="/logo.png"
    alt="logo"
    style={{
      height: "100px",
      objectFit: "contain"
    }}
  />
</div>
        <h1 style={{textAlign:"center", marginBottom:20}}>
       منتجاتك و سلتك بضغطة زر تكون عندك
        </h1>

        <p style={{fontSize:14, marginBottom:20, color:"#ccc"}}>
          ضع رابط السلة من شي إن وسنتكفل بشراء الطلب لك
        </p>

        <input
          placeholder="رابط السلة"
          value={cartLink}
          onChange={(e)=>setcartLink(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="اسمك"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="رقم الهاتف"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
          style={inputStyle}
        />
        <br /><br />

    {/* رفع الصورة */}

    <label style={{
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px dashed #ccc",
  borderRadius: "12px",
  padding: "20px",
  cursor: "pointer",
  transition: "0.3s",
  background: "#fafafa"
}}>


    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
  const file = e.target.files[0];

  console.log("FILE:", file);   // للتأكد

  setImage(file);               // 👈 هذا أهم سطر
  handleImage(file);
}}
    />

<span style={{ color: "#777" }}>
    📷  
  </span>
</label>


{image && (
  <img
    src={URL.createObjectURL(image)}
    onClick={() => setPreview(URL.createObjectURL(image))}
    style={{
      width: "120px",
      height: "120px",
      objectFit: "cover",
      borderRadius: "10px",
      marginTop: "10px",
      cursor: "pointer",
      border: "1px solid #eee"
    }}
  />
)}

    <br />

    {loading && <p>⏳ جاري قراءة الصورة...</p>}

    {price && <h3>💰 السعر النهائي: {price}</h3>}

    <br />

    {price && (
  <div
  style={priceBoxStyle}
>
  {/* الدولار */}
  <p style={{ margin: "6px 0", color: "#6b7280" }}>
    💵 السعر بالدولار: <strong>{totalUSD.toFixed(2)} $</strong>
  </p>

  {/* سعر الصرف */}
  <p style={{ margin: "6px 0", color: "#aaa" }}>
    💱 سعر الصرف: <strong>{exchangeRate}</strong>
  </p>

  {/* الدينار */}
  <p style={{ margin: "6px 0", color: "#4ade80", fontWeight: "bold" }}>
    🇱🇾 السعر بالدينار: {priceLYD.toFixed(2)} د.ل
  </p>

  {/* الشحن */}
  <p style={{ margin: "6px 0", color: "#facc15" }}>
    🚚 الشحن: يحدد لاحقًا حسب الوزن
  </p>

  {/* خط فاصل */}
  <hr
    style={{
      margin: "12px 0",
      borderColor: "rgba(255,255,255,0.1)",
    }}
  />

  {/* الإجمالي */}
  <p
    style={{
      fontSize: "18px",
      fontWeight: "bold",
      color: "#22c55e",
    }}
  >
    💰 الإجمالي: {priceLYD.toFixed(2)} د.ل
  </p>

   
  </div>
)}

    <button onClick={() => setShowPaymentOptions(true)} disabled={sending}  style={buttonStyle}>
      {sending ? "جاري الإرسال..." : "إرسال الطلب"}
    </button>

<div style={{ maxWidth: 400, margin: "20px auto" }}>

      {/* 🔍 خانة التتبع */}
      <div style={trackBox}>
        <input
          placeholder="🔍 أدخل رقم الطلب"
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
          style={trackInput}

          onKeyDown={(e) => {
  if (e.key === "Enter") handleTrack();
}}
        />

        <button onClick={handleTrack} style={trackBtn}>
          بحث
        </button>
      </div>

    </div>
    
<div style={{
  display: "flex",
  gap: "10px"
}}>


  <div style={{
  position: "absolute",
  top: "20px",
  left: "20px",
  display: "flex",
  gap: "10px"
}}>

  {/* تسجيل الدخول (القديم - الأدمن) */}
  <button
    onClick={() => router.push("/login")}
    style={{
      padding: "8px 14px",
      borderRadius: "8px",
      background: "linear-gradient(135deg,#000,#333)",
      color: "#fff",
      border: "1px solid #333",
      cursor: "pointer"
    }}
  >
    🔐 تسجيل دخول 
  </button>

  {/* تسجيل حساب (الجديد) */}
  <button
    onClick={() => router.push("/signup")}
    style={{
      padding: "8px 14px",
      borderRadius: "8px",
      background: "linear-gradient(135deg,#fff,#999)",
      
      color: "#000000",
      border: "none",
      cursor: "pointer"
    }}
  >
    ✨ إنشاء حساب
  </button>

</div>

  <a
    href="/my-orders"
    style={{
      padding: "10px 16px",
      borderRadius: "10px",
      background: "#000000",
      textAlign: "center",
      width: "100%",
      color: "#fff",
      textDecoration: "none",
      transition: "0.2s"
    }}

    onMouseOver={(e)=> e.target.style.opacity="0.8"}
onMouseOut={(e)=> e.target.style.opacity="1"}
  >
    📦 طلباتي
  </a>


</div>

      </div>


{preview && (
  <div
    onClick={() => setPreview(null)}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999
    }}
  >
    <img
  src={preview}
  onClick={(e) => e.stopPropagation()}
  style={{
    background: "#ffffff",
    padding: "25px",
    borderRadius: "20px",
    width: "340px",
    textAlign: "center",
    animation: "zoomIn 0.25s ease",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
  }}
/>
  </div>
)}

{showPaymentOptions && (
  <div
    onClick={() => setShowPaymentOptions(false)}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff",
        padding: "25px",
        borderRadius: "16px",
        width: "300px",
        textAlign: "center",
        animation: "zoomIn 0.3s ease"
      }}
    >
      <h3 style={{ marginBottom: 20 }}>اختر طريقة الدفع</h3>

      {/* 💳 Stripe */}
      <button
  onClick={async () => handlePayment()}
  style={{
    ...optionBtn,
    background: "#000",
    fontWeight: "bold"
  }}
>
  💳 الدفع الدولي (Visa / MasterCard)
</button>

      {/* 🏦 DPay */}
      {/* 🏦 Moamalat */}

{paymentMethods.map((method) => (
  <button
    key={method.id}
    onClick={() => setSelectedMethod(method.id)}
    style={{
      ...optionBtn,
      background: selectedMethod === method.id ? method.color : "#f3f4f6",
      color: selectedMethod === method.id ? "#fff" : "#111"
    }}
  >
    {method.name}
  </button>
))}

{selectedMethod === "edfali" && (
  <input
    placeholder="📱 رقم الهاتف"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    style={inputStyle}
  />
)}

{["mobicash","masrefypay","yousrpay","saharpay"].includes(selectedMethod) && (
  <input
    placeholder="💳 رقم البطاقة (7 أرقام)"
    value={cardNumber}
    onChange={(e) => setCardNumber(e.target.value)}
    style={inputStyle}
  />
)}

<button
  disabled={!selectedMethod}
  onClick={() => handleDpay(selectedMethod)}
  style={{
    width: "100%",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: selectedMethod ? "#22c55e" : "#ccc",
    color: "#fff",
    fontWeight: "bold",
    marginTop: "10px",
    cursor: selectedMethod ? "pointer" : "not-allowed"
  }}
>
  {selectedMethod ? "تأكيد الدفع" : "اختر طريقة الدفع أولاً"}
</button>

      {/* 💵 لاحقاً */}
      <button
        onClick={() => {
          alert("قريباً");
        }}
        style={{ ...optionBtn, background: "#f59e0b" }}
      >
        💵 تحويل يدوي
      </button>
<button
  onClick={() => setShowPaymentOptions(false)}
  style={{
    marginTop: "10px",
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer"
  }}
>
  إغلاق
</button>

    </div>
  </div>
)}

    </main>
  );

}

const mainStyle = {
  minHeight: "100vh",
  backgroundImage: "url('/bg.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundColor: "rgba(255,255,255,0.6)",
  backgroundColor: "rgba(0,0,0,0.3)",
backgroundBlendMode: "darken",
  backgroundRepeat: "no-repeat",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "system-ui, sans-serif",
};

const optionBtn = {
  width: "100%",
  padding: "14px",
  marginBottom: "10px",
  borderRadius: "14px",
  border: "none",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  transition: "0.25s",
  boxShadow: "0 6px 15px rgba(0,0,0,0.1)"
};

const cardStyle = {
  width: "420px",
  background: "#ffffff",
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  border: "1px solid #eee",
  color: "#111"
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "10px",
  borderRadius: "12px",
  border: "1px solid #ddd",
  outline: "none",
  fontSize: "14px"
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  marginTop: "10px",
  fontWeight: "600",
  fontSize: "15px",
  transition: "0.2s"
};

const priceBoxStyle = {
  marginTop: "20px",
  padding: "16px",
  borderRadius: "14px",
  background: "#f9fafb",
  border: "1px solid #eee",
  color: "#111"
};

const trackBox = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginTop: "15px"
};

const trackInput = {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
  color: "#111",
  background: "#fff"
};

const trackBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#000",
  color: "white",
  cursor: "pointer",
  whiteSpace: "nowrap"
};
