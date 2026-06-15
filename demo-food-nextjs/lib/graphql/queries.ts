import { gql } from '@apollo/client'

export const GET_MENU = gql`
  query GetMenu {
    menu {
      id
      name
      description
      rate
      category
      available
    }
  }
`

export const GET_ORDERS = gql`
  query GetOrders($status: OrderStatus) {
    orders(status: $status) {
      id
      customerName
      customerEmail
      product
      quantity
      price
      status
      total
      createdAt
      updatedAt
    }
  }
`

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      customerName
      customerEmail
      product
      quantity
      price
      status
      total
      createdAt
      updatedAt
      events {
        id
        type
        message
        fromStatus
        toStatus
        actorName
        createdAt
      }
    }
  }
`

export const GET_REVENUE_STATS = gql`
  query GetRevenueStats {
    revenueStats {
      totalRevenue
      completedOrders
      totalOrders
      pendingOrders
      averageOrderValue
    }
  }
`

export const ME = gql`
  query Me {
    me {
      id
      email
      name
      role
    }
  }
`
