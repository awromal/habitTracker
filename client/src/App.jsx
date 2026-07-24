import { useEffect, useState } from 'react'
import { api } from './api'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

export default function App() {
  // undefined = checking session, null = logged out, object = logged in
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
  }, [])

  if (user === undefined) return null
  if (user === null) return <Auth onAuthed={setUser} />
  return <Dashboard user={user} onLogout={() => setUser(null)} />
}
