import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings } from "@/lib/settings";
import LayoutShell from "@/components/LayoutShell";
import DonateBanner from "@/components/DonateBanner";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();
  return {
    title: {
      default: site.siteName,
      template: `%s | ${site.siteName}`,
    },
    description: site.description,
    ...(site.keywords ? { keywords: site.keywords } : {}),
    ...(site.author ? { authors: [{ name: site.author }] } : {}),
    ...(site.faviconUrl ? { icons: { icon: site.faviconUrl } } : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSiteSettings();

  return (
    <html lang="zh-CN">
      <body>
        <LayoutShell
          site={{
            siteName: site.siteName,
            logoUrl: site.logoUrl,
            description: site.description,
            footerText: site.footerText,
            icp: site.icp,
            contact: site.contact,
          }}
          donate={<DonateBanner />}
        >
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}