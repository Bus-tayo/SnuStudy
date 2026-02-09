export default function FloatingConsultButton() {
  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-0 bottom-0 w-full max-w-[430px] z-[85] pointer-events-none">
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto bottom-[calc(16px+env(safe-area-inset-bottom)+88px)] w-[280px] max-w-[calc(100%-7.5rem)]">
        <a
          href="https://forms.gle/FchKdDcm23JdGHpK9"
          target="_blank"
          rel="noreferrer"
          className="block w-full"
        >
          <div className="w-full text-center py-3 rounded border bg-white shadow-sm font-semibold">
            상담 받아보기
          </div>
        </a>
      </div>
    </div>
  );
}
