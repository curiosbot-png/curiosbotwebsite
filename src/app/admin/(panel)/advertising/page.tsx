import { ChannelPage } from "@/components/admin/ChannelPage";
export const metadata = { title: "Advertising" };
export default function Advertising() {
  return <ChannelPage title="Advertising" sub="Google Ads, LinkedIn Ads and Meta Ads. Spend, CPC, CPL and cost per qualified lead/demo appear in Marketing and Campaigns once a platform is connected." keys={["google_ads", "linkedin_ads", "meta_ads"]}
    gates={["Curiosbot never launches campaigns, changes budgets or spends money automatically. Read-only reporting access is requested first.", "Concept generation (headlines, descriptions, audiences, UTMs, A/B variants) produces drafts only.", "Launching happens in the ad platform by an authorised person."]} actions={[["/ai-studio/content", "Generate ad concepts"], ["/campaigns", "Create campaign + UTMs"]]} />;
}
