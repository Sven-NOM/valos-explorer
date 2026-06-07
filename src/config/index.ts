export const SPEC_URL = import.meta.env.VITE_SPEC_URL as string
  ?? 'https://lidofinance.github.io/valos/valos-spec.html'

export const CERT_URL = import.meta.env.VITE_CERT_URL as string
  ?? 'https://lido.fi/valos'

export function specDeepLink(anchor: string): string {
  return `${SPEC_URL}#${anchor}`
}
