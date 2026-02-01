export default function WeekMiniCalendar({ selectedDateStr }) {
  // 지금은 UI 자리만. 나중에 “주 단위/월간 전환” 컴포넌트로 확장
  return (
    <div className="border rounded p-3">
      <div className="text-sm font-semibold">주간 캘린더</div>
      <div className="text-sm text-neutral-500">선택 날짜: {selectedDateStr}</div>
    </div>
  );
}
