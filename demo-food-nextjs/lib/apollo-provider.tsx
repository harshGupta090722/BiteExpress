'use client'

import { ApolloProvider as ApolloProviderBase } from '@apollo/client/react'
import { SessionProvider } from 'next-auth/react'
import client from './apollo-client'
import React from 'react'

// Wraps the app with both the auth session context and the Apollo client so
// every page can use GraphQL hooks and read the current user.
export default function ApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApolloProviderBase client={client}>{children}</ApolloProviderBase>
    </SessionProvider>
  )
}
