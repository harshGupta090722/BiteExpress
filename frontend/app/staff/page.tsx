'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { GET_ORDERS } from '@/lib/graphql/queries'
import { UPDATE_ORDER_STATUS } from '@/lib/graphql/mutation'
import { ORDER_CREATED_SUBSCRIPTION } from '@/lib/graphql/subscription'
import OrderList from '@/components/OrderList'
import { Order, OrderStatus } from '@/types/order'

interface GetOrdersData {
  orders: Order[]
}

interface OrderCreatedData {
  orderCreated: Order
}

const STATUS_FILTERS = ['ALL', ...Object.values(OrderStatus)] as const

export default function StaffPage() {
  const [filter, setFilter] = useState<string>('ALL')

  const { data, loading, error, subscribeToMore } = useQuery<GetOrdersData>(GET_ORDERS)

  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS, {
    refetchQueries: [{ query: GET_ORDERS }],
  })

  useEffect(() => {
    document.title = 'BiteExpress - Staff'
  }, [])

  // Live: prepend newly created orders to the queue.
  useEffect(() => {
    const unsubscribe = subscribeToMore<OrderCreatedData>({
      document: ORDER_CREATED_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        const prevData = prev as unknown as GetOrdersData
        if (!subscriptionData.data) return prevData
        const newOrder = subscriptionData.data.orderCreated
        const existing = prevData.orders || []
        if (existing.some((o) => o.id === newOrder.id)) return prevData
        return { orders: [newOrder, ...existing] }
      },
    })
    return () => unsubscribe()
  }, [subscribeToMore])

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus({ variables: { id, status } })
    } catch (err) {
      console.error('Error updating order status:', err)
    }
  }

  const orders = data?.orders || []
  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading orders.</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Order Management</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Showing {filtered.length} of {orders.length} orders
      </p>

      <OrderList orders={filtered} loading={loading} onStatusChange={handleStatusChange} />
    </div>
  )
}
