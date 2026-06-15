import { Order, OrderStatus } from '@/types/order'

interface OrderCardProps {
  order: Order
  onStatusChange?: (id: string, status: OrderStatus) => void
}

export const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const total = order.total ?? order.price * order.quantity

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{order.customerName}</h3>
          <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}
        >
          {order.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Product:</span>
          <span className="font-medium">{order.product}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Quantity:</span>
          <span className="font-medium">{order.quantity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Price:</span>
          <span className="font-medium">${order.price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total:</span>
          <span className="font-bold text-lg">${total.toFixed(2)}</span>
        </div>
      </div>

      {onStatusChange &&
        order.status !== OrderStatus.COMPLETED &&
        order.status !== OrderStatus.CANCELLED && (
          <div className="mt-4 pt-4 border-t">
            <label className="block text-xs font-medium text-gray-500 mb-1">Update status</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
              value={order.status}
            >
              <option value={OrderStatus.PENDING}>Pending</option>
              <option value={OrderStatus.ACCEPTED}>Accepted</option>
              <option value={OrderStatus.PROCESSING}>Processing</option>
              <option value={OrderStatus.READY_FOR_PICKUP}>Ready for Pickup</option>
              <option value={OrderStatus.COMPLETED}>Completed</option>
              <option value={OrderStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
        )}
    </div>
  )
}
