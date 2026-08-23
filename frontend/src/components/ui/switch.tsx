"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group/switch inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-0 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30 data-checked:bg-primary data-unchecked:bg-input disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 mx-0.5 rounded-full bg-background shadow-sm ring-1 ring-black/5 transition-transform group-data-checked/switch:translate-x-4 group-data-unchecked/switch:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
