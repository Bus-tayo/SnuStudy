"use client";

import { useState } from "react";
import SubjectProgressCards from "./SubjectProgressCards";
import FloatingConsultButton from "./FloatingConsultButton";
import StreakBanner from "@/components/mentee/streak/StreakBanner";
import HeatmapCalendar from "@/components/mentee/heatmap/HeatmapCalendar";
import ProfileCard from "./ProfileCard";
import ReportGeneratorModal from "@/components/mentee/my-page/report/ReportGeneratorModal";

export default function MyPageScreen() {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="p-4 pb-20 space-y-4">
      <ProfileCard />

      <div className="card-base p-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-extrabold">학습 보고서</div>
          <div className="text-xs text-foreground/60 mt-1">
            기간을 지정해 PDF로 다운로드하세요.
          </div>
        </div>

        <button
          onClick={() => setReportOpen(true)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-extrabold"
        >
          보고서 생성
        </button>
      </div>

      <SubjectProgressCards />

      <StreakBanner />
      <HeatmapCalendar />

      <FloatingConsultButton />
      <div style={{ height: "64px" }} />
      <ReportGeneratorModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
