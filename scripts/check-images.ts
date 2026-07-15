// Dev helper: verifies which candidate Unsplash photo URLs resolve, so the
// seed only references working images. Run: npx tsx scripts/check-images.ts
const candidates = [
  "photo-1490750967868-88aa4486c946",
  "photo-1494972308805-463bc619d34e",
  "photo-1526047932273-341f2a7631f9",
  "photo-1519378058457-4c29a0a2efac",
  "photo-1502977249166-824b3a8a4d6d",
  "photo-1561181286-d3fee7d55364",
  "photo-1487530811176-3780de880c2d",
  "photo-1508610048659-a06b669e3321",
  "photo-1469259943454-aa100abba749",
  "photo-1453747063559-36695c8771bd",
  "photo-1509587584298-0f3b3a3a1797",
  "photo-1518895949257-7621c3c786d7",
  "photo-1471696035578-3d8c78d99684",
  "photo-1522748906645-95d8adfd52c7",
  "photo-1533616688419-b7a585564566",
  "photo-1520763185298-1b434c919102",
  "photo-1455659817273-f96807779a8a",
  "photo-1459156212016-c812468e2115",
  "photo-1513201099705-a9746e1e201f",
  "photo-1511381939415-e44015466834",
  "photo-1549007994-cb92caebd54b",
  "photo-1530103862676-de8c9debad1d",
  "photo-1530325553146-4b70cd0a49d1",
  "photo-1559454403-b8fb88521f11",
  "photo-1578500494198-246f612d3b3d",
  "photo-1563241527-3004b7be0ffd",
  "photo-1587314168485-3236d6710814",
  "photo-1591886960571-74d43a9d4166",
];

async function main() {
  const ok: string[] = [];
  const bad: string[] = [];
  for (const id of candidates) {
    const url = `https://images.unsplash.com/${id}?w=100&q=50`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      (res.ok ? ok : bad).push(id);
    } catch {
      bad.push(id);
    }
  }
  console.log("OK:", JSON.stringify(ok, null, 2));
  console.log("BAD:", JSON.stringify(bad, null, 2));
}

main();
