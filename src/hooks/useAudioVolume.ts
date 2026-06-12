import { useState, useEffect } from 'react'

export function useAudioVolume(stream: MediaStream | null, isMuted: boolean = false) {
    const [isSpeaking, setIsSpeaking] = useState(false)

    useEffect(() => {
        if (!stream || isMuted || stream.getAudioTracks().length === 0) {
            setIsSpeaking(false)
            return
        }

        // Crear contexto de audio solo cuando hay un stream válido
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        let analyser: AnalyserNode
        let microphone: MediaStreamAudioSourceNode
        let javascriptNode: ScriptProcessorNode

        try {
            analyser = audioContext.createAnalyser()
            analyser.smoothingTimeConstant = 0.8
            analyser.fftSize = 1024

            // Usar el stream directamente como fuente
            microphone = audioContext.createMediaStreamSource(stream)
            javascriptNode = audioContext.createScriptProcessor(2048, 1, 1)

            analyser.connect(javascriptNode)
            javascriptNode.connect(audioContext.destination)
            microphone.connect(analyser)

            javascriptNode.onaudioprocess = () => {
                const array = new Uint8Array(analyser.frequencyBinCount)
                analyser.getByteFrequencyData(array)
                let values = 0

                const length = array.length
                for (let i = 0; i < length; i++) {
                    values += array[i]
                }

                const average = values / length
                // Umbral de volumen (ajustable)
                if (average > 15) {
                    setIsSpeaking(true)
                } else {
                    setIsSpeaking(false)
                }
            }
        } catch (err) {
            console.error('Error al analizar el volumen del stream:', err)
        }

        return () => {
            if (javascriptNode) {
                javascriptNode.disconnect()
                javascriptNode.onaudioprocess = null
            }
            if (analyser) analyser.disconnect()
            if (microphone) microphone.disconnect()
            if (audioContext.state !== 'closed') {
                audioContext.close()
            }
        }
    }, [stream, isMuted])

    return isSpeaking
}
