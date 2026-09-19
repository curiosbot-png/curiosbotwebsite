import { ChannelPage } from "@/components/admin/ChannelPage";
export const metadata = { title: "Social" };
export default function Social() {
  return <ChannelPage title="Social" sub="LinkedIn, YouTube, Instagram and Facebook: generate → review → approve → schedule/publish. Publishing uses each platform's official API through n8n." keys={["linkedin", "youtube", "instagram", "facebook"]}
    gates={["Posts are generated as drafts in AI Studio and are never posted without explicit approval.", "Only officially supported APIs are used; a channel stays unavailable until its OAuth connection is authorised by an owner.", "Instagram/Facebook publishing requires a Meta Business account; YouTube upload requires channel authorisation. Marketing must confirm platform terms before automation is enabled."]} actions={[["/ai-studio/content", "Generate social content"]]} />;
}
