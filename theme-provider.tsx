"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Correct the import path for ThemeProviderProps - trying direct import
// import { type ThemeProviderProps } from "next-themes/dist/types" // This path seems incorrect
import { type ThemeProviderProps } from "next-themes" // Alternative import path

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

