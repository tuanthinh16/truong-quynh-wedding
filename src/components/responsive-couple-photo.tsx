import ViewportPhoto from "./viewport-photo";

export default function ResponsiveCouplePhoto({ src, alt, className }: {
  src: string; alt: string; className: string;
}) {
  return <ViewportPhoto src={src} alt={alt} className={className} sizes="(min-width: 1200px) 440px, (min-width: 700px) 38vw, 100vw" eager />;
}
