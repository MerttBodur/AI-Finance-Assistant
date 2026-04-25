import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "destructive" | "outline";

const variants: Record<Variant, string> = {
  default: "bg-yellow-400 text-black hover:bg-yellow-300",
  destructive: "bg-red-600 text-white hover:bg-red-500",
  outline: "border border-gray-600 text-gray-200 hover:bg-gray-800",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = "default",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
