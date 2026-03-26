import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout/index.tsx'
import Home from './pages/Home/index.tsx'
import Todo from './pages/Todo/index.tsx'
import DataViz from './pages/DataViz/index.tsx'
import Note from './pages/Note/index.tsx'

const YoutubeSummary = lazy(() => import('./pages/YoutubeSummary/index.tsx'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'todo', element: <Todo /> },
      { path: 'data-viz', element: <DataViz /> },
      { path: 'note', element: <Note /> },
      {
        path: 'youtube-summary',
        element: (
          <Suspense fallback={null}>
            <YoutubeSummary />
          </Suspense>
        ),
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
