'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { CreateOrderInput, MenuItem } from '@/types/order'
import { GET_MENU } from '@/lib/graphql/queries'

interface OrderFormProps {
  onSubmit: (input: CreateOrderInput) => void
  loading?: boolean
}

export default function OrderForm({ onSubmit, loading }: OrderFormProps) {
  const { data, loading: itemsLoading } = useQuery<{ menu: MenuItem[] }>(GET_MENU)

  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)

  const availableItems = useMemo(
    () => (data?.menu || []).filter((item) => item.available),
    [data]
  )
  const selectedItem = availableItems.find((item) => item.id === productId)
  const total = selectedItem ? selectedItem.rate * quantity : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    onSubmit({
      customerName,
      customerEmail: customerEmail || undefined,
      product: selectedItem.name,
      quantity,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Place Your Order</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-gray-400">(optional, for updates)</span>
          </label>
          <input
            type="email"
            id="customerEmail"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
            Item
          </label>
          <select
            id="product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            disabled={itemsLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{itemsLoading ? 'Loading menu...' : 'Select an item'}</option>
            {availableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} - ${item.rate.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            min="1"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-gray-600">Total</span>
          <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !selectedItem}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </form>
  )
}
