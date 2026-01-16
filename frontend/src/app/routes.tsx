import { createBrowserRouter } from 'react-router-dom'
import AppShell from '../components/AppShell'
import LoginPage from '../pages/LoginPage'
import LibraryPage from '../pages/LibraryPage'
import ReaderPage from '../pages/ReaderPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <LibraryPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'reader/:bookId', element: <ReaderPage /> },
    ],
  },
])
