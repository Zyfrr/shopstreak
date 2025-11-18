"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock?: number;
  inStock?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setItems(result.data.items || []);
        }
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, user]);

  const addItem = async (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    if (!isAuthenticated) {
      throw new Error("Please login to add items to cart");
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.id,
          quantity: quantity,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      await fetchCart();
    } catch (error) {
      console.error("Error adding item to cart:", error);
      throw error;
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      await fetchCart();
    } catch (error) {
      console.error("Error updating cart quantity:", error);
      throw error;
    }
  };

  const removeItem = async (productId: string) => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/cart?productId=${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      await fetchCart();
    } catch (error) {
      console.error("Error removing item from cart:", error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      await fetchCart();
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  };

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
    isLoading,
    refreshCart: fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}