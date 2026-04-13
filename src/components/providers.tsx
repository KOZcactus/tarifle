"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NextThemesProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
