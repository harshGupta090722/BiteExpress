'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLazyQuery, useSubscription } from '@apollo/client/react'
import { GET_ORDER } from '@/lib/graphql/queries'
import { ORDER_UPDATED_SUBSCRIPTION } from '@/lib/graphql/subscription'
import OrderTimeline from '@/components/OrderTimeline'
import { Order } from '@/types/order'

interface GetOrderData {
  order: Order | null
}

interface OrderUpdatedData {
  orderUpdated: Order
}

function TrackInner() {
  const searchParams = useSearchParams()
  const initialId = searchParams.get('id') || ''

  const [orderId, setOrderId] = useState(initialId)
  const [order, setOrder] = useState<Order | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [fetchOrder, { loading }] = useLazyQuery<GetOrderData>(GET_ORDER, {
    fetchPolicy: 'network-only',
  })

  const runLookup = async (id: string) => {
    if (!id) return
    setNotFound(false)
    const res = await fetchOrder({ variables: { id } })
    if (res.data?.order) {
      setOrder(res.data.order)
    } else {
      setOrder(null)
      setNotFound(true)
    }
  }

  // Auto-lookup when arriving with ?id=...
  useEffect(() => {
    if (initialId) runLookup(initialId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId])

  // Live status updates for the order currently being viewed.
  const { data: subData } = useSubscription<OrderUpdatedData>(ORDER_UPDATED_SUBSCRIPTION, {
    variables: { orderId: order?.id },
    skip: !order?.id,
  })

  useEffect(() => {
    if (subData?.orderUpdated && order && subData.orderUpdated.id === order.id) {
      setOrder((prev) => (prev ? { ...prev, ...subData.orderUpdated } : prev))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subData])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Track Your Order</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          runLookup(orderId.trim())
        }}
        className="max-w-2xl mb-8 flex gap-2"
      >
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Enter your order ID"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !orderId.trim()}
          className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Looking up...' : 'Track'}
        </button>
      </form>

      {notFound && (
        <div className="max-w-2xl bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded">
          No order found with that ID. Double-check the ID from your confirmation.
        </div>
      )}

      {order && (
        <div className="max-w-2xl">
          <OrderTimeline order={order} />
        </div>
      )}
    </div>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-gray-500">Loading...</div>}>
      <TrackInner />
    </Suspense>
  )
}
