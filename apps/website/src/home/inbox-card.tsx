// inbox-card.tsx: a mail inbox the hero plays the reveal on: a row of filter chips and four
// messages, each with an avatar, sender, date, subject, preview and a star. Senders and subjects
// are invented.

import { Card } from "@veilo-ui/ui";
import type { DemoCardProps, DemoViewProps } from "./demo-cards.tsx";
import styles from "./inbox-card.module.css";
import { FILTERS, INBOX_LAYOUT, MESSAGES } from "./demo-data.ts";
import { useLiveReveal } from "./use-live-reveal.ts";

/**
 * The inbox's markup: filter chips and four messages. Unread messages are bold with a dot. It is
 * all text, with round avatars and small icons, so the reveal works on dense, list-like UI. The
 * sender and subject of message `n` are the slots `from<n>` and `subject<n>`. It plays no reveal
 * itself; {@link InboxCard} does, and the playground puts its own on it.
 *
 * @param props - The text, the root's ref and element attributes (an inbox has no picture, so
 *   `renderPhoto` is ignored).
 * @returns The card.
 */
export function InboxView(props: DemoViewProps) {
  const { texts, innerRef, renderPhoto, className, ...rest } = props;
  void renderPhoto;
  const sender = (index: number) => texts?.[`from${index}`] ?? MESSAGES[index]!.from;
  return (
    <Card
      as="article"
      raised
      ref={innerRef}
      className={className ? `${styles.card} ${className}` : styles.card}
      aria-label="Demo: an inbox"
      {...rest}
    >
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
              {sender(index).charAt(0)}
            </span>
            <div className={styles.body}>
              <div className={styles.line}>
                <p className={styles.from} data-veilo-slot={`from${index}`}>
                  {sender(index)}
                </p>
                <p className={styles.date} data-veilo-slot={`date${index}`}>
                  {message.date}
                </p>
                {message.unread && (
                  <span className={styles.dot} data-veilo-slot={`dot${index}`} aria-hidden="true" />
                )}
              </div>
              <p className={styles.subject} data-veilo-slot={`subject${index}`}>
                {texts?.[`subject${index}`] ?? message.subject}
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

/**
 * A mail inbox that plays the reveal.
 *
 * @param props - The effect and the reveal callback.
 * @returns The card.
 */
export function InboxCard(props: DemoCardProps) {
  const ref = useLiveReveal(props.settings, INBOX_LAYOUT, props.onReveal, props.play);
  return <InboxView innerRef={ref} />;
}
