'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VoiceControls } from '@/components/content/immersive/voice-controls'

export interface ImmersiveChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatOverlayProps {
  messages: ImmersiveChatMessage[]
  loading: boolean
  latestAssistantText: string
  onSubmit: (message: string, settings: { sttEnabled: boolean; ttsEnabled: boolean }) => Promise<void>
  onTelemetryEvent?: (eventName: string, payload?: Record<string, unknown>) => void
}

export function ChatOverlay({
  messages,
  loading,
  latestAssistantText,
  onSubmit,
  onTelemetryEvent
}: ChatOverlayProps) {
  const [input, setInput] = useState('')
  const [voiceSettings, setVoiceSettings] = useState({ sttEnabled: false, ttsEnabled: false })
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const submit = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    await onSubmit(trimmed, voiceSettings)
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-4xl p-4">
      <div className="rounded-2xl border border-white/20 bg-black/30 p-3 backdrop-blur-xl">
        <div className="max-h-[40vh] overflow-y-auto px-1 py-2">
          {messages.map((message, index) => (
            <div key={`${message.timestamp}-${index}`} className={`mb-2 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-emerald-700/70 text-white'
                    : 'bg-white/18 text-white'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading ? <p className="text-xs text-white/70">Thinking...</p> : null}
          <div ref={endRef} />
        </div>

        <div className="mt-2 flex flex-col gap-2 border-t border-white/15 pt-3">
          <VoiceControls
            onTranscript={(text) => setInput(text)}
            shouldSpeak={Boolean(latestAssistantText)}
            speechText={latestAssistantText}
            onSettingsChange={setVoiceSettings}
            onVoiceEvent={(eventName) => onTelemetryEvent?.(eventName)}
          />
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask anything. Try: show me medic jobs with video proof..."
              className="border-white/20 bg-black/20 text-white placeholder:text-white/50"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  submit()
                }
              }}
            />
            <Button onClick={submit} disabled={loading || !input.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
