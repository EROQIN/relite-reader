import { createBrowserRouter } from 'react-router-dom'
import AppShell from '../components/AppShell'
import LoginPage from '../pages/LoginPage'
import LibraryPage from '../pages/LibraryPage'
import ReaderPage from '../pages/ReaderPage'
import WebDavPage from '../pages/WebDavPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <LibraryPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'webdav', element: <WebDavPage /> },
      { path: 'reader/:bookId', element: <ReaderPage /> },
    ],
  },
])
