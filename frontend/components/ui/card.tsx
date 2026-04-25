import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-lg border border-gray-800 bg-gray-900 p-4", className)}>
      {children}
    </div>
  );
}
