import { Button, Card, Input, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { BulbOutlined, MessageOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'

const suggestionChips = [
  'Generate a cinematic prompt',
  'Suggest a pipeline for product photo',
  'Explain how to sharpen without noise',
  'Write a negative prompt for portraits',
]

const messages = [
  { role: 'assistant', text: 'Tell me what you want to create. I can refine a prompt, recommend a pipeline, or explain an edit.' },
  { role: 'user', text: 'I need a dramatic product image with neon reflections and premium lighting.' },
  { role: 'assistant', text: 'Use: cinematic product shot, black reflective surface, neon rim light, high contrast, clean composition. Negative: blur, clutter, low detail.' },
]

export function ChatPage() {
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    document.title = 'NovaCanvas — AI Chat'
  }, [])

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
            <Button type="primary" icon={<ThunderboltOutlined />}>Start new thread</Button>
            <Button icon={<BulbOutlined />}>Prompt ideas</Button>
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
          <div className="message-list">
            {messages.map((message, index) => (
              <div key={index} className={`chat-message chat-message-${message.role}`}>
                <span>{message.role === 'assistant' ? 'NovaCanvas AI' : 'You'}</span>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <Input.TextArea
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder="Ask about prompts, image edits, pipelines, or generation tips"
            />
            <Button type="primary" icon={<MessageOutlined />}>
              Send
            </Button>
          </div>
          <div className="prompt-seed-list prompt-seed-inline">
            {suggestionChips.map(chip => (
              <button key={chip} type="button" className="prompt-seed-chip">
                {chip}
              </button>
            ))}
          </div>
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
              <div>Generate prompt variations</div>
              <div>Rewrite for Midjourney style</div>
              <div>Suggest a cleanup pipeline</div>
              <div>Explain blur vs sharpen</div>
            </div>
          </Card>
        </aside>
      </section>
    </div>
  )
}

export default ChatPage
