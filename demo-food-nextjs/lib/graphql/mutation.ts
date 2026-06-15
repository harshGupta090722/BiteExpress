import { gql } from '@apollo/client'

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      customerName
      product
      quantity
      price
      status
      total
      createdAt
    }
  }
`

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {
    updateOrderStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`

export const UPSERT_MENU_ITEM = gql`
  mutation UpsertMenuItem($input: MenuItemInput!) {
    upsertMenuItem(input: $input) {
      id
      name
      description
      rate
      category
      available
    }
  }
`

export const SET_MENU_ITEM_AVAILABILITY = gql`
  mutation SetMenuItemAvailability($id: ID!, $available: Boolean!) {
    setMenuItemAvailability(id: $id, available: $available) {
      id
      available
    }
  }
`
