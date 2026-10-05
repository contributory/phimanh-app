import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  full?: boolean;
}

export function LoadingSpinner({ className, size = "md", label, full }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", full && "py-24", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-white",
          sizeClasses[size]
        )}
      />
      {label && <p className="text-sm text-zinc-400">{label}</p>}
    </div>
  );
}

export default LoadingSpinner;
