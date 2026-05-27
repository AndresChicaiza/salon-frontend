import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

// Registro manual con email y contraseña
export async function registerWithEmail(email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    return credential.user
}

// Login con email y contraseña
export async function loginWithEmail(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
}

// Login / Registro con Google
export async function loginWithGoogle() {
    const credential = await signInWithPopup(auth, googleProvider)
    const user = credential.user

    if (user.email && !user.email.endsWith('@correounivalle.edu.co')) {
        // Intenta borrar la cuenta creada, o al menos cierra sesión
        await user.delete().catch(() => signOut(auth))
        throw new Error('Solo se permiten correos @correounivalle.edu.co')
    }

    return user
}

// Obtener token del usuario actual
export async function getToken(): Promise<string | null> {
    const user = auth.currentUser
    if (!user) return null
    return await user.getIdToken()
}

// Cerrar sesión
export async function logout() {
    await signOut(auth)
}