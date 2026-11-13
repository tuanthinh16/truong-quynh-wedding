"use client";

import Image, { getImageProps, type ImageProps, type ImageLoaderProps } from "next/image";
import preparedImages from "../../.generated/images.json";

const manifest = preparedImages as Record<string, Record<string, string>>;

function preparedLoader({ src, width }: ImageLoaderProps) {
  const variants = manifest[src];
  const widths = Object.keys(variants).map(Number).sort((first, second) => first - second);
  const selected = widths.find(candidate => candidate >= width) ?? widths.at(-1)!;
  return variants[selected];
}

function withPreparedImage(props: ImageProps): ImageProps {
  return { ...props, loader: props.loader || (typeof props.src === "string" && manifest[props.src] ? preparedLoader : undefined) };
}

export function getWeddingImageProps(props: ImageProps) {
  return getImageProps(withPreparedImage(props));
}

export default function WeddingImage(props: ImageProps) {
  return <Image {...withPreparedImage(props)} alt={props.alt} />;
}
