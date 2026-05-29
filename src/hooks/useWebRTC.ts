import { useEffect, useRef, useState, useCallback } from 'react'
import type { Socket } from 'socket.io-client'

// Servidores STUN/TURN públicos gratuitos para atravesar NATs y firewalls
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
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
    const createPeerConnection = useCallback((targetSocketId: string, stream: MediaStream) => {
        if (!socket) return null

        const pc = new RTCPeerConnection(ICE_SERVERS)

        // Agregar nuestras pistas locales a la conexión
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream)
        })

        // Cuando recibimos un candidato ICE, enviarlo al peer remoto
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc-ice-candidate', {
                    targetSocketId,
                    candidate: event.candidate,
                })
            }
        }

        // Cuando recibimos las pistas remotas del peer
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams
            if (remoteStream) {
                setRemoteStreams(prev => {
                    const exists = prev.find(rs => rs.socketId === targetSocketId)
                    if (exists) {
                        // Actualizar stream existente
                        return prev.map(rs =>
                            rs.socketId === targetSocketId ? { ...rs, stream: remoteStream } : rs
                        )
                    }
                    return [...prev, { socketId: targetSocketId, stream: remoteStream }]
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
        setRemoteStreams(prev => prev.filter(rs => rs.socketId !== socketId))
    }, [])

    // ─── 4. Iniciar llamada (crear offer) hacia un peer que se unió ─
    const callPeer = useCallback(async (targetSocketId: string) => {
        const stream = localStreamRef.current
        if (!stream || !socket) return

        const pc = createPeerConnection(targetSocketId, stream)
        if (!pc) return

        try {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            socket.emit('webrtc-offer', {
                targetSocketId,
                offer,
            })
        } catch (err) {
            console.error('Error al crear offer:', err)
        }
    }, [socket, createPeerConnection])

    // ─── 5. Manejar eventos WebRTC del signaling server ─────────────
    useEffect(() => {
        if (!socket || !roomId) return

        // Cuando un nuevo usuario se une, nosotros (como existentes) le hacemos la llamada
        const handleUserJoined = (newSocketId: string) => {
            // Pequeño delay para asegurar que ambos lados están listos
            setTimeout(() => callPeer(newSocketId), 500)
        }

        // Recibimos una oferta de alguien que ya estaba en la sala
        const handleOffer = async (data: { fromSocketId: string, offer: RTCSessionDescriptionInit }) => {
            const stream = localStreamRef.current
            if (!stream) return

            const pc = createPeerConnection(data.fromSocketId, stream)
            if (!pc) return

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                socket.emit('webrtc-answer', {
                    targetSocketId: data.fromSocketId,
                    answer,
                })
            } catch (err) {
                console.error('Error al manejar offer:', err)
            }
        }

        // Recibimos una respuesta a nuestra oferta
        const handleAnswer = async (data: { fromSocketId: string, answer: RTCSessionDescriptionInit }) => {
            const pc = peerConnections.current.get(data.fromSocketId)
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
                } catch (err) {
                    console.error('Error al manejar answer:', err)
                }
            }
        }

        // Recibimos un candidato ICE
        const handleIceCandidate = async (data: { fromSocketId: string, candidate: RTCIceCandidateInit }) => {
            const pc = peerConnections.current.get(data.fromSocketId)
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
                } catch (err) {
                    console.error('Error al añadir ICE candidate:', err)
                }
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
    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
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
                    }
                }
            }
            setIsScreenSharing(false)
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
                const screenTrack = screenStream.getVideoTracks()[0]

                // Reemplazar la pista de video en todas las conexiones peer
                peerConnections.current.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video')
                    if (sender) sender.replaceTrack(screenTrack)
                })

                // Actualizar stream local
                const current = localStreamRef.current
                if (current) {
                    current.getVideoTracks().forEach(t => current.removeTrack(t))
                    current.addTrack(screenTrack)
                }

                // Cuando el usuario deja de compartir desde el botón nativo del navegador
                screenTrack.onended = () => {
                    toggleScreenShare()
                }

                setIsScreenSharing(true)
            } catch (err) {
                console.error('Error al compartir pantalla:', err)
            }
        }
    }, [isScreenSharing])

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
    }
}
