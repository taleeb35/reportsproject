import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

type ContentItem = {
  id: string;
  content_type: "pdf" | "flipbook" | "youtube";
  year: number;
  title: string;
  english_pdf_url?: string;
  arabic_pdf_url?: string;
  english_flipbook_url?: string;
  arabic_flipbook_url?: string;
  youtube_url?: string;
  cover_image_url?: string;
};

const Content = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [years, setYears] = useState<number[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [items, selectedYear, selectedType, sortOrder]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("content_items")
        .select("*");

      if (error) throw error;

      const validItems = (data || []).filter((item: ContentItem) => {
        if (item.content_type === "pdf") {
          return item.english_pdf_url || item.arabic_pdf_url;
        } else if (item.content_type === "flipbook") {
          return item.english_flipbook_url || item.arabic_flipbook_url;
        } else if (item.content_type === "youtube") {
          return item.youtube_url && item.cover_image_url;
        }
        return false;
      });

      setItems(validItems);

      // Extract unique years
      const uniqueYears = [...new Set(validItems.map((item: ContentItem) => item.year))].sort((a, b) => b - a);
      setYears(uniqueYears);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortItems = () => {
    let filtered = [...items];

    // Filter by year
    if (selectedYear !== "all") {
      filtered = filtered.filter((item) => item.year.toString() === selectedYear);
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((item) => item.content_type === selectedType);
    }

    // Sort by date
    filtered.sort((a, b) => {
      if (sortOrder === "latest") {
        return b.year - a.year;
      } else {
        return a.year - b.year;
      }
    });

    // When "All Types", separate non-YouTube from YouTube
    if (selectedType === "all") {
      const nonYouTube = filtered.filter((item) => item.content_type !== "youtube");
      const youTube = filtered.filter((item) => item.content_type === "youtube");
      filtered = [...nonYouTube, ...youTube];
    }

    setFilteredItems(filtered);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : "";
  };

  const handleVideoPlay = (videoUrl: string) => {
    setCurrentVideo(videoUrl);
  };

  const renderContentItem = (item: ContentItem) => {
    const isYouTube = item.content_type === "youtube";
    const hasEnglish = item.english_pdf_url || item.english_flipbook_url;
    const hasArabic = item.arabic_pdf_url || item.arabic_flipbook_url;
    const hasBothLanguages = hasEnglish && hasArabic;
    const hasSingleLanguage = (hasEnglish && !hasArabic) || (!hasEnglish && hasArabic);

    return (
      <div
        key={item.id}
        className={`group relative ${
          isYouTube ? "col-span-1 md:col-span-4" : "col-span-1 md:col-span-3"
        }`}
      >
        <div className="relative overflow-hidden rounded-lg bg-muted aspect-[3/4]">
          {isYouTube ? (
            currentVideo === item.youtube_url ? (
              <iframe
                className="w-full h-full"
                src={getYouTubeEmbedUrl(item.youtube_url!)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div
                className="relative w-full h-full cursor-pointer"
                onClick={() => handleVideoPlay(item.youtube_url!)}
              >
                <img
                  src={item.cover_image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white ml-1" fill="white" />
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="relative w-full h-full">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-6xl font-bold text-primary/20">{item.year}</div>
              </div>
              
              {hasSingleLanguage && (
                <a
                  href={
                    item.content_type === "pdf"
                      ? (item.english_pdf_url || item.arabic_pdf_url)
                      : (item.english_flipbook_url || item.arabic_flipbook_url)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/60 transition-colors group"
                >
                  <span className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    View/Download
                  </span>
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2">{item.title}</h3>
          
          {hasBothLanguages && !isYouTube && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                asChild
                className="flex-1"
              >
                <a
                  href={
                    item.content_type === "pdf"
                      ? item.english_pdf_url
                      : item.english_flipbook_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  EN
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="flex-1"
              >
                <a
                  href={
                    item.content_type === "pdf"
                      ? item.arabic_pdf_url
                      : item.arabic_flipbook_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AR
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="bg-red-600 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white">Content Library</h1>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-wrap gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="flipbook">Interactive Report</SelectItem>
              <SelectItem value="youtube">Video Report</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No content found matching your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {filteredItems.map(renderContentItem)}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Content;
