'use client'

import { useEffect } from 'react'
import { useQuery } from '@apollo/client/react'
import { GET_REVENUE_STATS, GET_ORDERS } from '@/lib/graphql/queries'
import { Order, RevenueStats } from '@/types/order'
import { statusColors } from '@/components/OrderCard'

interface RevenueData {
  revenueStats: RevenueStats
}
interface GetOrdersData {
  orders: Order[]
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent || 'text-gray-800'}`}>{value}</p>
    </div>
  )
}

export default function AdminPage() {
  useEffect(() => {
    document.title = 'Food Order - Admin'
  }, [])

  const { data: statsData, loading: statsLoading, error } = useQuery<RevenueData>(GET_REVENUE_STATS)
  const { data: ordersData } = useQuery<GetOrdersData>(GET_ORDERS)

  const stats = statsData?.revenueStats
  const recentOrders = (ordersData?.orders || []).slice(0, 8)

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading dashboard.</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Total Revenue (completed)"
          value={statsLoading ? '...' : `$${(stats?.totalRevenue || 0).toFixed(2)}`}
          accent="text-green-600"
        />
        <StatCard
          label="Completed Orders"
          value={statsLoading ? '...' : String(stats?.completedOrders ?? 0)}
        />
        <StatCard
          label="Pending Orders"
          value={statsLoading ? '...' : String(stats?.pendingOrders ?? 0)}
          accent="text-yellow-600"
        />
        <StatCard
          label="Avg Order Value"
          value={statsLoading ? '...' : `$${(stats?.averageOrderValue || 0).toFixed(2)}`}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                  <td className="py-2 pr-4">{order.customerName}</td>
                  <td className="py-2 pr-4">
                    {order.quantity}× {order.product}
                  </td>
                  <td className="py-2 pr-4 font-medium">
                    ${(order.total ?? order.price * order.quantity).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        statusColors[order.status]
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
