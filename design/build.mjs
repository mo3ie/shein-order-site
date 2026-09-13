// Generates the remaining artboards for the chosen "bold retail" direction.
// Kept as a script so every screen shares one header, one card shape and one
// gradient — the vocabulary is defined once instead of copied five times.
import { writeFileSync } from "node:fs";

const GRAD = "linear-gradient(150deg,#7c3aed 0%,#5b4bf5 45%,#3b82f6 100%)";

const head = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap">
  <style>
    body { margin: 0; font-family: Cairo, system-ui, sans-serif; }
    a { color: #7c3aed; } a:hover { color: #6d28d9; }
  </style>
</helmet>

`;
const tail = `</x-dc>
</body>
</html>
`;

const hdr = (title, sub) => `  <div style="background: ${GRAD}; padding: 18px 20px 22px; color: #fff; position: relative; overflow: hidden; flex-shrink: 0">
    <div style="position: absolute; inset-inline-end: -40px; top: -50px; width: 170px; height: 170px; border-radius: 50%; background: rgba(255,255,255,0.09)"></div>
    <div style="display: flex; align-items: center; justify-content: space-between; position: relative">
      <div style="font-weight: 900; font-size: 18px">ترند · شي إن</div>
      <div style="display: flex; gap: 8px; align-items: center">
        <span style="font-size: 11px; font-weight: 700; background: rgba(255,255,255,0.18); border-radius: 20px; padding: 4px 11px">EN</span>
        <div style="width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700">م</div>
      </div>
    </div>
    <div style="margin-top: 20px; position: relative">
      <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.4">${title}</div>
      ${sub ? `<div style="font-size: 12.5px; opacity: 0.82; margin-top: 6px; line-height: 1.8">${sub}</div>` : ""}
    </div>
  </div>
`;

const ico = (p) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const WALLET = ico(`<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><path d="M17 15h2"/>`);
const PHONE = ico(`<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>`);
const BANK = ico(`<path d="M3 10l9-6 9 6"/><path d="M5 10v9"/><path d="M19 10v9"/><path d="M3 19h18"/>`);

const method = (icon, name, note, selected, badge) => `      <div style="background: ${selected ? "#faf8ff" : "#fff"}; border: ${selected ? "2px solid #7c3aed" : "1.5px solid #ece9f6"}; border-radius: 15px; padding: 13px 14px; display: flex; align-items: center; gap: 12px">
        <div style="width: 36px; height: 36px; border-radius: 11px; background: #f2f1f8; display: flex; align-items: center; justify-content: center; flex-shrink: 0">${icon}</div>
        <div style="flex: 1; min-width: 0">
          <div style="display: flex; align-items: center; gap: 7px">
            <span style="font-size: 13px; font-weight: 800">${name}</span>
            ${badge ? `<span style="font-size: 10px; font-weight: 800; background: #dcfce7; color: #15803d; border-radius: 20px; padding: 2px 8px">${badge}</span>` : ""}
          </div>
          <div style="font-size: 11.5px; color: #6b6478; margin-top: 2px">${note}</div>
        </div>
        <div style="width: 17px; height: 17px; border-radius: 50%; border: ${selected ? "5px solid #7c3aed" : "1.5px solid #ddd9e8"}; flex-shrink: 0"></div>
      </div>
`;

// ---- Payment -------------------------------------------------------------
writeFileSync("Payment.dc.html", head + `<div dir="rtl" style="width: 390px; height: 844px; background: #f7f7fb; color: #16131f; overflow: hidden; display: flex; flex-direction: column">
${hdr("الدفع", "المبلغ بالدينار الليبي — اختر طريقتك.")}
  <div style="flex: 1; padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; overflow: hidden">

    <div style="background: #fff; border-radius: 18px; padding: 16px; box-shadow: 0 2px 10px rgba(22,19,31,0.05); display: flex; align-items: center; justify-content: space-between">
      <div>
        <div style="font-size: 11.5px; color: #6b6478; margin-bottom: 3px">المبلغ المستحق</div>
        <div style="font-size: 11px; color: #8b849c">٥ أصناف · الشحن إلى ليبيا يُحسب لاحقًا</div>
      </div>
      <div style="text-align: left">
        <div style="font-size: 26px; font-weight: 900; letter-spacing: -0.8px; line-height: 1">1,064</div>
        <div style="font-size: 11px; color: #6b6478">د.ل</div>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 9px">
${method(WALLET, "محفظتي", "الرصيد 2,400 د.ل — بلا رمز تحقق", true, "الأسرع")}${method(PHONE, "موبي كاش", "بطاقة مصرف الوحدة — برمز تحقق", false, "")}${method(BANK, "معاملات", "بطاقة مصرفية — نافذة آمنة", false, "")}    </div>

    <div style="background: #fff; border-radius: 16px; padding: 13px 15px; border: 1.5px solid #ece9f6">
      <div style="display: flex; align-items: center; gap: 9px; margin-bottom: 7px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
        <span style="font-size: 12.5px; font-weight: 800">عنوان الاستلام</span>
      </div>
      <div style="font-size: 12px; color: #4a4557; line-height: 1.85">بنغازي — الكيش<br><span style="color: #8b849c">قرب مسجد الرحمة · موقع محدّد على الخريطة</span></div>
    </div>
  </div>

  <div style="padding: 12px 20px 22px; background: #fff; box-shadow: 0 -4px 20px rgba(22,19,31,0.06); flex-shrink: 0">
    <button style="width: 100%; padding: 16px; background: #0f766e; color: #fff; border: none; border-radius: 14px; font-size: 15px; font-weight: 800; font-family: inherit; cursor: pointer; box-shadow: 0 6px 18px rgba(15,118,110,0.28)">ادفع من المحفظة · 1,064 د.ل</button>
  </div>
</div>
` + tail);

// ---- Orders --------------------------------------------------------------
const order = (num, status, color, bg, price, when, items, pay, addr, thumb) => `      <div style="background: #fff; border-radius: 18px; padding: 13px; box-shadow: 0 2px 10px rgba(22,19,31,0.05); display: flex; gap: 12px">
        <div style="width: 62px; height: 62px; border-radius: 13px; background: ${thumb}; flex-shrink: 0"></div>
        <div style="flex: 1; min-width: 0">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px">
            <span style="font-size: 11px; color: #8b849c; font-family: ui-monospace, monospace">#${num}</span>
            <span style="font-size: 10.5px; font-weight: 800; color: ${color}; background: ${bg}; border-radius: 20px; padding: 3px 10px">${status}</span>
          </div>
          <div style="display: flex; align-items: baseline; gap: 5px; margin-top: 5px">
            <span style="font-size: 18px; font-weight: 900; letter-spacing: -0.4px">${price}</span>
            <span style="font-size: 11px; color: #8b849c">د.ل</span>
          </div>
          <div style="font-size: 11px; color: #6b6478; line-height: 1.9; margin-top: 4px">${when} · ${items} صنف · ${pay}<br>${addr}</div>
        </div>
      </div>
`;

const navItem = (path, label, on) => `    <div style="display: flex; flex-direction: column; align-items: center; gap: 3px; color: ${on ? "#7c3aed" : "#8b849c"}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${on ? 2 : 1.8}" stroke-linecap="round" stroke-linejoin="round">${path}</svg>
      <span style="font-size: 10px; ${on ? "font-weight: 800" : ""}">${label}</span>
    </div>
`;

writeFileSync("Orders.dc.html", head + `<div dir="rtl" style="width: 390px; height: 844px; background: #f7f7fb; color: #16131f; overflow: hidden; display: flex; flex-direction: column">
${hdr("طلباتي", "كل طلب بتفاصيله — من السلة إلى التسليم.")}
  <div style="flex: 1; padding: 18px 20px; display: flex; flex-direction: column; gap: 11px; overflow: hidden">

    <div style="display: flex; gap: 7px">
      <span style="font-size: 11.5px; font-weight: 800; background: #16131f; color: #fff; border-radius: 20px; padding: 6px 14px">الكل · ٣</span>
      <span style="font-size: 11.5px; font-weight: 600; background: #fff; color: #6b6478; border-radius: 20px; padding: 6px 14px; border: 1px solid #ece9f6">قيد المعالجة</span>
      <span style="font-size: 11.5px; font-weight: 600; background: #fff; color: #6b6478; border-radius: 20px; padding: 6px 14px; border: 1px solid #ece9f6">منجزة</span>
    </div>

${order("7f5fb334", "في الشحن", "#1d4ed8", "#eff6ff", "1,064", "١٣ سبتمبر", "٥", "المحفظة", "بنغازي — الكيش", "linear-gradient(135deg,#2f3540,#4a5260)")}${order("32eb433a", "قيد المعالجة", "#b45309", "#fffbeb", "778", "١٢ سبتمبر", "٣", "موبي كاش", "بنغازي — قاريونس", "linear-gradient(135deg,#6b4a55,#8d6270)")}${order("a41c9b70", "تم التسليم", "#15803d", "#f0fdf4", "1,490", "٨ سبتمبر", "١١", "معاملات", "بنغازي — الكيش", "linear-gradient(135deg,#4a4257,#665c78)")}  </div>

  <div style="background: #fff; border-top: 1px solid #ece9f6; padding: 10px 20px 22px; display: flex; justify-content: space-around; flex-shrink: 0">
${navItem(`<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>`, "طلب جديد", false)}${navItem(`<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/>`, "طلباتي", true)}${navItem(`<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/>`, "المحفظة", false)}${navItem(`<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"/>`, "حسابي", false)}  </div>
</div>
` + tail);

console.log("wrote Payment.dc.html and Orders.dc.html");
