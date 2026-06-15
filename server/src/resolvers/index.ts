import { RedisPubSub } from 'graphql-redis-subscriptions'
import Redis from 'ioredis'
import { OrderStatus, Role } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { logger } from '../lib/logger'
import { notifySlack } from '../lib/slack'
import {
  AuthContext,
  AuthError,
  requireAdmin,
  requireStaff,
} from '../lib/auth'

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
}

const pubsub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions),
})

const ORDER_CREATED = 'ORDER_CREATED'
const ORDER_STATUS_UPDATED = 'ORDER_STATUS_UPDATED'

interface CreateOrderInput {
  customerName: string
  customerEmail?: string
  product: string
  quantity: number
}

interface SyncUserInput {
  email: string
  name?: string
  image?: string
}

interface MenuItemInput {
  id?: string
  name: string
  description: string
  rate: number
  category: string
  available?: boolean
}

// Resolve a desired role from env-configured allow-lists so the first
// admin/staff can sign in without a manual DB edit.
function envRoleFor(email: string): Role | null {
  const lower = email.toLowerCase()
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())
  const staff = (process.env.STAFF_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())
  if (admins.includes(lower)) return Role.ADMIN
  if (staff.includes(lower)) return Role.STAFF
  return null
}

const toISO = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value

const resolvers = {
  Query: {
    menu: () => prisma.menuItem.findMany({ orderBy: { category: 'asc' } }),

    order: (_: unknown, { id }: { id: string }) =>
      prisma.order.findUnique({ where: { id } }),

    orders: (_: unknown, { status }: { status?: OrderStatus }, ctx: AuthContext) => {
      requireStaff(ctx)
      return prisma.order.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
      })
    },

    me: async (_: unknown, __: unknown, ctx: AuthContext) => {
      if (!ctx.userId && !ctx.email) return null
      return prisma.user.findFirst({
        where: ctx.userId ? { id: ctx.userId } : { email: ctx.email! },
      })
    },

    revenueStats: async (_: unknown, __: unknown, ctx: AuthContext) => {
      requireAdmin(ctx)
      const [completed, totalOrders, pendingOrders] = await Promise.all([
        prisma.order.findMany({ where: { status: OrderStatus.COMPLETED } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      ])
      const totalRevenue = completed.reduce((sum, o) => sum + o.price * o.quantity, 0)
      const completedOrders = completed.length
      return {
        totalRevenue,
        completedOrders,
        totalOrders,
        pendingOrders,
        averageOrderValue: completedOrders ? totalRevenue / completedOrders : 0,
      }
    },
  },

  Mutation: {
    createOrder: async (_: unknown, { input }: { input: CreateOrderInput }) => {
      if (input.quantity < 1) {
        throw new AuthError('Quantity must be at least 1', 'BAD_USER_INPUT')
      }

      // Trust the server-side menu price, never a client-supplied amount.
      const menuItem = await prisma.menuItem.findFirst({
        where: { name: input.product, available: true },
      })
      if (!menuItem) {
        throw new AuthError('Selected item is not available', 'BAD_USER_INPUT')
      }

      const order = await prisma.order.create({
        data: {
          customerName: input.customerName,
          customerEmail: input.customerEmail || null,
          product: menuItem.name,
          quantity: input.quantity,
          price: menuItem.rate,
          status: OrderStatus.PENDING,
          events: {
            create: {
              type: 'ORDER_CREATED',
              message: `Order placed by ${input.customerName}`,
              toStatus: OrderStatus.PENDING,
            },
          },
        },
      })

      logger.info('Order created', { orderId: order.id, product: order.product })
      await pubsub.publish(ORDER_CREATED, { orderCreated: order })
      void notifySlack(
        `:bell: New order *#${order.id.slice(0, 8)}* — ${order.quantity}× ${order.product} for ${order.customerName} ($${(order.price * order.quantity).toFixed(2)})`
      )

      return order
    },

    updateOrderStatus: async (
      _: unknown,
      { id, status }: { id: string; status: OrderStatus },
      ctx: AuthContext
    ) => {
      requireStaff(ctx)

      const existing = await prisma.order.findUnique({ where: { id } })
      if (!existing) throw new AuthError('Order not found', 'NOT_FOUND')

      const actorName = ctx.email || 'Staff'
      const order = await prisma.order.update({
        where: { id },
        data: {
          status,
          events: {
            create: {
              type: 'STATUS_CHANGED',
              message: `Status changed from ${existing.status} to ${status}`,
              fromStatus: existing.status,
              toStatus: status,
              actorName,
              ...(ctx.userId ? { actor: { connect: { id: ctx.userId } } } : {}),
            },
          },
        },
      })

      logger.info('Order status updated', { orderId: id, from: existing.status, to: status, actorName })
      await pubsub.publish(ORDER_STATUS_UPDATED, { orderStatusUpdated: order })
      if (status === OrderStatus.CANCELLED) {
        void notifySlack(`:warning: Order *#${order.id.slice(0, 8)}* was cancelled by ${actorName}`)
      }

      return order
    },

    upsertMenuItem: async (_: unknown, { input }: { input: MenuItemInput }, ctx: AuthContext) => {
      requireAdmin(ctx)
      const data = {
        name: input.name,
        description: input.description,
        rate: input.rate,
        category: input.category,
        available: input.available ?? true,
      }
      if (input.id) {
        return prisma.menuItem.update({ where: { id: input.id }, data })
      }
      return prisma.menuItem.create({ data })
    },

    setMenuItemAvailability: async (
      _: unknown,
      { id, available }: { id: string; available: boolean },
      ctx: AuthContext
    ) => {
      requireAdmin(ctx)
      return prisma.menuItem.update({ where: { id }, data: { available } })
    },

    syncUser: async (_: unknown, { input }: { input: SyncUserInput }, ctx: AuthContext) => {
      // Only the trusted Next.js server may sync users.
      if (!ctx.isService) throw new AuthError('Service token required', 'FORBIDDEN')

      const email = input.email.toLowerCase()
      const desiredRole = envRoleFor(email)

      const existing = await prisma.user.findUnique({ where: { email } })
      if (!existing) {
        return prisma.user.create({
          data: {
            email,
            name: input.name || null,
            image: input.image || null,
            role: desiredRole ?? Role.CUSTOMER,
          },
        })
      }

      // Keep existing role unless env promotes the user to a higher one.
      const rank: Record<Role, number> = { CUSTOMER: 0, STAFF: 1, ADMIN: 2 }
      const nextRole =
        desiredRole && rank[desiredRole] > rank[existing.role] ? desiredRole : existing.role

      return prisma.user.update({
        where: { email },
        data: {
          name: input.name ?? existing.name,
          image: input.image ?? existing.image,
          role: nextRole,
        },
      })
    },
  },

  Order: {
    createdAt: (o: { createdAt: Date | string }) => toISO(o.createdAt),
    updatedAt: (o: { updatedAt: Date | string }) => toISO(o.updatedAt),
    total: (o: { price: number; quantity: number }) => o.price * o.quantity,
    events: (o: { id: string }) =>
      prisma.orderEvent.findMany({ where: { orderId: o.id }, orderBy: { createdAt: 'asc' } }),
  },

  OrderEvent: {
    createdAt: (e: { createdAt: Date | string }) => toISO(e.createdAt),
  },

  Subscription: {
    orderCreated: {
      subscribe: () => pubsub.asyncIterator([ORDER_CREATED]),
    },
    orderStatusUpdated: {
      subscribe: () => pubsub.asyncIterator([ORDER_STATUS_UPDATED]),
      resolve: (payload: any, { orderId }: { orderId?: string }) => {
        if (orderId && payload.orderStatusUpdated.id !== orderId) {
          return null
        }
        return payload.orderStatusUpdated
      },
    },
  },
}

export { resolvers }
