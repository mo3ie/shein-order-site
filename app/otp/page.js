"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * شاشة رمز قديمة من تدفّق تأكيد هاتف لم يعد مستعملاً (كانت تقارن برمز محفوظ
 * في localStorage). التحقق اليوم يجري داخل بوابة الدفع نفسها، فالرابط يبقى
 * حيًّا ويحوّل إلى الصفحة الأولى.
 */
export default function OtpRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
}
