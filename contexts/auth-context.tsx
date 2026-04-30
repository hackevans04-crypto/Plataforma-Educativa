"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type UserRole = "user" | "admin"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: Date
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo users for testing
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  "admin@hackevans.com": {
    password: "admin123",
    user: {
      id: "1",
      email: "admin@hackevans.com",
      name: "Administrador",
      role: "admin",
      createdAt: new Date("2024-01-01"),
    },
  },
  "usuario@test.com": {
    password: "user123",
    user: {
      id: "2",
      email: "usuario@test.com",
      name: "Juan Perez",
      role: "user",
      createdAt: new Date("2024-06-15"),
    },
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem("hackevans_user")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setUser({ ...parsed, createdAt: new Date(parsed.createdAt) })
      } catch {
        localStorage.removeItem("hackevans_user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const demoUser = DEMO_USERS[email.toLowerCase()]
    if (demoUser && demoUser.password === password) {
      setUser(demoUser.user)
      localStorage.setItem("hackevans_user", JSON.stringify(demoUser.user))
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if email already exists
    if (DEMO_USERS[email.toLowerCase()]) {
      setIsLoading(false)
      return false
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: "user",
      createdAt: new Date(),
    }

    setUser(newUser)
    localStorage.setItem("hackevans_user", JSON.stringify(newUser))
    setIsLoading(false)
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("hackevans_user")
    localStorage.removeItem("he-theme-admin")
    localStorage.removeItem("he-theme-dashboard")
    document.documentElement.classList.add("dark")
  }

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data }
      setUser(updated)
      localStorage.setItem("hackevans_user", JSON.stringify(updated))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
