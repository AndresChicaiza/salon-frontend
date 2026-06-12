import { useEffect, useRef, useState, useCallback } from 'react'
import type { Socket } from 'socket.io-client'

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        // STUN Servers (Google)
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        // TURN Servers (OpenRelay Metered - Gratuitos para desarrollo)
        {
            urls: [
                'turn:openrelay.metered.ca:80',
                'turn:openrelay.metered.ca:443'
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ],
}

export interface RemoteStream {
    socketId: string
    stream: MediaStream
}

interface UseWebRTCOptions {
    socket: Socket | null
    roomId: string | undefined
}

export function useWebRTC({ socket, roomId }: UseWebRTCOptions) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([])
    const [isMicOn, setIsMicOn] = useState(true)
    const [isCamOn, setIsCamOn] = useState(true)
    const [isScreenSharing, setIsScreenSharing] = useState(false)
    const [permissionError, setPermissionError] = useState('')

    // Map de socketId → RTCPeerConnection
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
    // Referencia al stream de cámara original (para restaurar tras compartir pantalla)
    const cameraStreamRef = useRef<MediaStream | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    // Ref para encolar candidatos ICE antes de que se establezca remoteDescription
    const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())

    // ─── 1. Obtener medios locales (cámara + micrófono) ─────────────
    const startLocalStream = useCallback(async () => {
        try {
            setPermissionError('')
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            })
            setLocalStream(stream)
            localStreamRef.current = stream
            cameraStreamRef.current = stream
            return stream
        } catch (err: any) {
            console.error('Error al acceder a cámara/micrófono:', err)
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setPermissionError('Permisos de cámara/micrófono denegados. Habilítalos en la configuración del navegador.')
            } else if (err.name === 'NotFoundError') {
                setPermissionError('No se encontró cámara ni micrófono. Conecta un dispositivo e intenta de nuevo.')
            } else {
                setPermissionError('Error al acceder a los dispositivos multimedia.')
            }
            // Intentar solo con audio
            try {
                const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true })
                setLocalStream(audioOnly)
                localStreamRef.current = audioOnly
                return audioOnly
            } catch {
                return null
            }
        }
    }, [])

    // ─── 2. Crear RTCPeerConnection hacia un peer remoto ────────────
    const createPeerConnection = useCallback((targetSocketId: string, stream: MediaStream | null) => {
        if (!socket) return null

        const pc = new RTCPeerConnection(ICE_SERVERS)

        // Agregar nuestras pistas locales a la conexión (si existen)
        if (stream) {
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream)
            })
        }

        // Cuando recibimos un candidato ICE, enviarlo al peer remoto
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc-ice-candidate', {
                    targetSocketId,
                    candidate: {
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex
                    },
                })
            }
        }

        // Cuando recibimos las pistas remotas del peer
        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                const stream = event.streams[0]
                setRemoteStreams(prev => {
                    const exists = prev.find(rs => rs.socketId === targetSocketId)
                    if (exists && exists.stream === stream) return prev
                    return [
                        ...prev.filter(rs => rs.socketId !== targetSocketId),
                        { socketId: targetSocketId, stream }
                    ]
                })
            } else {
                const track = event.track
                setRemoteStreams(prev => {
                    const exists = prev.find(rs => rs.socketId === targetSocketId)
                    if (exists) {
                        exists.stream.addTrack(track)
                        const newStream = new MediaStream(exists.stream.getTracks())
                        return prev.map(rs =>
                            rs.socketId === targetSocketId ? { ...rs, stream: newStream } : rs
                        )
                    }
                    const newStream = new MediaStream([track])
                    return [...prev, { socketId: targetSocketId, stream: newStream }]
                })
            }
        }

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                removePeer(targetSocketId)
            }
        }

        peerConnections.current.set(targetSocketId, pc)
        return pc
    }, [socket])

    // ─── 3. Limpiar un peer ─────────────────────────────────────────
    const removePeer = useCallback((socketId: string) => {
        const pc = peerConnections.current.get(socketId)
        if (pc) {
            pc.close()
            peerConnections.current.delete(socketId)
        }
        pendingCandidates.current.delete(socketId)
        setRemoteStreams(prev => prev.filter(rs => rs.socketId !== socketId))
    }, [])

    // ─── 4. Iniciar llamada (crear offer) hacia un peer que se unió ─
    const callPeer = useCallback(async (targetSocketId: string) => {
        const stream = localStreamRef.current
        if (!socket) return

        try {
            const pc = createPeerConnection(targetSocketId, stream)
            if (!pc) return
            
            window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[INFO] Creating offer for ${targetSocketId.slice(0,4)}` }))
            const offer = await pc.createOffer()
            
            window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[INFO] Setting local desc (offer)` }))
            await pc.setLocalDescription(offer)
            
            socket.emit('webrtc-offer', {
                targetSocketId,
                offer: { type: offer.type, sdp: offer.sdp },
            })
            window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[SEND] Offer to ${targetSocketId.slice(0,4)}` }))
        } catch (err: any) {
            console.error('Error al crear offer:', err)
            window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[ERR] callPeer: ${err.message || err}` }))
        }
    }, [socket, createPeerConnection])

    // ─── 5. Manejar eventos WebRTC del signaling server ─────────────
    useEffect(() => {
        if (!socket || !roomId) return

        const flushIceCandidates = async (socketId: string, pc: RTCPeerConnection) => {
            const candidates = pendingCandidates.current.get(socketId)
            if (candidates && candidates.length > 0) {
                window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[INFO] Flushing ${candidates.length} ICE candidates` }))
                for (const candidate of candidates) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate))
                    } catch (err) {
                        console.error('Error al añadir ICE candidate encolado:', err)
                    }
                }
                pendingCandidates.current.delete(socketId)
            }
        }

        // Cuando un nuevo usuario se une, nosotros (como existentes) le hacemos la llamada
        const handleUserJoined = (newSocketId: string) => {
            // Pequeño delay para asegurar que ambos lados están listos
            setTimeout(() => callPeer(newSocketId), 500)
        }

        // Recibimos una oferta de alguien que ya estaba en la sala
        const handleOffer = async (data: { fromSocketId: string, offer: RTCSessionDescriptionInit }) => {
            window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[RECV] Offer from ${data.fromSocketId.slice(0,4)}` }))
            const stream = localStreamRef.current

            try {
                const pc = createPeerConnection(data.fromSocketId, stream)
                if (!pc) {
                    window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[ERR] No PC created for ${data.fromSocketId.slice(0,4)}` }))
                    return
                }

                window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[INFO] Setting remote desc (offer)` }))
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
                
                window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[INFO] Flushing ICE candidates` }))
                await flushIceCandidates(data.fromSocketId, pc)
                
                window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[INFO] Creating answer` }))
                const answer = await pc.createAnswer()
                
                window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[INFO] Setting local desc (answer)` }))
                await pc.setLocalDescription(answer)
                
                socket.emit('webrtc-answer', {
                    targetSocketId: data.fromSocketId,
                    answer: { type: answer.type, sdp: answer.sdp },
                })
                window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[SEND] Answer to ${data.fromSocketId.slice(0,4)}` }))
            } catch (err: any) {
                console.error('Error al manejar offer:', err)
                window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[ERR] handleOffer: ${err.message || err}` }))
            }
        }

        // Recibimos una respuesta a nuestra oferta
        const handleAnswer = async (data: { fromSocketId: string, answer: RTCSessionDescriptionInit }) => {
            window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[RECV] Answer from ${data.fromSocketId.slice(0,4)}` }))
            const pc = peerConnections.current.get(data.fromSocketId)
            if (pc) {
                try {
                    window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[INFO] Setting remote desc (answer)` }))
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
                    await flushIceCandidates(data.fromSocketId, pc)
                } catch (err: any) {
                    console.error('Error al manejar answer:', err)
                    window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[ERR] handleAnswer: ${err.message || err}` }))
                }
            } else {
                window.dispatchEvent(new CustomEvent('webrtc-log', { detail: `[ERR] No PC found for answer from ${data.fromSocketId.slice(0,4)}` }))
            }
        }

        // Recibimos un candidato ICE
        const handleIceCandidate = async (data: { fromSocketId: string, candidate: RTCIceCandidateInit }) => {
            const pc = peerConnections.current.get(data.fromSocketId)
            if (pc && pc.remoteDescription && pc.remoteDescription.type) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
                } catch (err) {
                    console.error('Error al añadir ICE candidate:', err)
                }
            } else {
                const candidates = pendingCandidates.current.get(data.fromSocketId) || []
                candidates.push(data.candidate)
                pendingCandidates.current.set(data.fromSocketId, candidates)
            }
        }

        // Un usuario abandonó la sala
        const handleUserLeft = (socketId: string) => {
            removePeer(socketId)
        }

        socket.on('user-joined', handleUserJoined)
        socket.on('webrtc-offer', handleOffer)
        socket.on('webrtc-answer', handleAnswer)
        socket.on('webrtc-ice-candidate', handleIceCandidate)
        socket.on('user-left', handleUserLeft)

        return () => {
            socket.off('user-joined', handleUserJoined)
            socket.off('webrtc-offer', handleOffer)
            socket.off('webrtc-answer', handleAnswer)
            socket.off('webrtc-ice-candidate', handleIceCandidate)
            socket.off('user-left', handleUserLeft)
        }
    }, [socket, roomId, callPeer, createPeerConnection, removePeer])

    // ─── 6. Toggle Micrófono ────────────────────────────────────────
    const toggleMic = useCallback(() => {
        const stream = localStreamRef.current
        if (stream) {
            let newState = isMicOn
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled
                newState = track.enabled
            })
            setIsMicOn(newState)
            if (socket) {
                socket.emit('toggle-media', { type: 'mic', state: newState })
            }
        }
    }, [socket, isMicOn])

    // ─── 7. Toggle Cámara ───────────────────────────────────────────
    const toggleCam = useCallback(() => {
        const stream = localStreamRef.current
        if (stream) {
            let newState = isCamOn
            stream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled
                newState = track.enabled
            })
            setIsCamOn(newState)
            if (socket) {
                socket.emit('toggle-media', { type: 'cam', state: newState })
            }
        }
    }, [socket, isCamOn])

    // ─── 8. Compartir Pantalla ──────────────────────────────────────
    const stopScreenSharing = useCallback(() => {
        // Restaurar cámara
        const camStream = cameraStreamRef.current
        if (camStream) {
            const videoTrack = camStream.getVideoTracks()[0]
            if (videoTrack) {
                peerConnections.current.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video')
                    if (sender) sender.replaceTrack(videoTrack)
                })
                // Actualizar stream local
                const current = localStreamRef.current
                if (current) {
                    current.getVideoTracks().forEach(t => current.removeTrack(t))
                    current.addTrack(videoTrack)
                    const newStream = new MediaStream(current.getTracks())
                    setLocalStream(newStream)
                    localStreamRef.current = newStream
                }
            }
        }
        setIsScreenSharing(false)
    }, [])

    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            stopScreenSharing()
        } else {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                    alert('Tu navegador o dispositivo no soporta compartir pantalla. Asegúrate de estar en una conexión segura (HTTPS) o usar un navegador compatible.')
                    return
                }

                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
                const screenTrack = screenStream.getVideoTracks()[0]

                // Reemplazar la pista de video en todas las conexiones peer
                peerConnections.current.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video' || (s.track === null))
                    if (sender) sender.replaceTrack(screenTrack)
                })

                // Actualizar stream local
                const current = localStreamRef.current
                if (current) {
                    current.getVideoTracks().forEach(t => current.removeTrack(t))
                    current.addTrack(screenTrack)
                    const newStream = new MediaStream(current.getTracks())
                    setLocalStream(newStream)
                    localStreamRef.current = newStream
                }

                // Cuando el usuario deja de compartir desde el botón nativo del navegador
                screenTrack.onended = () => {
                    stopScreenSharing()
                }

                setIsScreenSharing(true)
            } catch (err: any) {
                console.error('Error al compartir pantalla:', err)
                if (err.name === 'NotAllowedError') {
                    alert('Permiso denegado para compartir pantalla.')
                } else if (err.name === 'NotFoundError') {
                    alert('No se encontró una pantalla para compartir.')
                } else {
                    alert('No se pudo compartir la pantalla: ' + (err.message || 'Error desconocido.'))
                }
            }
        }
    }, [isScreenSharing, stopScreenSharing])

    // ─── 9. Cleanup al desmontar ────────────────────────────────────
    useEffect(() => {
        return () => {
            // Detener todas las pistas locales
            localStreamRef.current?.getTracks().forEach(track => track.stop())
            cameraStreamRef.current?.getTracks().forEach(track => track.stop())
            // Cerrar todas las conexiones peer
            peerConnections.current.forEach(pc => pc.close())
            peerConnections.current.clear()
        }
    }, [])

    return {
        localStream,
        remoteStreams,
        isMicOn,
        isCamOn,
        isScreenSharing,
        permissionError,
        startLocalStream,
        toggleMic,
        toggleCam,
        toggleScreenShare,
        removePeer,
        peerConnections: peerConnections.current,
    }
}
