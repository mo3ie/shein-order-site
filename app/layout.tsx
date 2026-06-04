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
      <body
        className="min-h-full flex flex-col"
        style={{
          backgroundImage: "url('/bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
