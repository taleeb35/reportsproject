import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ViewReport = () => {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!id) return;

      const { data } = await supabase
        .from("content_items")
        .select("english_pdf_url, arabic_pdf_url, english_flipbook_url, arabic_flipbook_url, title")
        .eq("id", id)
        .single();

      if (!data) {
        window.location.href = "/reports";
        return;
      }

      // Get lang from query params
      const params = new URLSearchParams(window.location.search);
      const lang = params.get("lang") || "en";

      const url =
        lang === "ar"
          ? data.arabic_pdf_url || data.arabic_flipbook_url
          : data.english_pdf_url || data.english_flipbook_url;

      if (url) {
        window.location.href = url;
      } else {
        window.location.href = "/reports";
      }
    };

    fetchAndRedirect();
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Loading report...</p>
    </div>
  );
};

export default ViewReport;
