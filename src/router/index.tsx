import { createBrowserRouter } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ChooseUsernamePage from '../pages/ChooseUsernamePage'
import DashboardPage from '../pages/DashboardPage'
import ProfilePage from '../pages/ProfilePage'
import CreateRoomPage from '../pages/CreateRoomPage'
import RoomPage from '../pages/RoomPage'
import DocsPage from '../pages/DocsPage'
import NotFoundPage from '../pages/NotFoundPage'
import PrivateRoute from '../components/PrivateRoute'

export const router = createBrowserRouter([
    { path: '/', element: <LandingPage /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegisterPage /> },
    { path: '/register/username', element: <ChooseUsernamePage /> },
    {
        element: <PrivateRoute />,
        children: [
            { path: '/dashboard', element: <DashboardPage /> },
            { path: '/profile', element: <ProfilePage /> },
            { path: '/room/create', element: <CreateRoomPage /> },
            { path: '/room/:roomId', element: <RoomPage /> },
        ],
    },
    { path: '/docs', element: <DocsPage /> },
    { path: '*', element: <NotFoundPage /> },
])