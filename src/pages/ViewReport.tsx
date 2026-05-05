import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ViewReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("Report");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;

      const { data } = await supabase
        .from("content_items")
        .select("english_pdf_url, arabic_pdf_url, english_flipbook_url, arabic_flipbook_url, title")
        .eq("id", id)
        .single();

      if (!data) {
        navigate("/reports", { replace: true });
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const lang = params.get("lang") || "en";

      const url =
        lang === "ar"
          ? data.arabic_pdf_url || data.arabic_flipbook_url
          : data.english_pdf_url || data.english_flipbook_url;

      if (url) {
        setTitle(data.title || "Report");
        setPdfUrl(url);
      } else {
        navigate("/reports", { replace: true });
      }
      setLoading(false);
    };

    fetchReport();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading report...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <iframe
        src={pdfUrl || ""}
        title={title}
        className="w-full flex-1 border-0"
        style={{ minHeight: "100vh" }}
      />
    </div>
  );
};

export default ViewReport;
