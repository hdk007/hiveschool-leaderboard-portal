"use client";

import * as React from "react";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  className?: string;
  shape?: "circle" | "square";
}

/**
 * Uploads an image to Supabase Storage (admin-only via RLS) and returns the
 * generated public URL. Also accepts a pasted URL for flexibility.
 */
export function ImageUpload({ value, onChange, bucket = "student-images", className, shape = "circle" }: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      setUploading(true);
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "relative flex size-20 items-center justify-center overflow-hidden border border-border bg-secondary",
            shape === "circle" ? "rounded-full" : "rounded-xl"
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="preview" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-0 top-0 rounded-bl-lg bg-destructive/90 p-1 text-white"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? "Uploading…" : "Upload"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-muted-foreground">PNG / JPG, stored in Supabase Storage.</p>
        </div>
      </div>

      <Input
        placeholder="…or paste an image URL"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
    </div>
  );
}
