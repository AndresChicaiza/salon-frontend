import { getToken } from './authService'

const BASE_URL = (import.meta.env.VITE_BACKEND_MAIN_URL || 'http://localhost:4000').replace(/\/$/, '')

export interface Room {
    id: string
    name: string
    createdBy: string
    createdAt: string
    status: string
}

// Crear sala
export async function createRoom(name: string): Promise<Room> {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/rooms`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
    })
    
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.error || 'Error al crear la sala')
    }
    return data.room
}

// Obtener salas del usuario
export async function getUserRooms(): Promise<Room[]> {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.error || 'Error al obtener las salas')
    }
    return data.rooms
}

// Obtener detalle de una sala específica
export async function getRoom(roomId: string): Promise<Room> {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.error || 'Error al obtener los detalles de la sala')
    }
    return data.room
}

// Actualizar nombre de una sala
export async function updateRoom(roomId: string, name: string): Promise<void> {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
    })
    
    if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar la sala')
    }
}

// Eliminar una sala
export async function deleteRoom(roomId: string): Promise<void> {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    })
    
    if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar la sala')
    }
}

// Obtener historial de mensajes del chat de la sala
export async function getRoomMessages(roomId: string): Promise<any[]> {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.error || 'Error al obtener los mensajes de la sala')
    }
    return data.messages
}

// Enviar un nuevo mensaje al chat
export async function createRoomMessage(roomId: string, text: string): Promise<any> {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
    })
    
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.error || 'Error al enviar el mensaje')
    }
    return data.chatMessage
}
