import type { Product } from "@/lib/types";

/** Product photo, or a neutral placeholder until our own photo is uploaded. */
export default function ProductThumb({ product, className = "", label }: { product: Product; className?: string; label?: string }) {
  if (product.imageUrl) return <img src={product.imageUrl} alt="" className={`object-cover ${className}`} />;
  return <div className={`flex items-center justify-center bg-placeholder text-[11px] text-mute ${className}`}>{label}</div>;
}
