import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex flex-row rounded-md border border-input focus-visible:outline-none focus-within:outline-2 focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <input
          className="flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-base focus:outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground  md:text-sm"
          type={type}
          ref={ref}
          {...props}
        />
        {children}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
