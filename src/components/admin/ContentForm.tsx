import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import type { ContentItem } from "./ContentManager";
import { CONTENT_TYPE_LABELS } from "@/lib/contentTypeLabels";

type ContentFormProps = {
  item: ContentItem | null;
  onClose: () => void;
};

const MAX_VIDEO_SIZE_MB = 300;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const ContentForm = ({ item, onClose }: ContentFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [contentType, setContentType] = useState<"pdf" | "flipbook" | "youtube">(item?.content_type || "flipbook");
  const [title, setTitle] = useState(item?.title || "");
  const [year, setYear] = useState<string>((item?.year?.toString()) || new Date().getFullYear().toString());
  
  // Image field for all types
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState(item?.cover_image_url || "");
  
  // PDF fields (legacy - only preserved when editing existing PDF records)
  const [englishPdfUrl] = useState(item?.english_pdf_url || "");
  const [arabicPdfUrl] = useState(item?.arabic_pdf_url || "");
  
  // Flipbook fields
  const [englishFlipbookUrl, setEnglishFlipbookUrl] = useState(item?.english_flipbook_url || "");
  const [arabicFlipbookUrl, setArabicFlipbookUrl] = useState(item?.arabic_flipbook_url || "");
  
  // Video fields (replacing YouTube URL)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState(item?.youtube_url || "");

  const uploadFileWithProgress = async (file: File, path: string): Promise<string> => {
    setUploadingFileName(file.name);
    setUploadProgress(0);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    
    if (!accessToken) throw new Error("Not authenticated");

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const bucketName = "content-files";
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${path}`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(path);
          setUploadProgress(100);
          resolve(publicUrl);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText || 'Unknown error'}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed due to network error"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload was aborted"));
      });

      xhr.open("POST", uploadUrl, true);
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      xhr.setRequestHeader("x-upsert", "true");
      xhr.send(file);
    });
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    // Use progress upload for large files (> 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return uploadFileWithProgress(file, path);
    }
    
    const { data, error } = await supabase.storage
      .from("content-files")
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("content-files")
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        toast({
          title: "File too large",
          description: `Video file must be less than ${MAX_VIDEO_SIZE_MB}MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const yearValue = parseInt(year, 10);
      if (isNaN(yearValue) || yearValue < 1900 || yearValue > 2100) {
        throw new Error("Please enter a valid year between 1900 and 2100");
      }

      let dataToSave: any = {
        content_type: contentType,
        year: yearValue,
        title,
        category_id: null,
        created_by: user.id,
      };

      // Handle cover image upload (for all types)
      if (coverImageFile) {
        const url = await uploadFile(coverImageFile, `covers/${Date.now()}_${coverImageFile.name}`);
        dataToSave.cover_image_url = url;
      } else if (item && coverImageUrl) {
        dataToSave.cover_image_url = coverImageUrl;
      }

      // Handle file uploads and URLs based on content type
      if (contentType === "pdf") {
        // Legacy: preserve existing PDF URLs when editing old records
        if (item) {
          dataToSave.english_pdf_url = englishPdfUrl;
          dataToSave.arabic_pdf_url = arabicPdfUrl;
        }
      } else if (contentType === "flipbook") {
        dataToSave.english_flipbook_url = englishFlipbookUrl || null;
        dataToSave.arabic_flipbook_url = arabicFlipbookUrl || null;
      } else if (contentType === "youtube") {
        // Handle video file upload
        if (videoFile) {
          const url = await uploadFile(videoFile, `videos/${Date.now()}_${videoFile.name}`);
          dataToSave.youtube_url = url;
        } else if (item) {
          dataToSave.youtube_url = videoUrl;
        }
      }

      if (item) {
        const { error } = await supabase
          .from("content_items")
          .update(dataToSave)
          .eq("id", item.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("content_items")
          .insert([dataToSave]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Content ${item ? "updated" : "created"} successfully`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{item ? "Edit" : "Add"} Content</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contentType">Content Type</Label>
            <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flipbook">{CONTENT_TYPE_LABELS.Flipbook}</SelectItem>
                <SelectItem value="youtube">{CONTENT_TYPE_LABELS.YouTube}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              min="1900"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="coverImage">Cover Image</Label>
            <Input
              id="coverImage"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
            />
            {coverImageUrl && !coverImageFile && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">Current image:</p>
                <img src={coverImageUrl} alt="Cover preview" className="max-w-xs h-32 object-cover rounded border" />
              </div>
            )}
          </div>

          {contentType === "pdf" && (
            <div className="rounded border border-dashed p-3 text-sm text-muted-foreground">
              This is a legacy PDF report. Existing files are preserved:
              {englishPdfUrl && (
                <a href={englishPdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                  View English PDF
                </a>
              )}
              {arabicPdfUrl && (
                <a href={arabicPdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                  View Arabic PDF
                </a>
              )}
            </div>
          )}

          {contentType === "flipbook" && (
            <>
              <div>
                <Label htmlFor="englishFlipbook">English Flipbook URL</Label>
                <Input
                  id="englishFlipbook"
                  type="url"
                  value={englishFlipbookUrl}
                  onChange={(e) => setEnglishFlipbookUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="arabicFlipbook">Arabic Flipbook URL</Label>
                <Input
                  id="arabicFlipbook"
                  type="url"
                  value={arabicFlipbookUrl}
                  onChange={(e) => setArabicFlipbookUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {contentType === "youtube" && (
            <div>
              <Label htmlFor="videoFile">Video File (Max {MAX_VIDEO_SIZE_MB}MB)</Label>
              <Input
                id="videoFile"
                type="file"
                accept="video/*"
                onChange={handleVideoFileChange}
              />
              {videoFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)}MB)
                </p>
              )}
              {videoUrl && !videoFile && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">Current video:</p>
                  <video 
                    src={videoUrl} 
                    className="max-w-xs h-32 object-cover rounded border"
                    controls
                  />
                </div>
              )}
            </div>
          )}

          {loading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Uploading: {uploadingFileName}
                </span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : item ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContentForm;
