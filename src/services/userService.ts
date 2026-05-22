import { getToken } from './authService'

const BASE_URL = (import.meta.env.VITE_BACKEND_MAIN_URL || 'http://localhost:4000').replace(/\/$/, '')

// Verificar disponibilidad de username
export async function checkUsername(username: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/users/check-username/${username}`)
    const data = await res.json()
    return data.available
}

// Crear perfil en Firestore
export async function createUserProfile(payload: {
    username: string
    displayName: string
    avatarUrl?: string
}) {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear perfil')
    }
    return res.json()
}

// Obtener perfil del usuario autenticado
export async function getUserProfile() {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Error al obtener perfil')
    return res.json()
}

// Actualizar perfil
export async function updateUserProfile(payload: {
    username?: string
    displayName?: string
    avatarUrl?: string
}) {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/users`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar perfil')
    }
    return res.json()
}

// Eliminar cuenta
export async function deleteUserAccount() {
    const token = await getToken()
    const res = await fetch(`${BASE_URL}/users`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Error al eliminar cuenta')
    return res.json()
}