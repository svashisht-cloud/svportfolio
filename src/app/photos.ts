export interface Photo {
  src: string;
  alt: string;
  caption?: string;
  /** Intrinsic size in pixels, used for layout before the image loads. */
  w: number;
  h: number;
}

/**
 * Photos shown in the Photos window. To add one: put a resized copy (max ~2000px)
 * in public/photos/ and add an entry here.
 */
export const photos: Photo[] = [
  {
    src: "/images/umass-grad.jpg",
    alt: "Shubh in a graduation cap and gown on a boardwalk, with the Manhattan skyline behind",
    caption: "Graduation, UMass Amherst · Class of 2022",
    w: 643,
    h: 1200,
  },
];
