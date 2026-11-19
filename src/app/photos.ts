export interface Photo {
  /** Image path. For a video, this is its poster frame. */
  src: string;
  /** Optional MP4 (H.264/AAC, SDR) under /public. When set, the viewer plays it instead of showing `src`. */
  video?: string;
  alt: string;
  caption?: string;
  /** Optional "Mon YYYY" shown under the caption. Only from the original file's metadata or the owner. */
  date?: string;
  /** Optional place name shown next to the date. */
  place?: string;
  /** Intrinsic size in pixels, used for layout before the image loads. */
  w: number;
  h: number;
}

/**
 * Photos shown in the Photos window. To add one: put a resized copy (max ~2000px)
 * in public/photos/ and add an entry here. Videos go in public/videos/ (see architecture.md
 * for the conversion steps) with a poster frame as `src`.
 */
export const photos: Photo[] = [
  {
    src: "/photos/cafe.jpg",
    alt: "Shubh at a café table, smiling",
    w: 1600,
    h: 1200,
  },
  {
    src: "/images/umass-grad.jpg",
    alt: "Shubh in a graduation cap and gown on a boardwalk, with the Manhattan skyline behind",
    caption: "Graduation, UMass Amherst · Class of 2022",
    w: 643,
    h: 1200,
  },
  {
    src: "/photos/img-4988.jpg",
    alt: "Shubh with both arms up making peace signs at a mountain overlook, a snow-streaked peak and pine forest behind",
    date: "Jul 2024",
    w: 1500,
    h: 2000,
  },
  {
    src: "/photos/snow-day.jpg",
    alt: "Shubh and three friends in winter gear holding snow shovels beside a snow-covered car",
    caption: "Snow day crew",
    date: "Jan 2026",
    w: 1200,
    h: 1600,
  },
  {
    src: "/photos/roadside-selfie.jpg",
    alt: "Selfie of Shubh and a friend at a roadside barrier, with spectators lining a race route and a yellow school bus behind",
    date: "Apr 2026",
    w: 1536,
    h: 2048,
  },
  {
    src: "/videos/img-2234.jpg",
    video: "/videos/img-2234.mp4",
    alt: "Shubh in an orange T-shirt and lifting belt setting up a barbell squat in a gym rack",
    caption: "Leg day",
    w: 720,
    h: 1280,
  },
];
