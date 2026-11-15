import 'server-only'
import { headers } from 'next/headers'

/** Endereço do site como a pessoa está acessando (ex.: https://erikadiaspsi.com.br). */
export async function enderecoBase(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
