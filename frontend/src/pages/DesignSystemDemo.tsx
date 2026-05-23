import { useState } from 'react'
import Card from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spotlight from '../components/ui/Spotlight'
import AmbientBackground from '../components/AmbientBackground'

export default function DesignSystemDemo() {
  const [text, setText] = useState('')

  return (
    <div style={{ padding: 24 }}>
      <AmbientBackground />
      <h1>Design System Demo</h1>
      <p>Tokens, buttons, inputs, spotlight, and card variants.</p>

      <section style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
        <Card className="glass-card" header={<h3>Buttons</h3>}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </Card>

        <Card className="glass-card" header={<h3>Inputs</h3>}>
          <Input placeholder="Single line input" value={text} onChange={(e) => setText((e.target as HTMLInputElement).value)} />
          <div style={{ height: 12 }} />
          <Input.TextArea placeholder="Multi-line TextArea" value={text} onChange={(e) => setText((e.target as HTMLTextAreaElement).value)} />
        </Card>

        <Spotlight>
          <Card className="glass-card" header={<h3>Spotlight</h3>}>
            <div style={{ height: 140, display: 'grid', placeItems: 'center' }}>
              Move your mouse inside this card to see the radial glow.
            </div>
          </Card>
        </Spotlight>
      </section>
    </div>
  )
}
