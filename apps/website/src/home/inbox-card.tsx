// inbox-card.tsx: a mail inbox the hero plays the reveal on: a row of filter chips and four
// messages, each with an avatar, sender, date, subject, preview and a star. Senders and subjects
// are invented.

import { Card } from "@veilo-ui/ui";
import type { DemoCardProps } from "./demo-cards.tsx";
import styles from "./inbox-card.module.css";
import { useLiveReveal } from "./use-live-reveal.ts";

/** One message of the list. */
interface Message {
  /** The sender's name. */
  from: string;
  /** The date shown at the end of the first line. */
  date: string;
  /** The subject, bold when the message is unread. */
  subject: string;
  /** The start of the body. */
  preview: string;
  /** Unread messages are bold and have a dot. */
  unread: boolean;
}

/** The messages, newest first. */
const MESSAGES: readonly Message[] = [
  {
    from: "Parcel Tracker",
    date: "17 Nov",
    subject: "Your parcel is out for delivery",
    preview: "Arriving today between 14:00 and 16:00 at",
    unread: true,
  },
  {
    from: "Mara Lindqvist",
    date: "17 Nov",
    subject: "Re: Design review notes",
    preview: "Thanks, I moved the comments into the doc",
    unread: false,
  },
  {
    from: "Harbor Bank",
    date: "16 Nov",
    subject: "Your November statement is ready",
    preview: "Your monthly statement for the account ending",
    unread: true,
  },
  {
    from: "Studio Weekly",
    date: "15 Nov",
    subject: "Five small changes that made our app calmer",
    preview: "This week: shorter forms, calmer empty states",
    unread: false,
  },
];

/** The filter chips: the first is chosen. */
const FILTERS = ["Updates", "From", "To"] as const;

/** Slot hints of the inbox: the chips, then each message's parts by index. */
const INBOX_LAYOUT = {
  version: 1,
  slots: {
    ...Object.fromEntries(
      FILTERS.flatMap((_, index) => [
        [`chip${index}`, { role: "button" }],
        [`chipLabel${index}`, { role: "text" }],
      ]),
    ),
    ...Object.fromEntries(
      MESSAGES.flatMap((message, index) => [
        [`avatar${index}`, { role: "block" }],
        [`from${index}`, { role: "text", width: 55 }],
        [`date${index}`, { role: "text" }],
        ...(message.unread ? [[`dot${index}`, { role: "block" }]] : []),
        [`subject${index}`, { role: "text" }],
        [`preview${index}`, { role: "text" }],
        [`star${index}`, { role: "block" }],
      ]),
    ),
  },
} as const;

/**
 * A mail inbox: filter chips and four messages. Unread messages are bold with a dot. It is all
 * text, with round avatars and small icons, so the reveal works on dense, list-like UI.
 *
 * @param props - The effect and the reveal callback.
 * @returns The card.
 */
export function InboxCard(props: DemoCardProps) {
  const ref = useLiveReveal(props.settings, INBOX_LAYOUT, props.onReveal);
  return (
    <Card as="article" raised ref={ref} className={styles.card} aria-label="Demo: an inbox">
      <div className={styles.filters}>
        {FILTERS.map((filter, index) => (
          <span
            key={filter}
            className={index === 0 ? `${styles.chip} ${styles.chipOn}` : styles.chip}
            data-veilo-slot={`chip${index}`}
          >
            {index === 0 && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12l5 5 9-10" />
              </svg>
            )}
            <span data-veilo-slot={`chipLabel${index}`}>{filter}</span>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </span>
        ))}
      </div>

      <ul className={styles.list}>
        {MESSAGES.map((message, index) => (
          <li key={message.subject} className={message.unread ? styles.unread : styles.read}>
            <span className={styles.avatar} data-veilo-slot={`avatar${index}`} aria-hidden="true">
              {message.from.charAt(0)}
            </span>
            <div className={styles.body}>
              <div className={styles.line}>
                <p className={styles.from} data-veilo-slot={`from${index}`}>
                  {message.from}
                </p>
                <p className={styles.date} data-veilo-slot={`date${index}`}>
                  {message.date}
                </p>
                {message.unread && (
                  <span className={styles.dot} data-veilo-slot={`dot${index}`} aria-hidden="true" />
                )}
              </div>
              <p className={styles.subject} data-veilo-slot={`subject${index}`}>
                {message.subject}
              </p>
              <div className={styles.line}>
                <p className={styles.preview} data-veilo-slot={`preview${index}`}>
                  {message.preview}
                </p>
                <span className={styles.star} data-veilo-slot={`star${index}`} aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z" />
                  </svg>
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
