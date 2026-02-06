'use client';

export default function SubjectBadge({ subject, className = '' }) {
  const styles = {
    KOR: "text-subject-kor bg-subject-kor/10 border-subject-kor/20",
    MATH: "text-subject-math bg-subject-math/10 border-subject-math/20",
    ENG: "text-subject-eng bg-subject-eng/10 border-subject-eng/20",
    ETC: "text-subject-etc bg-subject-etc/10 border-subject-etc/20",
  };
  const labels = { KOR: "국어", MATH: "수학", ENG: "영어", ETC: "기타" };

  const styleClass = styles[subject] || styles.ETC;

  return (
    <span className={`badge-base ${styleClass} ${className}`}>
      {labels[subject] || subject}
    </span>
  );
}