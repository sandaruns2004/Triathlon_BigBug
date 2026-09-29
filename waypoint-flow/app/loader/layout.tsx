import { LoaderShell } from "@/components/layout/LoaderShell";

export default function LoaderLayout({ children }: { children: React.ReactNode }) {
  return <LoaderShell>{children}</LoaderShell>;
}
