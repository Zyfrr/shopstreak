"use client";

import React from "react";
import { AuthProvider } from "@/components/contexts/auth-context";
import { CartProvider } from "@/components/contexts/cart-context";

interface RootProviderProps {
  children: React.ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  );
}