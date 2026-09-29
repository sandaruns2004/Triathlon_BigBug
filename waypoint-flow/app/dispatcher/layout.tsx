import { DesktopShell } from "@/components/layout/DesktopShell";

export default function DispatcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DesktopShell>{children}</DesktopShell>;
}
