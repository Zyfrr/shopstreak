"use client"

import { useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { categories } from "@/lib/product-data"

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  isOpen: boolean
  onToggle: () => void
}

export interface FilterState {
  category?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
}

export function ProductFilters({ onFilterChange, isOpen, onToggle }: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({})
  const [priceRange, setPriceRange] = useState([0, 50000])

  const handleCategoryChange = (category: string) => {
    const newFilters = category === "all" ? { ...filters, category: undefined } : { ...filters, category }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value)
    const newFilters = { ...filters, minPrice: value[0], maxPrice: value[1] }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleRatingChange = (rating: number) => {
    const newFilters =
      filters.minRating === rating ? { ...filters, minRating: undefined } : { ...filters, minRating: rating }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    setPriceRange([0, 50000])
    onFilterChange({})
  }

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined).length

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="md:hidden sticky top-16 bg-card border-b border-border z-30">
        <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between font-medium text-sm">
          <span>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </span>
          <ChevronDown className={`w-5 h-5 transition ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Filter Panel */}
      <aside
        className={`fixed md:relative md:w-64 md:h-auto md:block top-0 left-0 right-0 bottom-0 bg-card z-40 md:z-auto transform transition-transform md:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 md:p-6 h-full overflow-y-auto md:sticky md:top-20">
          {/* Close Button */}
          <button onClick={onToggle} className="md:hidden mb-4 p-2 hover:bg-muted rounded-lg">
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Filters</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-primary text-sm font-medium hover:underline">
                Clear All
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="mb-6 pb-6 border-b border-border">
            <h4 className="font-medium mb-3 text-sm">Category</h4>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={filters.category === cat.id || (cat.id === "all" && !filters.category)}
                    onChange={() => handleCategoryChange(cat.id)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="mb-6 pb-6 border-b border-border">
            <h4 className="font-medium mb-3 text-sm">Price Range</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">₹{priceRange[0]}</span>
                <span className="text-sm text-muted-foreground">-</span>
                <span className="text-sm text-muted-foreground">₹{priceRange[1]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50000"
                value={priceRange[1]}
                onChange={(e) => handlePriceChange([priceRange[0], Number.parseInt(e.target.value)])}
                className="w-full"
              />
            </div>
          </div>

          {/* Rating Filter */}
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-sm">Rating</h4>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <label key={rating} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.minRating === rating}
                    onChange={() => handleRatingChange(rating)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{rating}</span>
                    <span className="text-yellow-500">★</span>
                    <span className="text-muted-foreground text-xs">& above</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
