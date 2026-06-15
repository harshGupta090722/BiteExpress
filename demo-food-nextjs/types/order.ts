export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PROCESSING = 'PROCESSING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN'

export interface OrderEvent {
  id: string
  type: string
  message: string
  fromStatus?: OrderStatus | null
  toStatus?: OrderStatus | null
  actorName?: string | null
  createdAt: string
}

export interface Order {
  id: string
  customerName: string
  customerEmail?: string | null
  product: string
  quantity: number
  price: number
  status: OrderStatus
  total: number
  createdAt: string
  updatedAt: string
  events?: OrderEvent[]
}

export interface MenuItem {
  id: string
  name: string
  description: string
  rate: number
  category: string
  available: boolean
}

export interface RevenueStats {
  totalRevenue: number
  completedOrders: number
  totalOrders: number
  pendingOrders: number
  averageOrderValue: number
}

export interface CreateOrderInput {
  customerName: string
  customerEmail?: string
  product: string
  quantity: number
}
