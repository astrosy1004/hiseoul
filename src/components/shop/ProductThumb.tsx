import type { Product } from "@/lib/types";

const TINT: Record<Product["category"], string> = {
  beauty: "from-[#FCE8EF] to-[#F7D3E0] text-[#C2255C]",
  kpop: "from-[#EDE9FE] to-[#DDD6FE] text-[#6D28D9]",
  fashion: "from-[#E0F2FE] to-[#CDE7F7] text-[#0369A1]",
};

/** Product photo, or a soft placeholder with the brand initial until our own photo is uploaded. */
export default function ProductThumb({ product, className = "", label }: { product: Product; className?: string; label?: string }) {
  const dim = product.stock === "sold_out" ? "opacity-60 grayscale" : "";
  // eslint-disable-next-line @next/next/no-img-element
  if (product.imageUrl) return <img src={product.imageUrl} alt="" className={`object-cover ${dim} ${className}`} />;
  return (
    <div aria-hidden className={`@container flex items-center justify-center bg-gradient-to-br ${TINT[product.category]} ${dim} ${className}`}>
      <span className="text-[32cqw] leading-none font-extrabold opacity-40">{label ?? product.brand.en.charAt(0)}</span>
    </div>
  );
}
