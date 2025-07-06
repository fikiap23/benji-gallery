"use client"

import { ReactNode } from "react"

// This provider is not needed in the current version of UploadThing with Next.js App Router
// It's only here for future compatibility or in case we need to add configuration later
export function UploadThingProvider({ children }: { children: ReactNode }) {
  return children
} 