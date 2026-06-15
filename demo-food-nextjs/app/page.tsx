'use client'

import Link from 'next/link'
import { useMutation, useQuery } from '@apollo/client/react'
import { useState } from 'react'
import OrderForm from '@/components/OrderForm'
import { CREATE_ORDER } from '@/lib/graphql/mutation'
import { GET_MENU } from '@/lib/graphql/queries'
import { CreateOrderInput, MenuItem, Order } from '@/types/order'

interface CreateOrderData {
  createOrder: Order
}

export default function Home() {
  const { data: menuData, loading: menuLoading } = useQuery<{ menu: MenuItem[] }>(GET_MENU)
  const [createOrder, { loading, error }] = useMutation<CreateOrderData>(CREATE_ORDER)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  const handleSubmit = async (input: CreateOrderInput) => {
    try {
      const res = await createOrder({ variables: { input } })
      if (res.data?.createOrder) {
        setPlacedOrder(res.data.createOrder)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err) {
      console.error('Error creating order:', err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Food Orders Management</h1>
        <p className="text-lg text-gray-600">Powered by Next.js and Apollo GraphQL</p>
      </div>

      {placedOrder && (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-green-50 border border-green-300 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-green-800 mb-2">Order placed!</h2>
            <p className="text-green-700">
              Thanks {placedOrder.customerName}. Your order ID is{' '}
              <span className="font-mono font-semibold">#{placedOrder.id.slice(0, 8)}</span>
            </p>
            <p className="text-sm text-green-700 mt-2">
              Keep this ID to{' '}
              <Link href={`/track?id=${placedOrder.id}`} className="underline font-medium">
                track your order
              </Link>
              .
            </p>
            <p className="text-xs text-gray-500 mt-2 break-all">Full ID: {placedOrder.id}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Menu</h2>
          {menuLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(menuData?.menu || []).map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow-md p-4 flex justify-between items-start ${
                    item.available ? '' : 'opacity-50'
                  }`}
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <span className="inline-block mt-1 text-xs text-gray-400">{item.category}</span>
                  </div>
                  <span className="font-bold text-blue-600 whitespace-nowrap ml-4">
                    ${item.rate.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>Could not place order.</p>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          )}
          <OrderForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </div>
  )
}
