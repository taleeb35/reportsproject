import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Play } from "lucide-react";
import Header from "@/components/Header";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import reportsBanner from "@/assets/reports-banner.png";
import { CONTENT_TYPE_LABELS } from "@/lib/contentTypeLabels";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type ContentItem = {
  id: string;
  title: string;
  year: number;
  content_type: string;
  cover_image_url?: string;
  category_id?: string;
  category_name?: string;
  youtube_url?: string;
  english_pdf_url?: string;
  arabic_pdf_url?: string;
  english_flipbook_url?: string;
  arabic_flipbook_url?: string;
  created_at: string;
};

type ContentCategory = {
  id: string;
  name: string;
};

const Reports = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("latest"); // Default is "latest"
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 18;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch content items
      const { data: itemsData } = await supabase
        .from("content_items")
        .select("*");
      
      setItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedItems = items
    .filter(item => {
      if (filterType !== "all" && item.content_type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      // --- START: UPDATED SORTING LOGIC ---
      if (sortOrder === "latest") {
        // Sort by year in descending order (newest first: 2025 -> 2017)
        return b.year - a.year;
      } else if (sortOrder === "oldest") {
        // Sort by year in ascending order (oldest first: 2017 -> 2025)
        return a.year - b.year;
      }
      return 0; // Fallback, should not happen
      // --- END: UPDATED SORTING LOGIC ---
    });

  const totalPages = Math.ceil(filteredAndSortedItems.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

  const resetFilters = () => {
    setFilterType("all");
    setSortOrder("latest");
    setCurrentPage(1);
  };

  const handleVideoClick = (videoUrl: string) => {
    setSelectedVideo(videoUrl);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  const handleItemClick = (item: ContentItem) => {
    if (item.content_type === "youtube" && item.youtube_url) {
      handleVideoClick(item.youtube_url);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Banner Section */}
      <section className="w-full border-b-2 border-blue-500 reportsBanner">
        <img src={reportsBanner} alt="Reports Banner" className="w-full h-auto" />
      </section>

      {/* Filter Section */}
      <section className="py-8 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Counter */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500 text-white px-4 py-1 rounded text-sm font-semibold">
              {filteredAndSortedItems.length} Results (Page {currentPage} of {totalPages || 1})
            </div>
            
          </div>

          {/* Filter Title */}
          <h3 className="text-lg font-bold mb-4">Filter Content by:</h3>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-8">
            <div>
              <label className="block text-sm font-semibold mb-2">Type</label>
              <Select value={filterType} onValueChange={(value) => { setFilterType(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">{CONTENT_TYPE_LABELS.PDF}</SelectItem>
                  <SelectItem value="flipbook">{CONTENT_TYPE_LABELS.Flipbook}</SelectItem>
                  <SelectItem value="youtube">{CONTENT_TYPE_LABELS.YouTube}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Sort By</label>
              <Select value={sortOrder} onValueChange={(value) => { setSortOrder(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button 
                onClick={resetFilters}
                className="w-full bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-white rounded-full"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Report Grid */}
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No content found matching your filters.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 reports_div">
                {paginatedItems.map((item) => {
                const isYouTube = item.content_type === "youtube";
                const aspectClass = isYouTube ? "aspect-video" : "aspect-[3/4]";
                const enUrl = item.english_pdf_url || item.english_flipbook_url || null;
                const arUrl = item.arabic_pdf_url || item.arabic_flipbook_url || null;
                
                return (
                  <div key={item.id} className="flex flex-col">
                    <div 
                      className={`group ${aspectClass} bg-gray-200 rounded-lg hover:shadow-xl transition-all overflow-hidden relative ${isYouTube ? 'cursor-pointer' : ''}`}
                      {...(isYouTube ? { 
                        onClick: () => handleItemClick(item),
                        role: "button",
                        "aria-label": `Play ${item.title}`
                      } : {})}
                    >
                      {item.cover_image_url ? (
                        <img 
                          src={item.cover_image_url} 
                          alt={`${item.title} cover image`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                          <span className="text-gray-600 text-sm">No image</span>
                        </div>
                      )}
                      
                      {/* Play button overlay for YouTube videos only */}
                      {isYouTube && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-red-600 fill-red-600 ml-1" />
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                        <h3 className="text-white font-semibold text-sm line-clamp-2">{item.title}</h3>
                      </div>
                    </div>

                    {/* Language links below image for PDFs/Flipbooks */}
                    {(item.content_type === "pdf" || item.content_type === "flipbook") && (enUrl || arUrl) && (
                      <div className="flex justify-center items-center gap-2 text-sm font-semibold mt-2">
                        {enUrl && (
                          <a
                            href={enUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[hsl(var(--accent))] hover:underline"
                            aria-label={`Open English ${item.content_type}`}
                          >
                            EN
                          </a>
                        )}
                        {enUrl && arUrl && <span className="text-gray-400">|</span>}
                        {arUrl && (
                          <a
                            href={arUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[hsl(var(--accent))] hover:underline"
                            aria-label={`Open Arabic ${item.content_type}`}
                          >
                            AR
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
          )}
        </div>
      </section>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && handleCloseVideo()}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black full_pop_video">
          <DialogTitle className="sr-only">Video Player</DialogTitle>
          <div className="w-full aspect-video new_dim">
            {selectedVideo && (
              <video
                key={selectedVideo}
                src={selectedVideo}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Reports;
