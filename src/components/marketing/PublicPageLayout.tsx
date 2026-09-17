import type { ReactNode } from "react";
import { MarketingTopBar } from "@/components/MarketingTopBar";
import { PublicFooter } from "@/components/marketing/PublicFooter";

type PublicPageLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function PublicPageLayout({ title, description, children }: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <MarketingTopBar page="home" />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-lg text-muted-foreground">{description}</p>
        </header>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
