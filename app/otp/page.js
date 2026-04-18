"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OTP() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleVerify = () => {
    const saved = localStorage.getItem("otp");

    if (code === saved) {
      router.push("/confirm");
    } else {
      alert("❌ الكود خطأ");
    }
  };

  return (
    <main style={main}>
      <div style={card}>
        <h2>تأكيد رقم الهاتف</h2>

        <input
          placeholder="أدخل الكود"
          value={code}
          onChange={(e)=>setCode(e.target.value)}
          style={input}
        />

        <button onClick={handleVerify} style={btn}>
          تأكيد
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
  background: "#111"
};

const card = {
  background: "#fff",
  padding: "25px",
  borderRadius: "12px",
  width: "300px",
  textAlign: "center"
};

const input = {
  width: "100%",
  padding: "10px",
  marginTop: "10px"
};

const btn = {
  marginTop: "15px",
  padding: "10px",
  width: "100%"
};