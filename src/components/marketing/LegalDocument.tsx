import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PublicPageLayout } from "@/components/marketing/PublicPageLayout";

type LegalDocumentProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalDocument({ title, description, children }: LegalDocumentProps) {
  return (
    <PublicPageLayout title={title} description={description}>
      <Alert className="mb-8">
        <AlertTitle>Pre-launch legal review required</AlertTitle>
        <AlertDescription>
          This policy is a product template and must be reviewed by qualified counsel and completed with the business
          entity, address, governing law, and effective date before production launch.
        </AlertDescription>
      </Alert>
      <article className="space-y-8 text-sm leading-6 text-muted-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </article>
    </PublicPageLayout>
  );
}
