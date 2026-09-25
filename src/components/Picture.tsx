import { useImageUrl } from '../hooks.ts';

export function Picture({ image, alt, className }: { image?: string; alt: string; className?: string }) {
  const url = useImageUrl(image);
  if (!image) return null;
  return url ? <img className={className} src={url} alt={alt} draggable={false} /> : <span className={className} />;
}
