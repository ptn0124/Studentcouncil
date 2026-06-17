import "./globals.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <main className="max-w-[1280px] mx-auto px-4 md:px-8">{children}</main>
      </body>
    </html>
  );
}
