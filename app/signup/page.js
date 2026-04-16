"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";


export default function Signup() {

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const [fullName, setFullName] = useState("");
const [phone, setPhone] = useState("");
const [city, setCity] = useState("");
const [street, setStreet] = useState("");
const [details, setDetails] = useState("");
const [avatar, setAvatar] = useState(null);


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


const verifyOtp = async () => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: "sms",
  });

  if (error) {
    alert("كود غير صحيح");
    return;
  }

  // ✅ هنا فقط بعد النجاح
  const user = data.user;

  await supabase.from("profiles").upsert({
  id: user.id,
  phone,
  name,
  });

  alert("تم إنشاء الحساب ✅");
  router.push("/account");
};

const [step, setStep] = useState("form"); // form | otp
const [otp, setOtp] = useState("");

  const handleSignup = async () => {
  if (!phone) {
    alert("أدخل رقم الهاتف");
    return;
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    alert(error.message);
  } else {
    setStep("otp");
  }
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
      backgroundImage: "url('/bg.png')",
      backgroundSize: "cover",
      direction: "rtl"
    }}>
      
      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md space-y-4" >
        <h2 className="text-xl font-bold text-center text-black ">إنشاء حساب</h2>

        <input
          type="email"
          placeholder="البريد الإلكتروني"
          className="w-full border p-3 rounded-lg"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="كلمة المرور"
          className="w-full border p-3 rounded-lg"
          onChange={(e) => setPassword(e.target.value)}
        />

        <input placeholder="الاسم الثلاثي" 
        className="w-full border p-3 rounded-lg text-black"
         onChange={(e)=>setFullName(e.target.value)} />

<input placeholder="رقم الهاتف " 
className="w-full border p-3 rounded-lg text-black"
 onChange={(e)=>setPhone(e.target.value)} />

<input placeholder="المدينة" 
className="w-full border p-3 rounded-lg text-black"
onChange={(e)=>setCity(e.target.value)} />

<input placeholder="الشارع" 
className="w-full border p-3 rounded-lg text-black"
onChange={(e)=>setStreet(e.target.value)} />

<input placeholder="تفاصيل إضافية" 
className="w-full border p-3 rounded-lg text-black"
onChange={(e)=>setDetails(e.target.value)} />

<input type="file"
placeholder="الصورة الشخصية" 
className="w-full border p-3 rounded-lg text-black"
 onChange={(e)=>setAvatar(e.target.files[0])} />

{step === "otp" && (
  <>
    <input
      placeholder="أدخل كود التحقق"
      value={otp}
      onChange={(e)=>setOtp(e.target.value)}
      className="w-full border p-3 rounded-lg text-black"
    />

    <button
      onClick={verifyOtp}
      className="w-full bg-green-600 text-white py-3 rounded-lg"
    >
      تأكيد الكود
    </button>
  </>
)}

        <button
          onClick={handleSignup}
          className="w-full bg-black text-white py-3 rounded-lg"
        >
          تسجيل
        </button>
      </div>

      
    </main>
  

);
}