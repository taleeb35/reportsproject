import { Linkedin, Facebook, Instagram, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import uaeFlag from "@/assets/uae-flag.png";
import ksaFlag from "@/assets/ksa-flag.png";

interface FooterSettings {
  description: string;
  phoneuae: string;
  phoneksa: string;
  email: string;
  addressuae: string;
  addressksa: string;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
}

const Footer = () => {
  const [settings, setSettings] = useState<FooterSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("footer_settings").select("*").single();

      if (data) {
        setSettings(data);
      }
    };

    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("footer_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "footer_settings",
        },
        (payload) => {
          if (payload.new) {
            setSettings(payload.new as FooterSettings);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <footer className="bg-white pt-12 pb-0 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
          {/* Column 1: Logo and Description */}
          <div className="space-y-4">
            <img src={logo} alt="Annual Reports" className="" />
            <p className="text-sm text-gray-700 leading-relaxed">
              {settings?.description ||
                "The Annual Reports, Bespoke data analysis and visual reports for Gulf area governments and corporations since 2010."}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <a href="/privacy-policy" className="hover:text-[hsl(var(--accent))]">
                Privacy Policy
              </a>
              <span>|</span>
              <a href="/privacy-policy" className="hover:text-[hsl(var(--accent))]">
                Terms & Conditions
              </a>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <ul className="space-y-4 text-base">
              <li>
                <a href="/" className="font-bold text-gray-900 hover:text-[hsl(var(--accent))]">
                  Home
                </a>
              </li>
              <li>
                <a href="/reports" className="font-bold text-gray-900 hover:text-[hsl(var(--accent))]">
                  Work
                </a>
              </li>
              <li>
                <a href="/statistics" className="font-bold text-gray-900 hover:text-[hsl(var(--accent))]">
                  Static’s
                </a>
              </li>
              <li>
                <a href="/infographic" className="font-bold text-gray-900 hover:text-[hsl(var(--accent))]">
                  Infographic
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Information */}
          <div>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <img src={uaeFlag} alt="UAE" className="w-6 h-6 rounded object-cover flex-shrink-0 two" />
                <a
                  href={`tel:${settings?.phoneuae || "+971856784543"}`}
                  className="text-base font-semibold text-gray-900 hover:text-[hsl(var(--accent))]"
                >
                  {settings?.phoneuae || "+971856784543"}
                </a>
              </li>

              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <a
                  href={`mailto:${settings?.email || "info@annualreport.net"}`}
                  className="text-base font-semibold text-gray-900 hover:text-[hsl(var(--accent))]"
                >
                  {settings?.email || "info@annualreport.net"}
                </a>
              </li>
              <li className="flex items-start gap-3 align-items-center">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                  </svg>
                </div>
                <span className="text-base font-semibold text-gray-900">
                  {settings?.addressuae || "Business Bay, Dubai, UAE"}
                </span>
              </li>
              <li className="flex items-start gap-3 align-items-center">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                  </svg>
                </div>
                <span className="text-base font-semibold text-gray-900">
                  {settings?.addressksa || "Riyadh, Saudi Arabia"}
                </span>
              </li>
            </ul>

            <div className="flex items-center gap-6 mp-top">
              <a
                href={settings?.linkedin_url || "#"}
                className="w-10 h-10 bg-[hsl(var(--accent))] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="w-5 h-5 text-white" strokeWidth={2.5} />
              </a>
              <a
                href={settings?.facebook_url || "#"}
                className="w-10 h-10 bg-[hsl(var(--accent))] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="w-5 h-5 text-white" strokeWidth={2.5} />
              </a>
              <a
                href={settings?.instagram_url || "#"}
                className="w-10 h-10 bg-[hsl(var(--accent))] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5 text-white" strokeWidth={2.5} />
              </a>
              <a
                href={settings?.youtube_url || "#"}
                className="w-10 h-10 bg-[hsl(var(--accent))] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="YouTube"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube className="w-5 h-5 text-white" strokeWidth={2.5} />
              </a>
            </div>
          </div>

          {/* Column 4: Social Media Icons */}
          <div></div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-gray-300 py-6 text-center">
          <p className="text-sm text-gray-700">@Theannualreports.com - All rights reserved 2026</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
