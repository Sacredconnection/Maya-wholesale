"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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

const ONBOARDING_TITLE = "Wholesale,\nwithout the\nguesswork.";

export default function Onboarding() {
  const sectionRef = useRef(null);
  const stepRefs = useRef([]);
  const [isVisible, setIsVisible] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(() => new Set());
  const [typedTitle, setTypedTitle] = useState("");

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

  useEffect(() => {
    if (!isVisible) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      const reducedMotionTimer = window.setTimeout(() => {
        setTypedTitle(ONBOARDING_TITLE);
      }, 0);

      return () => window.clearTimeout(reducedMotionTimer);
    }

    let typingTimer;
    const startTimer = window.setTimeout(() => {
      typingTimer = window.setInterval(() => {
        setTypedTitle((currentTitle) => {
          const nextTitle = ONBOARDING_TITLE.slice(0, currentTitle.length + 1);

          if (nextTitle === ONBOARDING_TITLE) {
            window.clearInterval(typingTimer);
          }

          return nextTitle;
        });
      }, 65);
    }, 250);

    return () => {
      window.clearTimeout(startTimer);
      if (typingTimer) window.clearInterval(typingTimer);
    };
  }, [isVisible]);

  useEffect(() => {
    const observedSteps = stepRefs.current.filter(Boolean);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const stepIndex = Number(entry.target.dataset.stepIndex);
          setVisibleSteps((currentSteps) => {
            if (currentSteps.has(stepIndex)) return currentSteps;

            const nextSteps = new Set(currentSteps);
            nextSteps.add(stepIndex);
            return nextSteps;
          });
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -22% 0px",
      }
    );

    observedSteps.forEach((step) => observer.observe(step));
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

          <h2
            id="onboarding-title"
            className={styles.title}
            aria-label={ONBOARDING_TITLE.replaceAll("\n", " ")}
          >
            <span aria-hidden="true">
              {typedTitle.split("\n").map((line, index) => (
                <span
                  key={index}
                  className={styles.titleLine}
                >
                  {line}
                </span>
              ))}
            </span>
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
          <ArrowUpRight aria-hidden="true" />
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
              ref={(element) => {
                stepRefs.current[index] = element;
              }}
              data-step-index={index}
              className={`${styles.step} ${
                visibleSteps.has(index) ? styles.stepVisible : ""
              }`}
              style={{
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
