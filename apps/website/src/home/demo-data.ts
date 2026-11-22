// demo-data.ts: the home page demo cards' plain data: the messages of the inbox, each card's slot
// hints and default text. No React and no CSS, so Node scripts (the snippet check) can import it
// together with the playground's layout table; the cards' markup is in the files beside it.

/** One message of the list. */
export interface Message {
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
export const MESSAGES: readonly Message[] = [
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
export const FILTERS = ["Updates", "From", "To"] as const;

/** Slot hints of the inbox: the chips, then each message's parts by index. */
export const INBOX_LAYOUT = {
  version: 1,
  slots: {
    ...Object.fromEntries(
      FILTERS.flatMap((_, index) => [
        // Core allows one button per container; the other chips are blocks, as it would make them.
        [`chip${index}`, { role: index === 0 ? "button" : "block" }],
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

/** Slot hints of the video tile. */
export const VIDEO_LAYOUT = {
  version: 1,
  slots: {
    thumb: { role: "image" },
    duration: { role: "block" },
    avatar: { role: "block" },
    title: { role: "text", lines: 2, width: 80 },
    channel: { role: "text", width: 46 },
    stats: { role: "text", width: 72 },
    more: { role: "block" },
  },
} as const;

/**
 * Slot hints of the video tile on the home page: the same, without the duration badge, which
 * stays visible while the rest loads and fades in when the reveal is done.
 */
export const HOME_VIDEO_LAYOUT = {
  version: 1,
  slots: Object.fromEntries(
    Object.entries(VIDEO_LAYOUT.slots).filter(([name]) => name !== "duration"),
  ),
} as const;

/** The video tile's default text, by slot name. */
export const VIDEO_TEXTS = {
  duration: "12:48",
  title: "Night walk through the old town in 4K, no talking",
  channel: "Slow Cities",
  stats: "482K views · 3 days ago",
} as const;

/** Slot hints of the music player. */
export const MUSIC_LAYOUT = {
  version: 1,
  slots: {
    cover: { role: "image" },
    track: { role: "text", width: 62 },
    artist: { role: "text", width: 44 },
    more: { role: "block" },
    progress: { role: "block" },
    time: { role: "text" },
    repeat: { role: "block" },
    back: { role: "block" },
    play: { role: "block" },
    forward: { role: "block" },
    like: { role: "block" },
  },
} as const;

/** The music player's default text, by slot name. */
export const MUSIC_TEXTS = {
  track: "Glass Horizon",
  artist: "Blue Meridian",
  time: "00:42 / 03:18",
} as const;
