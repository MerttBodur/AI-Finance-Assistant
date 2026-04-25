import { clsx, type ClassValue } from "clsx";
import { formatUnits } from "viem";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const fmt = (wei: bigint, decimals = 18) =>
  Number(formatUnits(wei, decimals)).toFixed(2);
export const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
