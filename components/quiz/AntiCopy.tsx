"use client";

import { useEffect, useRef } from "react";

/**
 * Anti-copy / anti-cheat guard used ONLY around quiz content.
 *
 * - Blocks copy, cut, paste, drag, context menu and text selection.
 * - Blocks the most common dev-tools / view-source keyboard shortcuts
 *   (F12, Ctrl/CMD+Shift+I/J/C/K/P, Ctrl+U/S/P) and the PrintScreen key.
 * - Detects an open DevTools window via the window-size breakpoint.
 * - Detects tab switches / window blur and reports them as violations;
 *   a long loss of focus (e.g. Alt+Tab to another app) bumps twice so it
 *   reaches the auto-submit threshold faster.
 * - Blocks the browser print / "save as PDF" path.
 *
 * This is a deterrence layer, not a hard security boundary: the real
 * protection is that correct answers never leave the server.
 */
export default function AntiCopy({
  onViolation,
  minViolationsToBlow = 2,
  onConfirmedCheat,
}: {
  onViolation?: (count: number) => void;
  minViolationsToBlow?: number;
  onConfirmedCheat?: () => void;
}) {
  const violations = useRef(0);
  const lastBlurAt = useRef(0);

  useEffect(() => {
    function bump() {
      violations.current += 1;
      if (violations.current === 1) {
        window.dispatchEvent(new CustomEvent("quiz-cheat-warn"));
      }
      onViolation?.(violations.current);
      if (violations.current >= minViolationsToBlow) {
        onConfirmedCheat?.();
      }
    }

    function block(e: Event) {
      e.preventDefault();
      e.stopPropagation();
      bump();
    }

    const blockKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // PrintScreen
      if (k === "printscreen" || e.keyCode === 44) {
        e.preventDefault();
        bump();
        return;
      }
      // F12, Ctrl/Cmd+Shift+I/J/C/K/P, Ctrl+U, Ctrl+S, Ctrl+P, Ctrl+Shift+M
      if (
        k === "f12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c", "k", "p", "m"].includes(k)) ||
        (e.metaKey && e.shiftKey && ["i", "j", "c", "k", "p"].includes(k)) ||
        (e.metaKey && e.altKey && ["i", "j", "c"].includes(k)) ||
        (e.ctrlKey && !e.shiftKey && ["u", "s", "p"].includes(k))
      ) {
        e.preventDefault();
        bump();
      }
    };

    function onCopy(e: ClipboardEvent) {
      e.preventDefault();
      bump();
    }

    function onVisibility() {
      if (document.hidden) bump();
    }
    function onBlur() {
      lastBlurAt.current = Date.now();
      bump();
    }
    function onFocus() {
      // Returning after a long absence (switched to another app) counts again.
      if (lastBlurAt.current && Date.now() - lastBlurAt.current > 3000) {
        bump();
      }
      lastBlurAt.current = 0;
    }
    function onPrint() {
      bump();
    }

    const ctx = (e: Event) => {
      e.preventDefault();
      bump();
    };

    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", ctx);
    document.addEventListener("dragstart", block);
    document.addEventListener("keydown", blockKey);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("beforeprint", onPrint);

    // DevTools window-size breakpoint detection.
    const last = { width: window.outerWidth, height: window.outerHeight };
    const probe = window.setInterval(() => {
      if (
        window.outerWidth - window.innerWidth > 160 ||
        window.outerHeight - window.innerHeight > 160
      ) {
        if (last.width - window.innerWidth > 160 || last.height - window.innerHeight > 160) {
          bump();
        }
      }
    }, 1200);

    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", ctx);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("keydown", blockKey);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("beforeprint", onPrint);
      window.clearInterval(probe);
    };
  }, [onViolation, onConfirmedCheat, minViolationsToBlow]);

  return null;
}