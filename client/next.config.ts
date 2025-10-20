import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
	/* config options here */
	devIndicators: false,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "vnstasacapstonep01.blob.core.windows.net",
				port: "",
				pathname: "/**",
			},
		],
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5500"}/api/:path*`,
			},
			{
				source: "/optimizer/api/v1/:path*",
				destination: "http://localhost:8000/optimizer/api/v1/:path*",
			},
		];
	},
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
