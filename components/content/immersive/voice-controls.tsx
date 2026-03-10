'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

type SpeechRecognitionCtor = new () => SpeechRecognition

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor
    SpeechRecognition?: SpeechRecognitionCtor
  }
}

interface VoiceControlsProps {
  onTranscript: (text: string) => void
  shouldSpeak: boolean
  speechText: string
  onSettingsChange: (settings: { sttEnabled: boolean; ttsEnabled: boolean }) => void
  onVoiceEvent?: (eventName: 'voice_started' | 'voice_stopped') => void
}

export function VoiceControls({
  onTranscript,
  shouldSpeak,
  speechText,
  onSettingsChange,
  onVoiceEvent
}: VoiceControlsProps) {
  const [sttEnabled, setSttEnabled] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    onSettingsChange({ sttEnabled, ttsEnabled })
  }, [sttEnabled, ttsEnabled, onSettingsChange])

  useEffect(() => {
    if (!shouldSpeak || !ttsEnabled || !speechText) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(speechText)
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }, [shouldSpeak, speechText, ttsEnabled])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      recognitionRef.current?.stop()
    }
  }, [])

  const startListening = () => {
    if (!sttEnabled || listening) return
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const latest = event.results[event.results.length - 1]
      const transcript = latest[0]?.transcript?.trim()
      if (latest.isFinal && transcript) {
        onTranscript(transcript)
      }
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    setListening(true)
    onVoiceEvent?.('voice_started')
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
    onVoiceEvent?.('voice_stopped')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={sttEnabled ? 'default' : 'outline'}
        onClick={() => setSttEnabled((current) => !current)}
      >
        Voice Input
      </Button>
      <Button
        size="sm"
        variant={ttsEnabled ? 'default' : 'outline'}
        onClick={() => setTtsEnabled((current) => !current)}
      >
        Voice Playback
      </Button>
      <Button
        size="sm"
        variant={listening ? 'destructive' : 'secondary'}
        onClick={listening ? stopListening : startListening}
        disabled={!sttEnabled}
      >
        {listening ? 'Stop Mic' : 'Push To Talk'}
      </Button>
    </div>
  )
}
