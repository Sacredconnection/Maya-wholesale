"use client";

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let bodyLockCount = 0;
let bodyOverflowBeforeLock = '';

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyLockCount += 1;
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = bodyOverflowBeforeLock;
  }
}

export function useDialogAccessibility(
  isOpen,
  onClose,
  { containerRef, initialFocusRef, returnFocusRef } = {},
) {
  const onCloseRef = useRef(onClose);
  const capturedReturnFocusRef = useRef(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const dialog = containerRef?.current;
    if (!dialog) return undefined;

    capturedReturnFocusRef.current =
      returnFocusRef?.current ||
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);

    lockBodyScroll();

    const focusFrame = requestAnimationFrame(() => {
      const initialTarget =
        initialFocusRef?.current || dialog.querySelector(FOCUSABLE_SELECTOR) || dialog;
      initialTarget.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
        (element) =>
          element.getAttribute('aria-hidden') !== 'true' &&
          (element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();

      const returnTarget = capturedReturnFocusRef.current;
      requestAnimationFrame(() => {
        if (returnTarget?.isConnected) returnTarget.focus();
      });
    };
  }, [containerRef, initialFocusRef, isOpen, returnFocusRef]);
}
