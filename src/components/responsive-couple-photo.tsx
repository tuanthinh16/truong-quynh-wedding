import Image, { getImageProps } from "next/image";

export default function ResponsiveCouplePhoto({ landscape, portrait, alt, className }: {
  landscape: string; portrait: string; alt: string; className: string;
}) {
  const { props: mobile } = getImageProps({ src: portrait, alt, fill: true, sizes: "100vw" });
  return <picture>
    <source media="(max-width: 699px)" srcSet={mobile.srcSet} sizes="100vw" />
    <Image src={landscape} alt={alt} className={className} fill sizes="100vw" loading="eager" fetchPriority="high" />
  </picture>;
}
