'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript?: string }
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

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
  const [sttError, setSttError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const manualStopRef = useRef(false)

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
      manualStopRef.current = true
      recognitionRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    if (!sttEnabled && listening) {
      manualStopRef.current = true
      recognitionRef.current?.stop()
      setListening(false)
      onVoiceEvent?.('voice_stopped')
    }
  }, [listening, onVoiceEvent, sttEnabled])

  const startListening = () => {
    if (!sttEnabled || listening) return
    setSttError(null)
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setSttError('Speech recognition is not supported in this browser.')
      return
    }
    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const latest = event.results[event.results.length - 1]
      const transcript = latest[0]?.transcript?.trim()
      if (latest.isFinal && transcript) {
        onTranscript(transcript)
      }
    }

    recognition.onerror = (event) => {
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setSttError('Microphone permission denied. Allow microphone access and try again.')
      } else if (event?.error && event.error !== 'no-speech') {
        setSttError(`Voice input error: ${event.error}`)
      }
      setListening(false)
      onVoiceEvent?.('voice_stopped')
    }

    recognition.onend = () => {
      // Keep mic active until user explicitly stops.
      if (!manualStopRef.current && sttEnabled) {
        try {
          recognition.start()
          setListening(true)
          return
        } catch {
          // Fall back to stopped state.
        }
      }

      setListening(false)
      onVoiceEvent?.('voice_stopped')
    }

    recognitionRef.current = recognition
    manualStopRef.current = false
    setListening(true)
    onVoiceEvent?.('voice_started')
    recognition.start()
  }

  const stopListening = () => {
    manualStopRef.current = true
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
      {sttError ? <p className="text-xs text-red-500">{sttError}</p> : null}
    </div>
  )
}
