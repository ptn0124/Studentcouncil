export default function Layout({ children }: { children: React.ReactNode }) {
  return <main className="max-w-[1280px] mx-auto px-4 md:px-8">{children}</main>;
}
