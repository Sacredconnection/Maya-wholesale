"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./Onboarding.module.css";

const steps = [
  {
    number: "01",
    label: "Your details",
    title: "Register your business",
    description:
      "Share your identity, business information and create a secure account.",
  },
  {
    number: "02",
    label: "Our review",
    title: "We confirm the right access",
    description:
      "Our team reviews your information and matches wholesale access to your operation.",
  },
  {
    number: "03",
    label: "Your account",
    title: "Order, return and reorder",
    description:
      "Access partner pricing, live availability, order tools and purchase history.",
  },
];

export default function Onboarding() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      const visibilityTimer = window.setTimeout(() => setIsVisible(true), 0);
      return () => window.clearTimeout(visibilityTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.14, rootMargin: "0px 0px -12% 0px" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="onboarding"
      aria-labelledby="onboarding-title"
      className={`${styles.section} ${isVisible ? styles.visible : ""}`}
    >
      <div className={styles.panel}>
        <div className={styles.layout}>
          <div className={styles.introColumn}>
            <header className={styles.header}>
              <div className={styles.headingBlock}>
                <p className={styles.eyebrow}>Maya trade program</p>
                <h2 id="onboarding-title" className={styles.title}>
                  A clear path to <span>wholesale.</span>
                </h2>
              </div>

              <p className={styles.summary}>
                From your first details to your first order, every step is built
                for professional botanical buyers.
              </p>
            </header>

            <div className={styles.actionBar}>
              <Link href="/register" className={styles.cta}>
                Create B2B account
              </Link>
            </div>
          </div>

          <div className={styles.journey}>
            <ol className={styles.steps}>
              {steps.map((step, index) => {
                return (
                  <li
                    key={step.number}
                    className={styles.step}
                    style={{ "--entry-delay": `${index * 150}ms` }}
                  >
                    <div className={styles.stepHeading}>
                      <span className={styles.number}>{step.number}</span>
                      <span className={styles.dot} aria-hidden="true" />
                    </div>

                    <div className={styles.stepCopy}>
                      <p className={styles.stepLabel}>{step.label}</p>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
