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
        // 이미 로딩됨
        if (img.complete && img.naturalWidth > 0) return;

        // decode 지원
        if (img.decode) {
          await img.decode();
          return;
        }

        // fallback
        await new Promise((res, rej) => {
          img.onload = () => res();
          img.onerror = () => res(); // 깨져도 진행은 하자(전체 실패 방지)
        });
      } catch (_) {}
    })
  );
}

function safeScale(lowRes) {
  // 너무 높으면 메모리/깨짐 이슈 나서 cap 걸기
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
  // 이미지가 조금 늦게 붙는 경우가 있어서 한 박자 쉬어주면 안정성 올라감
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
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      // 일부 브라우저에서 subpixel로 줄 깨지는 것 완화
      foreignObjectRendering: false,
    });

    // 고화질이면 PNG가 글자/선 깨짐이 덜함
    const usePng = !lowRes;
    const imgData = usePng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, usePng ? "PNG" : "JPEG", 0, 0, pageW, pageH, undefined, usePng ? "SLOW" : "FAST");
  }

  pdf.save(filename);
}
