import html2canvas from "html2canvas";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForFonts() {
  try {
    if (document?.fonts?.ready) await document.fonts.ready;
  } catch (_) {}
}

async function waitForImages(el) {
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      try {
        if (img.complete && img.naturalWidth > 0) return;
        if (img.decode) {
          await img.decode();
          return;
        }
        await new Promise((res) => {
          img.onload = () => res();
          img.onerror = () => res();
        });
      } catch (_) {}
    })
  );
}

function safeScale(lowRes) {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const base = lowRes ? 1.25 : 2.0;
  return Math.min(2.5, Math.max(base, dpr * (lowRes ? 1.1 : 1.6)));
}

export async function exportPagesToPdf({ pagesHostEl, filename, lowRes = false, onProgress }) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

  const pageEls = Array.from(pagesHostEl.querySelectorAll(".report-page"));
  if (!pageEls.length) throw new Error("렌더링할 페이지가 없습니다.");

  await waitForFonts();
  await sleep(30);

  const scale = safeScale(lowRes);
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pageEls.length; i += 1) {
    onProgress?.(i, pageEls.length);

    await waitForFonts();
    await waitForImages(pageEls[i]);

    const canvas = await html2canvas(pageEls[i], {
      scale,
      backgroundColor: null, // ✅ 페이지 CSS 배경 그대로 사용 (색상코드 하드코딩 제거)
      useCORS: true,
      logging: false,
      foreignObjectRendering: false,
    });

    const usePng = !lowRes;
    const imgData = usePng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, usePng ? "PNG" : "JPEG", 0, 0, pageW, pageH, undefined, usePng ? "SLOW" : "FAST");
  }

  pdf.save(filename);
}
