// components/shared/review-card.tsx - UPDATED (Better name display)
"use client"

import { ThumbsUp, ThumbsDown, Edit, Trash2, Star } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/contexts/auth-context"
import { useToast } from "@/components/providers/toast-provider"

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  unhelpful: number;
  createdAt: string;
  adminResponse?: {
    response: string;
    respondedAt: string;
  };
}

interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const [helpful, setHelpful] = useState(review.helpful || 0)
  const [unhelpful, setUnhelpful] = useState(review.unhelpful || 0)
  const [userVote, setUserVote] = useState<"helpful" | "unhelpful" | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const { addToast } = useToast()
  
  const isOwner = user?.id === review.userId

  // Fetch user's vote status when component mounts
  useEffect(() => {
    if (isAuthenticated && !isOwner) {
      fetchUserVoteStatus()
    }
  }, [review.id, isAuthenticated, isOwner])

  const fetchUserVoteStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return;

      const response = await fetch(`/api/products/review/vote?reviewId=${review.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUserVote(result.data.userVote)
          setHelpful(result.data.helpfulCount)
          setUnhelpful(result.data.unhelpfulCount)
        }
      } else {
        console.error('Failed to fetch vote status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching vote status:', error)
    }
  }

  const handleVote = async (voteType: "helpful" | "unhelpful") => {
    if (!isAuthenticated) {
      addToast({
        type: "warning",
        title: "Login required",
        message: "Please login to vote on reviews",
        duration: 3000
      })
      return
    }

    if (isOwner) {
      addToast({
        type: "warning",
        title: "Cannot vote",
        message: "You cannot vote on your own review",
        duration: 3000
      })
      return
    }

    setIsVoting(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      console.log('🔄 Sending vote:', { reviewId: review.id, voteType })

      const response = await fetch('/api/products/review/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          reviewId: review.id, 
          voteType 
        }),
      })

      const result = await response.json()
      
      console.log('📥 Vote response:', result)

      if (result.success) {
        // Update local state immediately for better UX
        setHelpful(result.data.helpfulCount)
        setUnhelpful(result.data.unhelpfulCount)
        setUserVote(result.data.userVote)
        
        addToast({
          type: "success",
          title: "Vote recorded",
          message: result.data.message,
          duration: 2000
        })
      } else {
        console.error('Vote API error:', result.error)
        addToast({
          type: "error",
          title: "Vote failed",
          message: result.error || 'Failed to record vote',
          duration: 5000
        })
      }
    } catch (error) {
      console.error('❌ Error voting on review:', error)
      addToast({
        type: "error",
        title: "Vote failed",
        message: "Failed to record vote. Please try again.",
        duration: 5000
      })
    } finally {
      setIsVoting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    })
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold">{review.rating}.0</span>
            
            {review.verified && (
              <div className="bg-green-500/10 text-green-700 text-xs px-2 py-1 rounded border border-green-200">
                ✓ Verified Purchase
              </div>
            )}
          </div>
          
          <h4 className="font-semibold text-base mb-1">{review.title}</h4>
        </div>

        {/* Only show edit/delete buttons to the review owner */}
        {isOwner && onEdit && onDelete && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onEdit(review)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
              title="Edit review"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(review.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
              title="Delete review"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <p className="text-muted-foreground mb-4 leading-relaxed whitespace-pre-wrap">
        {review.comment || "No description provided"}
      </p>

      <div className="flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* FIXED: Show proper user name */}
          <span className="font-medium text-foreground">
            {review.userName === 'Anonymous' ? 'Anonymous User' : review.userName}
          </span>
          <span>•</span>
          <span>{formatDate(review.createdAt)}</span>
        </div>
        
        {/* Voting buttons - hidden for review owner */}
        {!isOwner && (
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Was this helpful?</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleVote("helpful")}
                disabled={isVoting}
                className={`flex items-center gap-1 px-2 py-1 rounded border transition text-xs ${
                  userVote === "helpful"
                    ? "bg-green-500/10 border-green-200 text-green-700 font-medium"
                    : "border-border hover:bg-muted"
                } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ThumbsUp className="w-3 h-3" />
                {helpful}
              </button>
              <button
                onClick={() => handleVote("unhelpful")}
                disabled={isVoting}
                className={`flex items-center gap-1 px-2 py-1 rounded border transition text-xs ${
                  userVote === "unhelpful" 
                    ? "bg-red-500/10 border-red-200 text-red-700 font-medium" 
                    : "border-border hover:bg-muted"
                } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ThumbsDown className="w-3 h-3" />
                {unhelpful}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Response */}
      {review.adminResponse && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-blue-900">Admin Response</span>
                <span className="text-xs text-blue-700">
                  {formatDate(review.adminResponse.respondedAt)}
                </span>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">
                {review.adminResponse.response}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}