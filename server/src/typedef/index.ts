const typeDefs = `#graphql
  enum OrderStatus {
    PENDING
    ACCEPTED
    PROCESSING
    READY_FOR_PICKUP
    COMPLETED
    CANCELLED
  }

  enum Role {
    CUSTOMER
    STAFF
    ADMIN
  }

  type Order {
    id: ID!
    customerName: String!
    customerEmail: String
    product: String!
    quantity: Int!
    price: Float!
    status: OrderStatus!
    createdAt: String!
    updatedAt: String!
    total: Float!
    events: [OrderEvent!]!
  }

  type OrderEvent {
    id: ID!
    type: String!
    message: String!
    fromStatus: OrderStatus
    toStatus: OrderStatus
    actorName: String
    createdAt: String!
  }

  type MenuItem {
    id: ID!
    name: String!
    description: String!
    rate: Float!
    category: String!
    available: Boolean!
  }

  type User {
    id: ID!
    email: String!
    name: String
    role: Role!
  }

  type RevenueStats {
    totalRevenue: Float!
    completedOrders: Int!
    totalOrders: Int!
    pendingOrders: Int!
    averageOrderValue: Float!
  }

  input CreateOrderInput {
    customerName: String!
    customerEmail: String
    product: String!
    quantity: Int!
  }

  input SyncUserInput {
    email: String!
    name: String
    image: String
  }

  input MenuItemInput {
    id: ID
    name: String!
    description: String!
    rate: Float!
    category: String!
    available: Boolean
  }

  type Query {
    # Public
    menu: [MenuItem!]!
    order(id: ID!): Order

    # Staff / Admin
    orders(status: OrderStatus): [Order!]!

    # Authenticated
    me: User

    # Admin only
    revenueStats: RevenueStats!
  }

  type Mutation {
    # Public guest checkout. Price is resolved server-side from the menu.
    createOrder(input: CreateOrderInput!): Order!

    # Staff / Admin
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!

    # Admin only menu management
    upsertMenuItem(input: MenuItemInput!): MenuItem!
    setMenuItemAvailability(id: ID!, available: Boolean!): MenuItem!

    # Service-to-service (Next.js auth bridge)
    syncUser(input: SyncUserInput!): User!
  }

  type Subscription {
    orderCreated: Order!
    orderStatusUpdated(orderId: ID): Order!
  }
`

export { typeDefs }
