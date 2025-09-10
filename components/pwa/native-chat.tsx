'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Mic, MicOff, Smile, Paperclip, MoreVertical, Reply, Heart, ThumbsUp, Laugh, Sad, Angry } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileButton } from '@/components/mobile/mobile-button'
import { useHaptic } from '@/hooks/use-haptic'

interface Message {
  id: string
  content: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: Date
  type: 'text' | 'audio' | 'image'
  audioUrl?: string
  imageUrl?: string
  replyTo?: string
  reactions?: Record<string, string[]> // emoji -> user IDs
  status?: 'sending' | 'sent' | 'delivered' | 'read'
}

interface NativeChatProps {
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string, type: 'text' | 'audio', replyToId?: string) => void
  onReaction: (messageId: string, emoji: string) => void
  onStartTyping?: () => void
  onStopTyping?: () => void
  typingUsers?: Array<{ id: string; name: string }>
  className?: string
  placeholder?: string
  disabled?: boolean
}

const REACTION_EMOJIS = [
  { emoji: '❤️', key: 'heart', icon: Heart },
  { emoji: '👍', key: 'thumbs_up', icon: ThumbsUp },
  { emoji: '😂', key: 'laugh', icon: Laugh },
  { emoji: '😢', key: 'sad', icon: Sad },
  { emoji: '😠', key: 'angry', icon: Angry }
]

export function NativeChat({
  messages,
  currentUserId,
  onSendMessage,
  onReaction,
  onStartTyping,
  onStopTyping,
  typingUsers = [],
  className,
  placeholder = "Type a message...",
  disabled = false
}: NativeChatProps) {
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const { triggerHaptic } = useHaptic()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing indicators
  const handleInputChange = useCallback((value: string) => {
    setInputText(value)
    
    if (!isTyping && value.trim() && onStartTyping) {
      setIsTyping(true)
      onStartTyping()
    }
    
    // Debounce stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && onStopTyping) {
        setIsTyping(false)
        onStopTyping()
      }
    }, 1000)
  }, [isTyping, onStartTyping, onStopTyping])

  const handleSendText = useCallback(() => {
    const text = inputText.trim()
    if (!text || disabled) return
    
    triggerHaptic('medium')
    onSendMessage(text, 'text', replyTo || undefined)
    setInputText('')
    setReplyTo(null)
    
    // Stop typing indicator
    if (isTyping && onStopTyping) {
      setIsTyping(false)
      onStopTyping()
    }
  }, [inputText, disabled, replyTo, onSendMessage, triggerHaptic, isTyping, onStopTyping])

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        // Note: In a real app, you'd upload this to your server first
        onSendMessage(audioUrl, 'audio')
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      triggerHaptic('medium')
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      triggerHaptic('error')
    }
  }, [onSendMessage, triggerHaptic])

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      triggerHaptic('medium')
    }
  }, [isRecording, triggerHaptic])

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    triggerHaptic('light')
    onReaction(messageId, emoji)
    setShowReactions(null)
  }, [onReaction, triggerHaptic])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }, [handleSendText])

  const renderMessage = useCallback((message: Message) => {
    const isOwn = message.sender.id === currentUserId
    const replyToMessage = message.replyTo 
      ? messages.find(m => m.id === message.replyTo)
      : null

    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-2 group",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        {!isOwn && (
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 overflow-hidden">
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                {message.sender.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        <div className={cn("max-w-[80%]", isOwn && "flex flex-col items-end")}>
          {/* Sender name (only for others) */}
          {!isOwn && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">
              {message.sender.name}
            </div>
          )}

          {/* Reply preview */}
          {replyToMessage && (
            <div className={cn(
              "mb-1 p-2 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-800 text-xs",
              isOwn ? "border-blue-500" : "border-gray-300"
            )}>
              <div className="text-gray-600 dark:text-gray-400">
                Replying to {replyToMessage.sender.name}
              </div>
              <div className="text-gray-800 dark:text-gray-200 truncate">
                {replyToMessage.content}
              </div>
            </div>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              "relative px-3 py-2 rounded-2xl max-w-xs break-words",
              isOwn
                ? "bg-blue-500 text-white rounded-br-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
            )}
            onLongPress={() => {
              triggerHaptic('medium')
              setShowReactions(message.id)
            }}
          >
            {message.type === 'text' && message.content}
            
            {message.type === 'audio' && (
              <div className="flex items-center gap-2">
                <button
                  className="p-1 rounded-full hover:bg-black/10"
                  onClick={() => {
                    // Play audio logic here
                    triggerHaptic('light')
                  }}
                >
                  <div className="w-4 h-4 bg-current rounded-full" />
                </button>
                <div className="flex-1 h-1 bg-current/30 rounded">
                  <div className="w-1/3 h-full bg-current rounded" />
                </div>
                <span className="text-xs opacity-70">0:05</span>
              </div>
            )}

            {message.type === 'image' && message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="Shared image"
                className="max-w-full rounded-lg"
              />
            )}

            {/* Message status for own messages */}
            {isOwn && (
              <div className="text-xs opacity-70 mt-1">
                {message.status === 'sending' && 'Sending...'}
                {message.status === 'sent' && '✓'}
                {message.status === 'delivered' && '✓✓'}
                {message.status === 'read' && '✓✓'}
              </div>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex gap-1 mt-1">
              {Object.entries(message.reactions).map(([emoji, userIds]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(message.id, emoji)}
                  className="bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1 text-xs flex items-center gap-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  <span>{emoji}</span>
                  <span>{userIds.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className={cn(
            "text-xs text-gray-500 dark:text-gray-400 mt-1 px-2",
            isOwn && "text-right"
          )}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* Message actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center gap-1">
          <MobileButton
            variant="ghost"
            size="sm"
            onClick={() => setReplyTo(message.id)}
            hapticFeedback="light"
          >
            <Reply className="w-3 h-3" />
          </MobileButton>
          <MobileButton
            variant="ghost"
            size="sm"
            onClick={() => setShowReactions(message.id)}
            hapticFeedback="light"
          >
            <Smile className="w-3 h-3" />
          </MobileButton>
        </div>
      </div>
    )
  }, [currentUserId, messages, triggerHaptic, handleReaction])

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {typingUsers.map(u => u.name).join(', ')} 
              {typingUsers.length === 1 ? ' is' : ' are'} typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Replying to {messages.find(m => m.id === replyTo)?.sender.name}
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-200 truncate">
                {messages.find(m => m.id === replyTo)?.content}
              </div>
            </div>
            <MobileButton
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(null)}
              hapticFeedback="light"
            >
              ×
            </MobileButton>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-2">
          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full px-3 py-2 pr-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-[120px]"
              style={{
                height: 'auto',
                overflowY: inputText.length > 50 ? 'scroll' : 'hidden'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`
              }}
            />
            
            {/* Attachment button */}
            <MobileButton
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1"
              onClick={() => triggerHaptic('light')}
              hapticFeedback="light"
            >
              <Paperclip className="w-4 h-4" />
            </MobileButton>
          </div>

          {/* Voice/Send button */}
          {inputText.trim() ? (
            <MobileButton
              variant="primary"
              size="sm"
              onClick={handleSendText}
              disabled={disabled}
              hapticFeedback="medium"
              className="rounded-full w-10 h-10"
            >
              <Send className="w-4 h-4" />
            </MobileButton>
          ) : (
            <MobileButton
              variant={isRecording ? "danger" : "secondary"}
              size="sm"
              onTouchStart={handleStartRecording}
              onTouchEnd={handleStopRecording}
              onMouseDown={handleStartRecording}
              onMouseUp={handleStopRecording}
              disabled={disabled}
              hapticFeedback="medium"
              className="rounded-full w-10 h-10"
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </MobileButton>
          )}
        </div>
      </div>

      {/* Reactions popup */}
      {showReactions && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mx-4 max-w-xs">
            <div className="grid grid-cols-5 gap-3">
              {REACTION_EMOJIS.map(({ emoji, key }) => (
                <button
                  key={key}
                  onClick={() => handleReaction(showReactions, emoji)}
                  className="p-3 text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <MobileButton
                variant="outline"
                onClick={() => setShowReactions(null)}
                className="w-full"
                hapticFeedback="light"
              >
                Cancel
              </MobileButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}