import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  Check,
  Leaf,
  MapPin,
  PackageCheck,
  Sprout,
} from "lucide-react";
import styles from "./homepage-test.module.css";

export const metadata = {
  title: "Maya Wholesale — Brand Homepage Study",
  description:
    "A brand-led homepage concept for Maya's wholesale ethnobotanical partnerships.",
  robots: {
    index: false,
    follow: false,
  },
};

const trustProof = [
  {
    label: "Source",
    value: "Direct relationships",
    detail: "with tribes, growers, artisans and collectors",
  },
  {
    label: "Origin",
    value: "Traceable provenance",
    detail: "named as part of the product, never an afterthought",
  },
  {
    label: "Standard",
    value: "Declared quality",
    detail: "clear expectations for potency, purity and purpose",
  },
  {
    label: "Supply",
    value: "European continuity",
    detail: "distribution and partner support from Haarlem",
  },
];

const ranges = [
  {
    name: "Tribal Rapéh",
    note: "Tradition named. Origin visible.",
    tone: "terracotta",
  },
  {
    name: "Ethnobotanical herbs",
    note: "Whole plants with context and guidance.",
    tone: "olive",
  },
  {
    name: "Botanical extracts",
    note: "Contemporary formulation, rooted knowledge.",
    tone: "teal",
  },
  {
    name: "Superfoods & incense",
    note: "Purposeful additions to a considered catalog.",
    tone: "ochre",
  },
];

const commitments = [
  "Knowledge remains connected to its holders.",
  "Products enter the catalog with a clear purpose.",
  "Information is treated as part of the product.",
  "Commercial growth does not outrank ethical origin.",
];

export default function HomepageTest() {
  return (
    <div id="top" className={styles.page}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>

      <header className={styles.header}>
        <Link className={styles.logoLink} href="/" aria-label="Maya Wholesale home">
          <Image
            src="/banner/maya-wholesale/logo-maya-wholesale.svg"
            alt="Maya Wholesale"
            width={494}
            height={201}
            priority
            unoptimized
            className={styles.logo}
          />
        </Link>

        <nav className={styles.nav} aria-label="Homepage study navigation">
          <a href="#approach">Our approach</a>
          <a href="#origin">Provenance</a>
          <a href="#partnership">Partnership</a>
        </nav>

        <Link className={styles.headerCta} href="/catalog">
          Open catalog
        </Link>
      </header>

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <span>Maya Ethnobotanicals</span>
              <span>Wholesale · Since 2000</span>
            </div>

            <h1 id="hero-title" className={styles.heroTitle}>
              <span className={styles.titleLine}>Origin is not</span>
              <span className={styles.titleAccent}>a footnote.</span>
            </h1>

            <p className={styles.heroIntro}>
              Wholesale ethnobotanicals with traceable provenance, declared
              standards and relationships that reach back to the people who
              hold the knowledge.
            </p>

            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href="/register">
                Become a wholesale partner
              </Link>
              <a className={styles.textCta} href="#approach">
                See how we work
                <ArrowDown aria-hidden="true" size={16} strokeWidth={1.8} />
              </a>
            </div>

            <p className={styles.heroAside}>
              A trusted bridge between ancestral cultures and responsible
              trade today.
            </p>
          </div>

          <div className={styles.heroVisual}>
            <Image
              src="/tribes/yawanawa.webp"
              alt="Two Yawanawá community members working together"
              fill
              priority
              unoptimized
              sizes="(max-width: 800px) 100vw, 48vw"
              className={styles.heroImage}
            />
            <div className={styles.heroImageShade} aria-hidden="true" />
            <div className={styles.imageCaption}>
              <span>Yawanawá</span>
              <span>Acre · Brazil</span>
            </div>
          </div>

          <div className={styles.crossingRail} aria-hidden="true">
            <span className={styles.railWord}>Origin</span>
            <i />
            <span className={styles.railMark}>
              <b>M</b>
            </span>
            <i />
            <span className={styles.railWord}>Trade</span>
          </div>
        </section>

        <section className={styles.proofBand} aria-label="How Maya proves trust">
          {trustProof.map((item) => (
            <article className={styles.proofItem} key={item.label}>
              <span className={styles.proofLabel}>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </section>

        <section id="approach" className={styles.approach} aria-labelledby="approach-title">
          <div className={styles.sectionLead}>
            <span className={styles.sectionKicker}>Our approach</span>
            <h2 id="approach-title">The catalog follows the relationship.</h2>
          </div>

          <div className={styles.approachBody}>
            <p className={styles.leadParagraph}>
              Maya did not arrive after the category was formed. Since 2000,
              the work has been to keep legitimate access possible across
              distance, cultures and regulation.
            </p>
            <p>
              That means provenance before persuasion, clarity before claims,
              and long-term relationships before opportunistic supply. The
              product matters. So does every hand and place behind it.
            </p>
            <Link className={styles.inlineLink} href="/about">
              Read the Maya story
            </Link>
          </div>

          <div className={styles.approachStamp} aria-hidden="true">
            <span>Trusted source</span>
            <b>24+</b>
            <span>years in ethnobotanicals</span>
          </div>
        </section>

        <section id="origin" className={styles.origin} aria-labelledby="origin-title">
          <div className={styles.originGallery}>
            <figure className={styles.originPrimary}>
              <Image
                src="/ngo/collage-1.webp"
                alt="Indigenous partners gathered beneath a forest tree"
                fill
                unoptimized
                sizes="(max-width: 900px) 92vw, 48vw"
                className={styles.coverImage}
              />
              <figcaption>Relationships are the asset.</figcaption>
            </figure>

            <figure className={styles.originSecondary}>
              <Image
                src="/tribes/huni-kuin.webp"
                alt="A Huni Kuin village at the forest edge"
                fill
                unoptimized
                sizes="(max-width: 900px) 48vw, 23vw"
                className={styles.coverImage}
              />
              <figcaption>Huni Kuin · Acre</figcaption>
            </figure>
          </div>

          <div className={styles.originCopy}>
            <span className={styles.sectionKicker}>Provenance</span>
            <h2 id="origin-title">Where it comes from is part of what it is.</h2>
            <p>
              Traditional knowledge belongs to the people who developed it
              and keep it alive. Maya names the tribe, community, region or
              country of origin whenever that information is available.
            </p>

            <ul className={styles.commitmentList}>
              {commitments.map((commitment) => (
                <li key={commitment}>
                  <Check aria-hidden="true" size={18} strokeWidth={2} />
                  <span>{commitment}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.ranges} aria-labelledby="ranges-title">
          <div className={styles.rangesHeader}>
            <div>
              <span className={styles.sectionKicker}>Wholesale range</span>
              <h2 id="ranges-title">A considered catalog, not a crowded one.</h2>
            </div>
            <Link className={styles.catalogLink} href="/catalog">
              Explore all products
            </Link>
          </div>

          <div className={styles.rangeGrid}>
            {ranges.map((range) => (
              <Link
                href="/catalog"
                className={`${styles.rangeCard} ${styles[range.tone]}`}
                key={range.name}
              >
                <span className={styles.rangeSymbol} aria-hidden="true">
                  <Leaf size={27} strokeWidth={1.35} />
                </span>
                <div>
                  <h3>{range.name}</h3>
                  <p>{range.note}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.bridge} aria-labelledby="bridge-title">
          <div className={styles.bridgePattern} aria-hidden="true" />
          <div className={styles.bridgeIntro}>
            <span className={styles.sectionKicker}>One bridge · Two homes</span>
            <h2 id="bridge-title">Present at both ends of the crossing.</h2>
            <p>
              Maya joins direct forest relationships and production in Brazil
              with development, distribution and partner support in Europe.
            </p>
          </div>

          <div className={styles.route}>
            <article className={styles.routePoint}>
              <MapPin aria-hidden="true" size={22} strokeWidth={1.6} />
              <span className={styles.routeLabel}>Origin &amp; production</span>
              <h3>Nova Friburgo</h3>
              <p>Rio de Janeiro · Brazil</p>
            </article>

            <div className={styles.routeLine} aria-hidden="true">
              <span />
              <b>
                <span>Maya</span>
              </b>
              <span />
            </div>

            <article className={styles.routePoint}>
              <PackageCheck aria-hidden="true" size={22} strokeWidth={1.6} />
              <span className={styles.routeLabel}>Distribution &amp; development</span>
              <h3>Haarlem</h3>
              <p>The Netherlands · Europe</p>
            </article>
          </div>
        </section>

        <section id="partnership" className={styles.partnership} aria-labelledby="partnership-title">
          <div className={styles.partnershipMark} aria-hidden="true">
            <Sprout size={44} strokeWidth={1.2} />
          </div>
          <p className={styles.partnershipEyebrow}>For specialist retailers, retreat centers and resellers</p>
          <h2 id="partnership-title">Build your supply on something you can stand behind.</h2>
          <p className={styles.partnershipCopy}>
            Apply for wholesale access to documented products, reliable
            formats and a partner whose reputation adds to yours.
          </p>
          <div className={styles.partnershipActions}>
            <Link className={styles.lightCta} href="/register">
              Apply for an account
            </Link>
            <Link className={styles.darkTextCta} href="/contact">
              Talk to the wholesale team
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image
            src="/banner/maya-wholesale/logo-maya-wholesale.svg"
            alt="Maya Wholesale"
            width={494}
            height={201}
            unoptimized
            className={styles.footerLogo}
          />
          <p>Your trusted source for ethnobotanical herbs.</p>
        </div>

        <nav className={styles.footerNav} aria-label="Footer navigation">
          <Link href="/catalog">Catalog</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy-policy">Privacy</Link>
        </nav>

        <div className={styles.footerMeta}>
          <span>Maya World Trading B.V.</span>
          <span>Haarlem · The Netherlands</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
