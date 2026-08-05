"use client";

import { useState } from "react";
import Image from "next/image";

export default function OptionalPublicImage({
  src,
  alt = "",
  width = 64,
  height = 64,
  className = "",
}) {
  const [isMissing, setIsMissing] = useState(false);

  if (isMissing) return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className={className}
      onError={() => setIsMissing(true)}
    />
  );
}
