import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Next <Image> to optimize assets hosted on Cloudinary
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
