import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'customer'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ error: string | null }>
  signInAsCustomer: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('auth_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  async function signIn(username: string, password: string) {
    try {
      // Simple authentication against admin_users table
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, username')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle()

      if (error) {
        console.error('Supabase error:', error)
        return { error: 'Authentication failed' }
      }

      if (!data) {
        return { error: 'Invalid username or password' }
      }

      const userWithRole: AuthUser = { ...data, role: 'admin' }
      setUser(userWithRole)
      localStorage.setItem('auth_user', JSON.stringify(userWithRole))
      return { error: null }
    } catch (err) {
      console.error('Auth error:', err)
      return { error: 'Authentication failed' }
    }
  }

  async function signInAsCustomer() {
    const customerUser: AuthUser = {
      id: 'customer',
      username: 'Customer',
      role: 'customer'
    }
    setUser(customerUser)
    localStorage.setItem('auth_user', JSON.stringify(customerUser))
  }

  async function signOut() {
    setUser(null)
    localStorage.removeItem('auth_user')
  }

  const value = {
    user,
    loading,
    signIn,
    signInAsCustomer,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
