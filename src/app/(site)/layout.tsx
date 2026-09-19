import { CookieBanner } from "@/components/CookieBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Tracker } from "@/components/Tracker";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CookieBanner policyVersion={SITE.policyVersion} />
      <Tracker />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: SITE.url, logo: SITE.logo,
        email: SITE.email, telephone: SITE.phone, founder: { "@type": "Person", name: SITE.founder },
        address: { "@type": "PostalAddress", addressLocality: "Zaragoza", addressCountry: "ES" },
        description: "AI strategy, PLM and Salesforce consultancy delivering measurable business value.",
      }} />
    </>
  );
}
