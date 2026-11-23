// nav.tsx: the site header: brand, page links, a trailing slot (theme switch) and, at 900 px and
// below, a menu button that opens the links in a panel.

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./nav.module.css";

/** One link in the {@link Nav}. */
export interface NavLink {
  /** Visible text. It is also the accessible name, so an icon never needs a label of its own. */
  label: string;
  /** Where it goes. */
  href: string;
  /** Marks the page being shown: an inverted pill and `aria-current="page"`. */
  current?: boolean;
  /** An inline SVG shown before the label. Decorative; hidden from screen readers. */
  icon?: ReactNode;
}

/** Props of {@link Nav}. */
export interface NavProps {
  /** The logo and wordmark, as the content of the home link. */
  brand: ReactNode;
  /** Where the brand links to. Defaults to `/`. */
  brandHref?: string;
  /** Names the home link for screen readers, for example "Veilo home". */
  brandLabel: string;
  /** The page links, in order. */
  links: NavLink[];
  /** Controls at the end of the bar, such as the theme switch. */
  trailing?: ReactNode;
  /** Extra class for the header. */
  className?: string;
}

/**
 * The top header. Above 900 px the links and the trailing controls sit in one row; at 900 px and
 * below only the brand and a menu button show, and the links and the controls open in a panel
 * under the bar. The side padding is the page grid's margin.
 *
 * @param props - The brand, the links and an optional trailing slot.
 * @returns The `<header>` with a labelled `<nav>`.
 */
export function Nav(props: NavProps) {
  const { brand, brandHref = "/", brandLabel, links, trailing, className } = props;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  // A tap outside the header closes the menu, as Escape does.
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) {
      setOpen(false);
      // Focus goes back to the button that opened the panel.
      button.current?.focus();
    }
  };

  return (
    <header
      ref={header}
      className={[styles.header, className].filter(Boolean).join(" ")}
      onKeyDown={onKeyDown}
    >
      <div className={styles.bar}>
        <a className={styles.brand} href={brandHref} aria-label={brandLabel}>
          {brand}
        </a>
        <button
          ref={button}
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 14h14" />}
          </svg>
        </button>
        <div id={panelId} className={styles.panel} data-open={open}>
          <nav aria-label="Main">
            <ul className={styles.links}>
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    className={styles.link}
                    href={link.href}
                    aria-current={link.current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {link.icon && (
                      <span className={styles.icon} aria-hidden="true">
                        {link.icon}
                      </span>
                    )}
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {trailing && <div className={styles.trailing}>{trailing}</div>}
        </div>
      </div>
    </header>
  );
}
