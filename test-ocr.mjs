import Tesseract from "tesseract.js";

async function ocr(imgPath, label) {
  const { data: { text } } = await Tesseract.recognize(imgPath, "eng+ara");

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  let labelFound = false;
  let p = null;

  for (let i = 0; i < lines.length; i++) {
    const isLabel =
      /estim.{0,8}price/i.test(lines[i]) ||
      /السعر.{0,8}المقدر/.test(lines[i]);
    if (!isLabel) continue;

    labelFound = true;
    const win = lines.slice(i, i + 4).join(" ");
    const m = win.match(/\$\s*([\d,]+\.?\d*)/) ||
              win.match(/\bS\s*([\d,]+\.\d{2})\b/);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ""));
      if (val >= 0.5 && val <= 9999) p = val;
    }
    break;
  }

  console.log("─────────────────────────────────────────");
  console.log("TEST:", label);
  console.log("Label found:", labelFound, "| $ price found:", p);
  if (!labelFound)    console.log("RESULT: ⚠️  لم يُعثر على Estimated Price");
  else if (!p)        console.log("RESULT: ❌ رُفض — لا يوجد رمز $ (عملة خاطئة أو OCR خاطئ)");
  else                console.log("RESULT: ✅ السعر:", p, "$");

  const rel = lines.filter(l => /estim|price|\$|aed|sar/i.test(l) || /السعر|المقدر/.test(l));
  if (rel.length) console.log("OCR relevant lines:", rel);
}

await ocr("/tmp/shein-usd.png",     "USD بالدولار          ← يجب القبول");
await ocr("/tmp/shein-aed.png",     "AED بالدرهم           ← يجب الرفض");
await ocr("/tmp/shein-nolabel.png", "بدون Estimated Price  ← يجب التحذير");
