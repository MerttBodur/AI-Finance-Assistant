import path from "node:path";
import { fileURLToPath } from "node:url";

const emptyModulePath = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"lib/empty-module.js",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config) => {
		config.resolve.alias = {
			...config.resolve.alias,
			"@react-native-async-storage/async-storage": emptyModulePath,
		};
		config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
		config.externals.push("pino-pretty", "lokijs", "encoding");
		return config;
	},
};

export default nextConfig;
