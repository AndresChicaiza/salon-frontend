import { getToken } from './authService'

const BASE_URL = import.meta.env.VITE_BACKEND_MAIN_URL

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
