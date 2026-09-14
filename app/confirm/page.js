"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * صفحة تأكيد قديمة كانت تقرأ pendingOrder من localStorage وترسل رمزًا عبر
 * واتساب قبل الدفع. التدفّق الحالي ينشئ الطلب ويدفع في ورقة الدفع مباشرة،
 * فلم يبقَ لها داخل، وتحوّل إلى الصفحة الأولى.
 */
export default function ConfirmRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
}
