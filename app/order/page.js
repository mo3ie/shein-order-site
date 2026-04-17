"use client"
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Tesseract from "tesseract.js";
import { useRouter } from "next/navigation";

export default function Home() {

const [cartLink, setcartLink] = useState("");
const [name, setName] = useState("");
const [phone, setPhone] = useState("");
const [image, setImage] = useState(null);
const [price, setPrice] = useState(null);
const [loading, setLoading] = useState(false);
const [sending, setSending] = useState(false);
const [preview, setPreview] = useState(null);
const [trackId, setTrackId] = useState("");
const [user, setUser] = useState(null);

const router = useRouter();

useEffect(()=>{
  supabase.auth.getUser().then(({data})=>{
    setUser(data.user);
  });
},[]);

// ✅ إصلاح الحساب
const base = price || 0;
const profit = base * 0.3;

const [exchangeRate, setExchangeRate] = useState(1);

useEffect(() => {
  const getRate = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("exchange_rate")
      .eq("id", 1)
      .single();

    if (data) {
      setExchangeRate(Number(data.exchange_rate));
    }
  };

  getRate();
}, []);

const totalUSD = base + profit;

const priceLYD = exchangeRate
  ? totalUSD * exchangeRate
  : 0;

// 🔍 تتبع الطلب
const handleTrack = () => {
  if (!trackId) {
    alert("أدخل رقم الطلب");
    return;
  }

  window.location.href = `/track?id=${trackId}`;
};

// 📷 قراءة الصورة
async function handleImage(file) {
  setLoading(true);

  const { data: { text } } = await Tesseract.recognize(file, "eng+ara");

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
  setLoading(false);
}

// ✅ إرسال الطلب فقط (بدون دفع)
async function handleSubmit() {

  const { data: { user } } = await supabase.auth.getUser();

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

    // رفع الصورة
    const fileName = Date.now() + "-" + image.name;

    const { error: uploadError } =
      await supabase.storage
        .from("orders-images")
        .upload(`public/${fileName}`, image);

    if (uploadError) {
      alert("فشل رفع الصورة");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("orders-images")
      .getPublicUrl(`public/${fileName}`);

    const imageUrl = publicUrlData.publicUrl;

    // إرسال الطلب
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

    setSending(false);

    if (result.success) {
      alert("تم إرسال طلبك ✅ رقم الطلب: " + result.id);

      localStorage.setItem("lastOrderId", result.id);

      window.location.href = `/track?id=${result.id}`;

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

return (
  <main style={mainStyle}>

    <div style={cardStyle}>

      <img src="/logo.png" style={{height:100, display:"block", margin:"auto"}} />

      <h1 style={{textAlign:"center"}}>
        منتجاتك و سلتك بضغطة زر
      </h1>
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

      <input
        type="file"
        onChange={(e)=>{
          const file = e.target.files[0];
          setImage(file);
          handleImage(file);
        }}
      />

      {loading && <p>جاري القراءة...</p>}
      {price && <h3>السعر: {price}</h3>}

      {price && (
        <div style={priceBoxStyle}>
          <p>USD: {totalUSD.toFixed(2)}</p>
          <p>LYD: {priceLYD.toFixed(2)}</p>
        </div>
      )}

      {/* ✅ زر الإرسال الجديد */}
      <button onClick={handleSubmit} style={buttonStyle}>
        {sending ? "جاري الإرسال..." : "إرسال الطلب"}
      </button>

      {/* تتبع */}
      <input
        placeholder="رقم الطلب"
        value={trackId}
        onChange={(e)=>setTrackId(e.target.value)}
        style={inputStyle}
      />

      <button onClick={handleTrack} style={buttonStyle}>
        تتبع
      </button>

    </div>

  </main>
);
}

// 🎨 نفس التصميم
const mainStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const cardStyle = {
  width: "400px",
  background: "#fff",
  padding: "20px",
  borderRadius: "12px"
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "10px 0"
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "#000",
  color: "#fff",
  border: "none"
};

const priceBoxStyle = {
  background: "#eee",
  padding: "10px",
  marginTop: "10px"
};