import { Button, Card, Input, Tag, message } from 'antd'
import { useEffect, useState, useRef } from 'react'
import { BulbOutlined, MessageOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axiosInstance'

const suggestionChips = [
  'Generate a cinematic prompt',
  'Suggest a pipeline for product photo',
  'Explain how to sharpen without noise',
  'Write a negative prompt for portraits',
]

interface ChatMessage {
  id?: string
  role: string // user or assistant
  content: string
}

export function ChatPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Tell me what you want to create. I can refine a prompt, recommend a pipeline, or explain an edit.' }
  ])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchHistory = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/assistant/history')
      const responseData = response.data
      const historyList = responseData && Array.isArray(responseData.data) ? responseData.data : (Array.isArray(responseData) ? responseData : null)
      if (historyList && historyList.length > 0) {
        setMessages(historyList)
      }
    } catch (err) {
      console.error('Failed to fetch chat history', err)
    }
  }

  useEffect(() => {
    document.title = 'NovaCanvas — AI Chat'
    if (user) {
      fetchHistory()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (textToSend?: string) => {
    if (!user) {
      message.warning('Please sign in to chat with the AI assistant')
      navigate('/login')
      return
    }

    const text = textToSend || prompt
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setPrompt('')
    setLoading(true)

    try {
      const response = await axiosInstance.post('/api/v1/assistant/chat', {
        input: text,
      })
      const responseData = response.data
      const content = responseData && responseData.data ? responseData.data.content : (responseData ? responseData.content : '')
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: content || 'No response from AI.',
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { error?: string } }; message?: string }).response?.data?.error || (err as Error).message || 'Failed to chat with AI'
      message.error(errorMsg)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStartNewThread = () => {
    if (!user) {
      message.warning('Please sign in to start a chat thread')
      navigate('/login')
      return
    }
    setMessages([
      { role: 'assistant', content: 'Let\'s start a new conversation thread. Ask me anything about prompts or pipeline edits.' }
    ])
    message.success('Started a fresh local thread.')
  }

  return (
    <div className="chat-shell">
      <motion.section
        className="chat-hero glass-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <span className="section-kicker">AI assistant</span>
          <h1>Context-aware chatbot for prompt engineering and image processing guidance.</h1>
          <p>
            Use Gemini to generate prompts, improve copy, suggest pipelines, and explain visual techniques directly
            inside the platform.
          </p>
          <div className="chat-actions">
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleStartNewThread}>Start new thread</Button>
            <Button icon={<BulbOutlined />} onClick={() => {
              if (user) {
                setPrompt('Give me some creative prompt ideas.')
              } else {
                handleSend('Give me some creative prompt ideas.')
              }
            }}>Prompt ideas</Button>
          </div>
        </div>
        <Card className="glass-card chat-side-card" bordered={false}>
          <Tag color="cyan">Realtime context</Tag>
          <strong>Pipeline + prompt aware</strong>
          <p>Provide image metadata, pipeline settings, or prompt drafts to get smarter replies.</p>
        </Card>
      </motion.section>

      <section className="chat-layout">
        <main className="chat-thread glass-card">
          <div className="thread-header">
            <span className="section-kicker">Conversation</span>
            <Tag color="processing">Gemini connected</Tag>
          </div>
          <div className="message-list" style={{ minHeight: 250, maxHeight: 450, overflowY: 'auto' }}>
            {messages.map((message, index) => (
              <div key={index} className={`chat-message chat-message-${message.role}`}>
                <span>{message.role === 'assistant' ? 'NovaCanvas AI' : 'You'}</span>
                <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {!user ? (
            <div className="chat-signin-banner glass-card">
              <div className="signin-banner-content">
                <ThunderboltOutlined style={{ fontSize: 32, color: '#ff007f', marginBottom: 12 }} />
                <h3>Sign in to unlock AI assistant</h3>
                <p>Unlock context-aware conversations, customized image pipelines, prompt improvements, and history tracking.</p>
                <Button type="primary" onClick={() => navigate('/login')} size="large">
                  Sign in
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="chat-input-row">
                <Input.TextArea
                  value={prompt}
                  onChange={event => setPrompt(event.target.value)}
                  onKeyDown={handleKeyDown}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  placeholder="Ask about prompts, image edits, pipelines, or generation tips..."
                  disabled={loading}
                />
                <Button type="primary" icon={<MessageOutlined />} onClick={() => handleSend()} loading={loading} disabled={loading}>
                  Send
                </Button>
              </div>
              <div className="prompt-seed-list prompt-seed-inline">
                {suggestionChips.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    className="prompt-seed-chip"
                    onClick={() => handleSend(chip)}
                    disabled={loading}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </>
          )}
        </main>

        <aside className="chat-rail">
          <Card className="glass-card" bordered={false}>
            <span className="section-kicker">Context blocks</span>
            <h3>What the assistant can use</h3>
            <ul className="chat-list">
              <li>Prompt drafts and negative prompts</li>
              <li>Pipeline settings and processing history</li>
              <li>Public/private image metadata</li>
              <li>Style, composition, and lighting goals</li>
            </ul>
          </Card>

          <Card className="glass-card" bordered={false}>
            <span className="section-kicker">Quick actions</span>
            <div className="chat-list">
              <div style={{ cursor: 'pointer', padding: '4px 0' }} onClick={() => handleSend('Generate 3 variations of a cinematic portrait prompt.')}>Generate prompt variations</div>
              <div style={{ cursor: 'pointer', padding: '4px 0' }} onClick={() => handleSend('How do I write a prompt in Midjourney style?')}>Rewrite for Midjourney style</div>
              <div style={{ cursor: 'pointer', padding: '4px 0' }} onClick={() => handleSend('Suggest a cleanup pipeline for noisy scanned documents.')}>Suggest a cleanup pipeline</div>
              <div style={{ cursor: 'pointer', padding: '4px 0' }} onClick={() => handleSend('Explain the difference between blur and sharpen filters.')}>Explain blur vs sharpen</div>
            </div>
          </Card>
        </aside>
      </section>
    </div>
  )
}

export default ChatPage
