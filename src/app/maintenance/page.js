import Image from "next/image";
import styles from "./maintenance.module.css";

export const metadata = {
  title: "Coming soon | Maya Herbs Wholesale",
  description: "Our website is under development. A new Maya space is coming soon.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <Image
          src="/banner/maya-wholesale/logo-maya-wholesale.svg"
          alt="Maya Herbs Wholesale"
          width={494}
          height={201}
          priority
          className={styles.logo}
        />
        <p className={styles.eyebrow}>Website under development</p>
        <h1 className={styles.title}>Coming soon.</h1>
        <p className={styles.description}>
          We’re carefully preparing our new space.<br className={styles.desktopBreak} />
          {" "}We look forward to welcoming you soon.
        </p>
        <div className={styles.divider} aria-hidden="true" />
        <p className={styles.contact}>
          Get in touch with our team
          <a href="mailto:info@mayaherbs.com">info@mayaherbs.com</a>
        </p>
      </div>
      <p className={styles.footer}>Maya Herbs Wholesale</p>
    </main>
  );
}
