"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
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
      <Image
        className={styles.watermark}
        src="/onboarding/watermark-onboarding.svg"
        alt=""
        width={1126}
        height={1156}
        unoptimized
        aria-hidden="true"
      />

      <div className={styles.intro}>
        <div className={styles.introContent}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" />
            Maya trade program
          </p>

          <h2 id="onboarding-title" className={styles.title}>
            Wholesale,
            <br />
            without the
            <br />
            guesswork.
          </h2>

          <p className={styles.summary}>
            A guided route from first details to your first order, built for
            professional botanical buyers.
          </p>
        </div>

        <div className={styles.audience}>
          <span>Created for</span>
          <p>Retailers · Practitioners · Distributors</p>
        </div>

        <Link href="/register" className={styles.cta}>
          Create B2B account
        </Link>
      </div>

      <div className={styles.process}>
        <div className={styles.processHeader}>
          <p>How access works</p>
          <span>Three clear steps</span>
        </div>

        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li
              key={step.number}
              className={styles.step}
              style={{
                "--step-delay": `${180 + index * 150}ms`,
                "--flow-delay": `${index * 2800}ms`,
              }}
            >
              <div className={styles.marker}>
                <span>{step.number}</span>
              </div>

              <div className={styles.stepCopy}>
                <span className={styles.stepLabel}>{step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
