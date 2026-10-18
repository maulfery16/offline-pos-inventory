'use client'
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface CartItem {
  productId: string
  name: string
  sku: string
  quantity: number
  sellingPrice: number
  expiryStatus: string // 'ok' | 'warning' | 'blocked'
}

export interface HeldTransaction {
  id: string
  items: CartItem[]
  timestamp: number
}

interface CartState {
  items: CartItem[]
  heldTransactions: HeldTransaction[]
  paymentMethod: 'tunai' | 'qris' | 'kartu' | null
  cashReceived: number
  // computed (use get() pattern)
  subtotal: () => number
  change: () => number
  // actions
  addItem: (product: Omit<CartItem, 'quantity'>) => void
  updateQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  voidItem: (productId: string) => void
  holdTransaction: () => void
  restoreTransaction: (id: string) => void
  clearCart: () => void
  setPaymentMethod: (method: 'tunai' | 'qris' | 'kartu') => void
  setCashReceived: (amount: number) => void
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  heldTransactions: [],
  paymentMethod: null,
  cashReceived: 0,

  subtotal: () =>
    get().items.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0),

  change: () => Math.max(0, get().cashReceived - get().subtotal()),

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.sku === product.sku)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.sku === product.sku ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return { items: [...state.items, { ...product, quantity: 1 }] }
    }),

  updateQty: (productId, qty) =>
    set((state) => ({
      items:
        qty <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.map((i) =>
              i.productId === productId ? { ...i, quantity: qty } : i
            ),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  voidItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  holdTransaction: () =>
    set((state) => {
      if (state.items.length === 0) return state
      const held: HeldTransaction = {
        id: uuidv4(),
        items: [...state.items],
        timestamp: Date.now(),
      }
      return {
        items: [],
        heldTransactions: [...state.heldTransactions, held],
        paymentMethod: null,
        cashReceived: 0,
      }
    }),

  restoreTransaction: (id) =>
    set((state) => {
      const held = state.heldTransactions.find((t) => t.id === id)
      if (!held) return state
      return {
        items: [...held.items],
        heldTransactions: state.heldTransactions.filter((t) => t.id !== id),
        paymentMethod: null,
        cashReceived: 0,
      }
    }),

  clearCart: () =>
    set({ items: [], paymentMethod: null, cashReceived: 0 }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setCashReceived: (amount) => set({ cashReceived: amount }),
}))
