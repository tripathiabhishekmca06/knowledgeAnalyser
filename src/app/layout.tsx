import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Readiness",
  description: "Measure your government-exam readiness and track improvement."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="brand">Readiness</div>
            <a href="/admin" className="pill">
              Admin
            </a>
          </header>
        </div>
        {children}
      </body>
    </html>
  );
}
