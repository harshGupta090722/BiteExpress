import 'server-only'

// Server-to-server call into the Apollo server to create/fetch the user record
// and resolve their role. Authorized with the shared SERVICE_TOKEN, never the
// end-user's token (which doesn't exist yet during sign-in).

const GRAPHQL_ENDPOINT =
  process.env.GRAPHQL_ENDPOINT ||
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  'http://localhost:4000/graphql'

const SYNC_USER_MUTATION = `
  mutation SyncUser($input: SyncUserInput!) {
    syncUser(input: $input) {
      id
      email
      name
      role
    }
  }
`

export type AppRole = 'CUSTOMER' | 'STAFF' | 'ADMIN'

export interface SyncedUser {
  id: string
  email: string
  name: string | null
  role: AppRole
}

export async function syncUser(input: {
  email: string
  name?: string | null
  image?: string | null
}): Promise<SyncedUser | null> {
  const serviceToken = process.env.SERVICE_TOKEN
  if (!serviceToken) {
    console.error('[syncUser] SERVICE_TOKEN is not set')
    return null
  }

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-token': serviceToken,
      },
      body: JSON.stringify({
        query: SYNC_USER_MUTATION,
        variables: {
          input: {
            email: input.email,
            name: input.name ?? null,
            image: input.image ?? null,
          },
        },
      }),
      cache: 'no-store',
    })

    const json = await res.json()
    if (json.errors) {
      console.error('[syncUser] GraphQL errors', json.errors)
      return null
    }
    return json.data?.syncUser ?? null
  } catch (err) {
    console.error('[syncUser] request failed', err)
    return null
  }
}
