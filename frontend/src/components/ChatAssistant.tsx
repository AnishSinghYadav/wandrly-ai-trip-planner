import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '../store/useAppStore'
import { fetchChat } from '../lib/api'
import toast from 'react-hot-toast'

const QUICK_ASKS = [
  'What should I pack?',
  'Best local restaurants?',
  'Add a day trip option',
  'Budget-saving tips?',
  'What to avoid there?',
  'Best photo spots?',
]

export default function ChatAssistant({ itinerary }: { itinerary: string }) {
  const { chatHistory, addChatMessage } = useAppStore()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, isTyping])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return

    addChatMessage({ role: 'user', content: text })
    setInput('')
    setIsTyping(true)

    try {
      const historyStr = chatHistory
        .slice(-6)
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n')
      const reply = await fetchChat({ itinerary, chat_history: historyStr, query: text })
      addChatMessage({ role: 'assistant', content: reply })
    } catch {
      toast.error('Chat failed — is the backend running?')
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div
      className="lux-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '560px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(196,154,73,0.12)',
        background: 'linear-gradient(135deg, rgba(196,154,73,0.06), transparent)',
      }}>
        <div style={{
          width: '34px', height: '34px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(196,154,73,0.9), rgba(232,200,120,0.95))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(196,154,73,0.3)',
          flexShrink: 0,
        }}>
          <Bot size={15} style={{ color: '#0a0f1e' }} />
        </div>
        <div>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 700,
            fontSize: '1rem',
            color: 'rgb(var(--text-primary))',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}>
            Trip Concierge
          </p>
          <p style={{ fontSize: '0.68rem', color: 'rgb(var(--text-muted))', marginTop: '2px', letterSpacing: '0.06em' }}>
            Ask anything about your journey
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: 'rgb(var(--gold))',
            boxShadow: '0 0 8px rgba(196,154,73,0.6)',
            animation: 'breathe 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '0.65rem', color: 'rgb(var(--text-muted))', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Online
          </span>
        </div>
      </div>

      {/* Quick ask chips */}
      <div style={{
        padding: '8px 14px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '5px',
        borderBottom: '1px solid rgba(196,154,73,0.08)',
      }}>
        {QUICK_ASKS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={isTyping}
            className="lux-pill"
            style={{
              fontSize: '0.68rem',
              padding: '4px 10px',
              cursor: isTyping ? 'not-allowed' : 'pointer',
              opacity: isTyping ? 0.5 : 1,
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {chatHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', textAlign: 'center', padding: '2rem',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'rgb(var(--gold))' }}
            >
              ✦
            </motion.div>
            <p style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.1rem',
              fontStyle: 'italic',
              color: 'rgb(var(--text-secondary))',
              lineHeight: 1.6,
              maxWidth: '280px',
            }}>
              Your personal travel concierge awaits. Ask anything about your journey.
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ display: 'flex', gap: '10px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}
            >
              {/* Avatar */}
              <div style={{
                width: '28px', height: '28px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: '4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(196,154,73,0.9), rgba(232,200,120,0.95))'
                  : 'rgba(196,154,73,0.08)',
                border: '1px solid rgba(196,154,73,0.25)',
              }}>
                {msg.role === 'user'
                  ? <User size={12} style={{ color: '#0a0f1e' }} />
                  : <Bot size={12} style={{ color: 'rgb(var(--gold))' }} />
                }
              </div>

              <div
                style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  fontSize: '0.85rem',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(196,154,73,0.18), rgba(196,154,73,0.1))'
                    : 'rgba(196,154,73,0.05)',
                  border: msg.role === 'user'
                    ? '1px solid rgba(196,154,73,0.35)'
                    : '1px solid rgba(196,154,73,0.1)',
                  color: 'rgb(var(--text-primary))',
                }}
              >
                <div className="md-content" style={{ fontSize: '0.85rem' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: '10px' }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(196,154,73,0.08)',
                border: '1px solid rgba(196,154,73,0.25)',
              }}>
                <Bot size={12} style={{ color: 'rgb(var(--gold))' }} />
              </div>
              <div style={{
                padding: '12px 16px',
                borderRadius: '4px 16px 16px 16px',
                background: 'rgba(196,154,73,0.05)',
                border: '1px solid rgba(196,154,73,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [-4, 4, -4] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'rgb(var(--gold))',
                      display: 'block',
                      opacity: 0.7,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid rgba(196,154,73,0.1)',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          className="lux-textarea"
          style={{ minHeight: '42px', maxHeight: '120px', flex: 1 }}
          placeholder="Ask anything about your trip…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isTyping}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          className="btn-luxury"
          style={{
            width: '40px', height: '40px',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            opacity: !input.trim() || isTyping ? 0.4 : 1,
            cursor: !input.trim() || isTyping ? 'not-allowed' : 'pointer',
            padding: 0,
          }}
        >
          <Send size={15} style={{ color: '#0a0f1e' }} />
        </motion.button>
      </div>
    </div>
  )
}
