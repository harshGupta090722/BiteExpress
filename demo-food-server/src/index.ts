import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default'
import { expressMiddleware } from '@as-integrations/express5'
import { makeExecutableSchema } from '@graphql-tools/schema'
import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/use/ws'
import { createServer } from 'http'
import { typeDefs } from './typedef'
import { resolvers } from './resolvers'
import { buildAuthContext, AuthContext } from './lib/auth'
import { logger } from './lib/logger'

const schema = makeExecutableSchema({ typeDefs, resolvers })
const app = express()
const httpServer = createServer(app)

// WebSocket server for GraphQL subscriptions.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
})

const serverCleanup = useServer(
  {
    schema,
    // Build auth context from the connection params the client sends on connect.
    context: async (ctx): Promise<AuthContext> => {
      return buildAuthContext((ctx.connectionParams || {}) as Record<string, unknown>)
    },
  },
  wsServer
)

const server = new ApolloServer<AuthContext>({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    process.env.NODE_ENV === 'production'
      ? ApolloServerPluginLandingPageProductionDefault()
      : ApolloServerPluginLandingPageLocalDefault(),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose()
          },
        }
      },
    },
  ],
})

async function startServer() {
  await server.start()
  app.use(
    '/graphql',
    cors({
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      // Build auth context per HTTP request from headers.
      context: async ({ req }): Promise<AuthContext> =>
        buildAuthContext(req.headers as Record<string, unknown>),
    })
  )

  const PORT = Number(process.env.PORT || 4000)
  httpServer.listen(PORT, () => {
    logger.info(`Server ready at http://localhost:${PORT}/graphql`)
    logger.info(`Subscriptions ready at ws://localhost:${PORT}/graphql`)
  })
}

startServer().catch((error) => {
  logger.error('Failed to start server', { error: (error as Error).message })
})
