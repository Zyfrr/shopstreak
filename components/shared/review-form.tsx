// components/shared/review-form.tsx - UPDATED
"use client"

import { useState, useEffect } from "react"
import { Star, X, Loader2 } from "lucide-react"
import { useAuth } from "@/components/contexts/auth-context"
import { useToast } from "@/components/providers/toast-provider"

interface ReviewFormProps {
  productId: string
  productName: string
  onSuccess: () => void
  onCancel: () => void
  editReview?: {
    id: string
    rating: number
    title: string
    comment: string
  }
}

export function ReviewForm({ productId, productName, onSuccess, onCancel, editReview }: ReviewFormProps) {
  const [rating, setRating] = useState(editReview?.rating || 0)
  const [title, setTitle] = useState(editReview?.title || '')
  const [comment, setComment] = useState(editReview?.comment || '')
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const { isAuthenticated, user } = useAuth()
  const { addToast } = useToast()

  // Reset form when editReview changes
  useEffect(() => {
    if (editReview) {
      setRating(editReview.rating)
      setTitle(editReview.title)
      setComment(editReview.comment)
    } else {
      setRating(0)
      setTitle('')
      setComment('')
    }
    setError('')
  }, [editReview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isAuthenticated) {
      setError('Please login to submit a review')
      return
    }

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (!title.trim()) {
      setError('Please enter a review title')
      return
    }

    if (!comment.trim()) {
      setError('Please enter your review')
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const url = editReview 
        ? `/api/products/review/${editReview.id}`
        : '/api/products/review'
      
      const method = editReview ? 'PUT' : 'POST'

      console.log('📤 Sending review data:', {
        productId,
        rating,
        title: title.trim(),
        description: comment.trim(), // This maps to SS_REVIEW_DESCRIPTION in backend
      })

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          description: comment.trim(), // FIXED: Send as description
        }),
      })

      const result = await response.json()
      
      console.log('📥 Review API response:', result)
      
      if (result.success) {
        addToast({
          type: "success",
          title: editReview ? "Review Updated" : "Review Submitted",
          message: editReview 
            ? "Your review has been updated successfully" 
            : "Thank you for your review!",
          duration: 3000
        })
        onSuccess()
      } else {
        const errorMsg = result.error || 'Failed to submit review'
        setError(errorMsg)
        console.error('❌ Review submission failed:', errorMsg)
        addToast({
          type: "error",
          title: "Submission failed",
          message: errorMsg,
          duration: 5000
        })
      }
    } catch (err) {
      const errorMsg = 'An error occurred while submitting your review'
      setError(errorMsg)
      console.error('❌ Review submission error:', err)
      addToast({
        type: "error",
        title: "Submission failed",
        message: errorMsg,
        duration: 5000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-bold">
            {editReview ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-muted rounded transition"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <h4 className="font-semibold mb-2">{productName}</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {editReview ? 'Update your review' : 'Share your experience with this product'}
            </p>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Review Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input"
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              Your Review *
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details of your experience with this product..."
              rows={5}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input resize-none"
              maxLength={1000}
              disabled={isSubmitting}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {comment.length}/1000
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editReview ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}