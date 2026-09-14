"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * شاشة دخول قديمة مكرّرة.
 *
 * كانت نسخة أفقر من /login (بلا Google ولا رمز ولا استعادة كلمة مرور)، فبقاؤها
 * يعني شاشتين للشيء نفسه تتباعدان مع كل تعديل. الرابط يبقى حيًّا للروابط
 * القديمة، لكنه صار تحويلاً إلى الشاشة الحقيقية.
 */
export default function UserLoginRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/login"); }, [router]);
  return null;
}
