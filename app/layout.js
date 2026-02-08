import "./global.css";
import "../util/style/theme.css";

export const metadata = {
  title: "SNU Study MVP",
  description: "MVP hackathon",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
