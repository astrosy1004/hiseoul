export const metadata = { title: "하이서울 관리자", robots: { index: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div lang="ko">{children}</div>;
}
