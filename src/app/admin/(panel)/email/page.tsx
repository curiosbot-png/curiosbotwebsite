import { ChannelPage } from "@/components/admin/ChannelPage";
export const metadata = { title: "Email" };
export default function Email() {
  return <ChannelPage title="Email" sub="Contact confirmations, lead alerts, demo confirmations, product announcements, newsletters, campaigns and nurture sequences — delivered through a proper email delivery provider via n8n." keys={["email"]}
    gates={["Transactional email (confirmations, alerts) is sent by n8n through the delivery provider; marketing email is only sent to contacts with recorded marketing consent.", "Newsletters and campaigns are generated as drafts in AI Studio and require admin approval before n8n sends anything.", "SPF, DKIM and DMARC must be configured for the sending domain before go-live (docs/email-dns.md). Existing Hostinger mailbox records are never modified without a backup."]} actions={[["/ai-studio/content", "Draft a newsletter"]]} />;
}
