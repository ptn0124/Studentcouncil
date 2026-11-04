import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FeedbackProvider } from "@/components/feedback/FeedbackProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex flex-col min-h-screen bg-[#faf8f5] text-[#2c3e50] antialiased">
        <FeedbackProvider>
          <Header />
          <main className="flex-grow max-w-[1280px] w-full mx-auto px-4 md:px-8 py-8">
            {children}
          </main>
          <Footer />
        </FeedbackProvider>
      </body>
    </html>
  );
}

