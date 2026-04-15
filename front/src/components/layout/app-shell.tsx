import { ReactNode } from "react";
import { Footer } from "./footer";
import { Header } from "./header";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f3ea]">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-7 md:px-6 md:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
