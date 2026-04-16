"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");

  const handleUpdate = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("تم تغيير كلمة المرور ✅");
    }
  };

  return (
    <div style={{
      minHeight:"100vh",
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      background:"url('/bg.png') center/cover"
    }}>
      <div style={{
        background:"#fff",
        padding:30,
        borderRadius:12
      }}>
        <h3>تغيير كلمة المرور</h3>

        <input
          type="password"
          placeholder="كلمة المرور الجديدة"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button onClick={handleUpdate}>
          تحديث
        </button>
      </div>
    </div>
  );
}