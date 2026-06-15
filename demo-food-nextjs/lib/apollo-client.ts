import { ApolloClient, HttpLink, InMemoryCache, ApolloLink } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { setContext } from '@apollo/client/link/context'
import { createClient } from 'graphql-ws'
import { OperationTypeNode } from 'graphql'
import { getSession } from 'next-auth/react'

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
  credentials: 'same-origin',
})

// Attach the backend JWT (minted by NextAuth) to every HTTP request so the
// Apollo server can identify staff/admin users.
const authLink = setContext(async (_, { headers }) => {
  const session = await getSession()
  const token = session?.backendToken
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }
})

// WebSocket link for subscriptions; auth travels in connectionParams.
const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || 'ws://localhost:4000/graphql',
    connectionParams: async () => {
      const session = await getSession()
      return session?.backendToken
        ? { authorization: `Bearer ${session.backendToken}` }
        : {}
    },
  })
)

const splitLink = ApolloLink.split(
  ({ operationType }) => operationType === OperationTypeNode.SUBSCRIPTION,
  wsLink,
  ApolloLink.from([authLink, httpLink])
)

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})

export default client
