import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Brand Workbench",
  description:
    "Author a complete brand system — strategy, voice, and tone — on the live Visor theme engine. The core Elicit screen: derivation spine, conversational interview, and a brand canvas assembling live.",
  alternates: { canonical: "https://visor.design/brand-workbench" },
  openGraph: {
    type: "website",
    url: "https://visor.design/brand-workbench",
    title: "Brand Workbench | Visor",
    description:
      "Author a complete brand system on the live Visor theme engine — strategy, voice, and tone, assembling live.",
    siteName: "Visor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand Workbench | Visor",
    description:
      "Author a complete brand system on the live Visor theme engine — strategy, voice, and tone, assembling live.",
  },
}

export default function BrandWorkbenchLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
