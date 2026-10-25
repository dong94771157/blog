import type { ProductPromo } from "@/lib/types";

export default function ProductPromos({ products }: { products: ProductPromo[] }) {
  if (products.length === 0) return null;

  // 按 sort 升序排列
  const sorted = [...products].sort((a, b) => (a.sort || 0) - (b.sort || 0));

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pink-100 shadow-lg shadow-pink-100/40 p-4">
      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 mb-3">
        <span>✨</span> 站长推荐
      </h3>
      <div className="space-y-2.5">
        {sorted.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-3 rounded-xl border border-pink-100 bg-white/60 hover:bg-pink-50 hover:border-pink-200 hover:shadow-md hover:shadow-pink-100/50 transition-all"
          >
            <div className="flex gap-3">
              {p.image && (
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-pink-100"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-gray-700 truncate group-hover:text-pink-600 transition-colors">
                    {p.title}
                  </h4>
                  {p.badge && (
                    <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600 font-medium">
                      {p.badge}
                    </span>
                  )}
                </div>
                {p.desc && (
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {p.desc}
                  </p>
                )}
                {p.price && (
                  <p className="text-xs font-bold text-pink-500 mt-1">
                    {p.price}
                  </p>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}