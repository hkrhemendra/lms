"use client";

import { useState } from "react";
import Image from "next/image";
import { CATEGORY_GRADIENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BookCover({
  title,
  category,
  coverImage,
  className,
}: {
  title: string;
  category?: string;
  coverImage?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
  const index = (category ?? title).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];

  if (coverImage && !failed) {
    return (
      <Image
        src={coverImage}
        alt={`${title} cover`}
        width={240}
        height={320}
        unoptimized
        onError={() => setFailed(true)}
        className={cn("aspect-[3/4] w-full rounded-xl object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex aspect-[3/4] w-full items-end rounded-xl bg-gradient-to-br p-3 text-white shadow-sm",
        gradient,
        className,
      )}
      aria-hidden={!title}
    >
      <span className="text-lg font-semibold tracking-wide">{initials || "BK"}</span>
    </div>
  );
}
