"use client";
import { useState, useCallback } from "react";
import Image from "next/image";

interface Props {
  images: string[];
  alt: string;
  emoji?: string;
  aspectRatio?: "video" | "square" | "4/3";
}

export default function ImageSlider({ images, alt, emoji = "📦", aspectRatio = "4/3" }: Props) {
  const [current, setCurrent] = useState(0);
  const [loaded,  setLoaded]  = useState<boolean[]>(images.map(() => false));

  const prev = useCallback(() => setCurrent(c => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent(c => (c + 1) % images.length), [images.length]);

  const aspectClass = {
    video:   "aspect-video",
    square:  "aspect-square",
    "4/3":   "aspect-[4/3]",
  }[aspectRatio];

  // Tidak ada gambar → tampilkan emoji placeholder
  if (!images.length) {
    return (
      <div className={`${aspectClass} bg-indigo-50 rounded-xl flex items-center justify-center text-6xl border border-indigo-100`}>
        {emoji}
      </div>
    );
  }

  // Satu gambar → langsung tampil tanpa nav
  if (images.length === 1) {
    return (
      <div className={`relative ${aspectClass} overflow-hidden rounded-xl bg-gray-100`}>
        <Image
          src={images[0]} alt={alt} fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 50vw"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main image */}
      <div className={`relative ${aspectClass} overflow-hidden rounded-xl bg-gray-100 group`}>
        {images.map((src, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-400 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <Image
              src={src} alt={`${alt} ${i + 1}`} fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
              onLoad={() => setLoaded(l => { const n=[...l]; n[i]=true; return n; })}
              priority={i === 0}
            />
            {!loaded[i] && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center text-4xl">{emoji}</div>
            )}
          </div>
        ))}

        {/* Nav arrows */}
        <button onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
          ‹
        </button>
        <button onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
          ›
        </button>

        {/* Counter badge */}
        <div className="absolute bottom-2 right-2 z-20 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
          {current + 1}/{images.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
              i === current ? "border-indigo-500 opacity-100" : "border-transparent opacity-60 hover:opacity-80"
            }`}
          >
            <Image
              src={src} alt={`thumb ${i + 1}`} fill
              className="object-cover"
              sizes="56px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
