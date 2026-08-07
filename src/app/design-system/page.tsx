import type { Metadata } from "next";
import Image from "next/image";
import type { ReactElement } from "react";
import {
  Bell,
  Bookmark,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileText,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Tag,
  UserRound,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";

import styles from "./design-system.module.css";

export const metadata: Metadata = {
  title: "브랜드 시스템 | 챙김",
  description: "챙김의 Soft Horizon 브랜드 시스템 쇼케이스",
  robots: {
    follow: false,
    index: false,
  },
};

type BrandColor = Readonly<{
  cssValue: string;
  name: string;
  token: string;
}>;

type BrandIcon = Readonly<{
  Icon: typeof Bookmark;
  label: string;
}>;

const BRAND_COLORS: readonly BrandColor[] = [
  { cssValue: "#E6F2FF", name: "Sky Blue", token: "--brand-sky" },
  {
    cssValue: "#4E8AF7",
    name: "Cornflower Blue",
    token: "--brand-cornflower",
  },
  {
    cssValue: "#FAFAF7",
    name: "Warm Off-White",
    token: "--brand-off-white",
  },
  { cssValue: "#DFF3EC", name: "Soft Mint", token: "--brand-mint" },
  {
    cssValue: "#ECEFF3",
    name: "Light Gray",
    token: "--brand-light-gray",
  },
];

const BRAND_ICONS: readonly BrandIcon[] = [
  { Icon: Bookmark, label: "저장" },
  { Icon: Search, label: "검색" },
  { Icon: SlidersHorizontal, label: "필터" },
  { Icon: CalendarDays, label: "마감일" },
  { Icon: Bell, label: "알림" },
  { Icon: FileText, label: "정책" },
  { Icon: MessageCircle, label: "상담" },
  { Icon: UserRound, label: "내 정보" },
];

export default function DesignSystemPage(): ReactElement {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Brand direction · Soft Horizon</p>
            <h1 className={styles.heroTitle}>따뜻하게 챙기고, 분명하게 안내해요.</h1>
            <p className={styles.heroDescription}>
              챙김은 복잡한 정책 정보를 쉽게 정리하고, 지금 필요한 혜택을
              놓치지 않도록 돕는 청년 정책 관리 서비스입니다.
            </p>
          </div>
          <div className={styles.heroMark}>
            <Image
              alt=""
              aria-hidden="true"
              height={320}
              priority
              src="/brand/brand-symbol-primary.png"
              width={320}
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Logo system</p>
            <h2 className={styles.sectionTitle}>손길, 북마크, 체크</h2>
            <p className={styles.sectionDescription}>
              챙겨 둔 혜택을 사용자의 손 안에서 놓치지 않는다는 의미를 하나의
              단순한 심볼로 표현합니다.
            </p>
          </div>
          <div className={styles.logoGrid}>
            <div className={styles.logoSample}>
              <span className={styles.sampleLabel}>Primary lockup</span>
              <BrandLogo priority />
            </div>
            <div className={styles.logoSample}>
              <span className={styles.sampleLabel}>Compact</span>
              <BrandLogo size="compact" />
            </div>
            <div className={styles.logoSample}>
              <span className={styles.sampleLabel}>Monochrome</span>
              <BrandLogo tone="monochrome" />
            </div>
            <div className={styles.logoSample}>
              <span className={styles.sampleLabel}>Minimum sizes</span>
              <div className={styles.iconScale}>
                {[16, 32, 48, 128].map((size) => (
                  <Image
                    alt={`${size}px 챙김 심볼`}
                    height={size}
                    key={size}
                    src="/brand/brand-symbol-primary.png"
                    width={size}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Color palette</p>
            <h2 className={styles.sectionTitle}>밝은 블루와 따뜻한 여백</h2>
          </div>
          <div className={styles.colorGrid}>
            {BRAND_COLORS.map((color) => (
              <article className={styles.swatch} key={color.token}>
                <div
                  aria-label={`${color.name} ${color.cssValue}`}
                  className={styles.swatchColor}
                  style={{ backgroundColor: color.cssValue }}
                />
                <div className={styles.swatchMeta}>
                  <span className={styles.swatchName}>{color.name}</span>
                  <span className={styles.swatchValue}>{color.cssValue}</span>
                  <span className={styles.swatchValue}>{color.token}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Typography</p>
            <h2 className={styles.sectionTitle}>Pretendard Variable</h2>
          </div>
          <div className={styles.typeGrid}>
            <div className={styles.typeSpecimen}>
              <p className={styles.typeSpecimenLarge}>가나다라 Aa 123</p>
              <p className={styles.typeSpecimenCopy}>
                명확하고 읽기 쉬운 고딕으로, 작은 정책 정보부터 중요한 마감
                안내까지 편안한 가독성을 제공합니다.
              </p>
            </div>
            <div className={styles.typeScale}>
              <TypeRow label="Heading" meta="22 / 28 · Medium" sample="혜택을 놓치지 않도록" />
              <TypeRow label="Body 1" meta="16 / 24 · Regular" sample="필요한 지원을 쉽고 빠르게 확인하세요." />
              <TypeRow label="Body 2" meta="14 / 20 · Regular" sample="정책 정보와 신청 방법을 한눈에 정리해드려요." />
              <TypeRow label="Caption" meta="12 / 16 · Regular" sample="마감일, 대상, 금액 등 핵심 정보" />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Icon language</p>
            <h2 className={styles.sectionTitle}>2px 라운드 라인 아이콘</h2>
          </div>
          <div className={styles.iconGrid}>
            {BRAND_ICONS.map(({ Icon, label }) => (
              <div className={styles.iconSample} key={label}>
                <Icon aria-hidden="true" size={28} strokeWidth={2} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>UI application</p>
            <h2 className={styles.sectionTitle}>정책 카드 적용 예시</h2>
            <p className={styles.sectionDescription}>
              정보 계층은 타이포와 간격으로 구분하고, 카드는 독립된 정책
              객체에만 사용합니다.
            </p>
          </div>
          <article className={styles.application}>
            <div className={styles.applicationMain}>
              <div>
                <span className={styles.category}>청년 주거 지원</span>
                <h3 className={styles.policyTitle}>청년 월세 한시 특별지원</h3>
                <p className={styles.deadline}>
                  <Clock3 aria-hidden="true" size={18} strokeWidth={2} />
                  마감 7일 전
                </p>
              </div>
              <button className={styles.saveButton} type="button">
                <Bookmark aria-hidden="true" size={18} strokeWidth={2} />
                챙기기
              </button>
            </div>
            <div className={styles.applicationMeta}>
              <MetaItem Icon={UserRound} label="대상" value="만 19~34세" />
              <MetaItem Icon={Tag} label="분야" value="주거·자립" />
              <MetaItem Icon={CircleDollarSign} label="지원금" value="월 최대 20만원" />
              <MetaItem Icon={CalendarDays} label="마감일" value="2026.08.31" />
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

type TypeRowProps = Readonly<{
  label: string;
  meta: string;
  sample: string;
}>;

function TypeRow({ label, meta, sample }: TypeRowProps): ReactElement {
  return (
    <div className={styles.typeRow}>
      <span className={styles.typeName}>{label}</span>
      <span>{sample}</span>
      <span className={styles.typeMeta}>{meta}</span>
    </div>
  );
}

type MetaItemProps = Readonly<{
  Icon: typeof UserRound;
  label: string;
  value: string;
}>;

function MetaItem({ Icon, label, value }: MetaItemProps): ReactElement {
  return (
    <div className={styles.metaItem}>
      <Icon aria-hidden="true" color="var(--primary)" size={20} strokeWidth={2} />
      <span>
        <span className={styles.metaLabel}>{label}</span>
        <span className={styles.metaValue}>{value}</span>
      </span>
    </div>
  );
}
