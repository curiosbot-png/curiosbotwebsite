"use client";
export function CookieSettingsButton() {
  return <button type="button" className="hover:text-white" onClick={() => window.dispatchEvent(new Event("cb:open-consent"))}>Privacy choices</button>;
}
