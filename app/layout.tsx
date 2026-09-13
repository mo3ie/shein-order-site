// الثيم كان معرّفًا ولا يُستورد من أي مكان، فكانت كل متغيّرات الألوان غير
// موجودة والبطاقات شفافة تُظهر خلفية الصفحة خلفها. استيراده هو ما يجعل
// التصميم والوضع الداكن وقواعد الكمبيوتر تعمل أصلاً.
import "./theme.css";
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Header from "./components/Header";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "TREND — خدمة طلب شي إن",
  description: "اطلب من شي إن بسهولة عبر ترند",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.className}>
      {/* صورة الخلفية حُذفت: التصميم أرضية واحدة مسطّحة، والرسوم خلف
          البطاقات كانت تشوّش لا تزيّن. */}
      <body className="min-h-full flex flex-col" style={{ background: "var(--t-page)", color: "var(--t-ink)", margin: 0 }}>
        <Header />
        {children}
      </body>
    </html>
  );
}
