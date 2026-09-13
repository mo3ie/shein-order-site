"use client";
import { useEffect, useState } from "react";

/**
 * الوضع الداكن/الفاتح.
 *
 * الافتراضي "system": يتبع إعداد الجهاز بلا أي سمة على الجذر. وحين يختار
 * الزائر بنفسه نكتب data-theme على <html> فتتغلّب على تفضيل النظام — وهي
 * السمة نفسها التي تنتظرها متغيّرات theme.css، فلا ثيم ثانٍ يُبنى هنا.
 */
export function useTheme() {
  const [theme, setThemeState] = useState("system"); // system | light | dark

  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem("trend-theme"); } catch {}
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const setTheme = (next) => {
    setThemeState(next);
    try { localStorage.setItem("trend-theme", next); } catch {}
    if (next === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
  };

  /** ما يراه الزائر الآن فعلاً، بعد حساب تفضيل النظام. */
  const resolved = theme === "system"
    ? (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;

  return { theme, resolved, setTheme, toggle: () => setTheme(resolved === "dark" ? "light" : "dark") };
}
