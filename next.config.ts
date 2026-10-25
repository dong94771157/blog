import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // EdgeOne Makers 原生支持 Next.js SSR/ISR，无需 output: 'export'
  // 图片优化由 EdgeOne 平台自动处理
  images: {
    unoptimized: false,
  },
};

export default nextConfig;