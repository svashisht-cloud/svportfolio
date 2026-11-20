import type { Metadata } from "next";
import Desktop from "@/components/os/Desktop";
import { LINK_PARAM, fromSlug } from "@/components/os/links";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** A deep link (`/?w=case/boot-order`) previews as that window when shared. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const raw = (await searchParams)[LINK_PARAM];
  const linked = fromSlug(Array.isArray(raw) ? raw[0] : raw);
  if (!linked) return {};
  const title = `${linked.title} · Shubh Vashisht`;
  return {
    title,
    description: linked.description,
    openGraph: { title, description: linked.description, type: "website" },
  };
}

export default function Home() {
  return <Desktop />;
}
