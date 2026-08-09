import type { Metadata } from "next";

import { getPublicEnv } from "@/lib/env/public";

import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

const { NEXT_PUBLIC_APP_URL } = getPublicEnv();

export const metadata: Metadata = {
  metadataBase: new URL(NEXT_PUBLIC_APP_URL),
  title: "챙김 | 정책은 복잡해도, 챙기는 일은 쉽게",
  description:
    "나에게 필요한 청년 정책을 찾고, 신청 과정과 다음 행동을 한곳에서 관리하세요.",
  openGraph: {
    description:
      "나에게 필요한 청년 정책을 찾고, 신청 과정과 다음 행동을 한곳에서 관리하세요.",
    images: [
      {
        alt: "정책은 복잡해도, 챙기는 일은 쉽게.",
        height: 910,
        url: "/og.png",
        width: 1729,
      },
    ],
    locale: "ko_KR",
    title: "챙김 | 정책은 복잡해도, 챙기는 일은 쉽게",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "나에게 필요한 청년 정책을 찾고, 신청 과정과 다음 행동을 한곳에서 관리하세요.",
    images: ["/og.png"],
    title: "챙김 | 정책은 복잡해도, 챙기는 일은 쉽게",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
