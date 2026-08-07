import Image from "next/image";
import type { ReactElement } from "react";

import { cn } from "@/lib/class-names";

export type BrandLogoSize = "compact" | "default";
export type BrandLogoTone = "brand" | "monochrome";

type BrandLogoProps = Readonly<{
  className?: string;
  priority?: boolean;
  size?: BrandLogoSize;
  tone?: BrandLogoTone;
}>;

type LogoSizeStyle = Readonly<{
  imageClassName: string;
  imageSize: number;
  wordmarkClassName: string;
}>;

const LOGO_SIZE_STYLES: Readonly<Record<BrandLogoSize, LogoSizeStyle>> = {
  compact: {
    imageClassName: "size-7",
    imageSize: 28,
    wordmarkClassName: "text-xl",
  },
  default: {
    imageClassName: "size-10",
    imageSize: 40,
    wordmarkClassName: "text-[1.75rem]",
  },
};

const LOGO_SOURCES: Readonly<Record<BrandLogoTone, string>> = {
  brand: "/brand/brand-symbol-primary.png",
  monochrome: "/brand/brand-symbol-monochrome.png",
};

export function BrandLogo({
  className,
  priority = false,
  size = "default",
  tone = "brand",
}: BrandLogoProps): ReactElement {
  const sizeStyle = LOGO_SIZE_STYLES[size];

  return (
    <span
      aria-label="챙김"
      className={cn("inline-flex items-center gap-2", className)}
      role="img"
    >
      <Image
        alt=""
        aria-hidden="true"
        className={cn("object-contain", sizeStyle.imageClassName)}
        height={sizeStyle.imageSize}
        priority={priority}
        src={LOGO_SOURCES[tone]}
        width={sizeStyle.imageSize}
      />
      <span
        aria-hidden="true"
        className={cn(
          "font-semibold leading-none tracking-[-0.045em]",
          sizeStyle.wordmarkClassName,
          tone === "brand" ? "text-[var(--brand-cornflower)]" : "text-foreground",
        )}
      >
        챙김
      </span>
    </span>
  );
}
