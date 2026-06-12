import { useState, useEffect, useRef } from 'react'

export function useAudioVolume(stream: MediaStream | null, isMuted: boolean = false) {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const audioContextRef = useRef<AudioContext | null>(null)

    useEffect(() => {
        if (!stream || isMuted || stream.getAudioTracks().length === 0) {
            setIsSpeaking(false)
            return
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext

        // Reanudar el contexto si el navegador lo inició suspendido (política de autoplay)
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(console.error)
        }

        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.5

        let source: MediaStreamAudioSourceNode | null = null
        try {
            source = audioContext.createMediaStreamSource(stream)
            source.connect(analyser)
            // IMPORTANTE: NO conectamos a destination para evitar escuchar nuestra propia voz (eco)
        } catch (err) {
            console.error('Error al conectar fuente de audio:', err)
            return
        }

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        let animationFrameId: number

        const checkVolume = () => {
            analyser.getByteFrequencyData(dataArray)
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i]
            }
            const average = sum / dataArray.length

            // Umbral de volumen (10 es un valor sensible para detectar habla normal)
            if (average > 10) {
                setIsSpeaking(true)
            } else {
                setIsSpeaking(false)
            }

            animationFrameId = requestAnimationFrame(checkVolume)
        }

        checkVolume()

        return () => {
            cancelAnimationFrame(animationFrameId)
            if (source) source.disconnect()
            analyser.disconnect()
            if (audioContext.state !== 'closed') {
                audioContext.close().catch(console.error)
            }
        }
    }, [stream, isMuted])

    return isSpeaking
}
