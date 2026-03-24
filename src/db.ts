import { createClient } from '@neondatabase/neon-js'
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react'

export const neonClient = createClient({
  auth: {
    adapter: BetterAuthReactAdapter(),
    url: import.meta.env.VITE_NEON_AUTH_URL,
  },
  dataApi: {
    url: import.meta.env.VITE_NEON_DATA_API_URL,
  },
})
