"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function LoginPage() {

  
  const [email, setEmail] = useState("");


  
const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
  });

  if (error) alert(error.message);
};



const resetPassword = async () => {
  if (!email) {
    alert("أدخل البريد أولاً");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost:3000/reset-password",
  });

  if (error) {
    alert(error.message);
  } else {
    alert("تم إرسال رابط إعادة تعيين كلمة المرور");
  }
};

  const handleLogin = () => {
    alert("سيتم إرسال رابط تسجيل الدخول");
  };

const linkOldOrders = async (user) => {
  try {

    const {
  data: { user },
} = await supabase.auth.getUser();

await linkOldOrders(user);

    // ⚠️ عدل حسب الحقل عندك (phone أو email)
    const phone = user.phone || user.user_metadata?.phone;

    if (!phone) return;

    // جلب الطلبات القديمة بدون user_id
    const { data: oldOrders } = await supabase
      .from("orders")
      .select("id")
      .is("user_id", null)
      .eq("phone", phone);

    if (!oldOrders || oldOrders.length === 0) return;

    const ids = oldOrders.map((o) => o.id);

    // تحديثها وربطها بالمستخدم
    await supabase
      .from("orders")
      .update({ user_id: user.id })
      .in("id", ids);

  } catch (err) {
    console.error("ربط الطلبات فشل:", err);
  }
};


  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundSize: "cover",
      backgroundImage: "url('/bg.png')",
      direction: "rtl"
    }}>
      
      <div style={{
        background: "#fff",
        padding: "30px",
        color: "#2c2c2c",
        borderRadius: "12px",
        width: "300px",
        padding: "30px",
        backdropFilter: "blur(10px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        border: "1px solid #eee",
        textAlign: "center"
      }}>
        <h2>👤 تسجيل الدخول</h2>

        <input
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
            color: "#2c2c2c",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            marginTop: "15px",
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            background: "#111",
            color: "#fff",
            border: "none",
            cursor: "pointer"
          }}
        >
          تسجيل الدخول
        </button>

        <button
  onClick={loginWithGoogle}
  style={{
    width: "100%",
    padding: 12,
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 10,
    marginTop: 10,
  }}
>
  تسجيل عبر Google
</button>

        <button
  onClick={resetPassword}
  style={{marginTop:10, fontSize:12}}
>
  هل نسيت كلمة السر؟
</button>

      </div>
    </main>
  );
}