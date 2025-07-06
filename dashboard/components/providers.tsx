'use client'

import { ThemeProvider } from 'next-themes'
import { SWRConfig } from 'swr'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SWRConfig
        value={{
          refreshInterval: 60000, // 60 seconds
          fetcher: (url: string) => fetch(url).then(res => res.json()),
        }}
      >
        {children}
      </SWRConfig>
    </ThemeProvider>
  )
}