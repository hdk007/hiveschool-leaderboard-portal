"use client";

import * as React from "react";
import { cn, initials, colorFromString } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

/**
 * Avatar with graceful fallback to colored initials when no image is set or the
 * image fails to load. Uses a plain <img> (not next/image) so arbitrary remote
 * hosts work without config — acceptable for small avatars.
 */
export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const showImage = src && !errored;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white shadow-soft dark:ring-card",
        className
      )}
      style={{ width: size, height: size, backgroundColor: colorFromString(name) }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="font-semibold text-white"
          style={{ fontSize: size * 0.4 }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
