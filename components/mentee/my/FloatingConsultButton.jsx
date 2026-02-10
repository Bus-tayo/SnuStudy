export default function FloatingConsultButton() {
  return (
    <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom)+75px)] left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 z-[85] pointer-events-none">
      <div className="w-full max-w-[280px] mx-auto pointer-events-auto">
        <a
          href="https://forms.gle/FchKdDcm23JdGHpK9"
          target="_blank"
          rel="noreferrer"
          className="block w-full"
        >
          <div className="w-full text-center py-3 rounded border bg-white shadow-sm font-semibold transition-transform active:scale-95">
            상담 받아보기
          </div>
        </a>
      </div>
    </div>
  );
}
