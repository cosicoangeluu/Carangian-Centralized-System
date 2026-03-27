import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserIcon, LockClosedIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signInAsCustomer } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signIn(formData.username, formData.password)

    if (error) {
      setError(error)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  async function handleCustomerLogin() {
    setLoading(true)
    await signInAsCustomer()
    navigate('/pos')
  }

  return (
    <div className="min-h-screen futuristic-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-orange shadow-lg mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-orbitron gradient-text mb-2">CARANGIAN</h1>
          <p className="text-text-muted font-rajdhani">Inventory Management System</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-white border border-border-light shadow-large p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-orbitron text-text-primary mb-2">Admin Login</h2>
            <p className="text-text-secondary font-rajdhani">Sign in to access your inventory</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 font-rajdhani">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field w-full pl-12 pr-4 py-3 rounded-xl"
                  placeholder="admin"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-rajdhani font-semibold text-text-secondary uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field w-full pl-12 pr-4 py-3 rounded-xl"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-rajdhani font-bold text-base transition-all ${
                loading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border-light"></div>
            <span className="text-xs text-text-muted font-rajdhani uppercase">Or</span>
            <div className="flex-1 h-px bg-border-light"></div>
          </div>

          {/* Customer Login */}
          <button
            onClick={handleCustomerLogin}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-rajdhani font-bold text-base flex items-center justify-center gap-2 transition-all ${
              loading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <ShoppingCartIcon className="h-5 w-5" />
            Continue as Customer
          </button>

          {/* Default Credentials Hint */}
          <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-700 font-rajdhani">
              <span className="font-semibold">Admin Credentials:</span><br />
              Username: <code className="bg-white px-2 py-0.5 rounded">admin</code><br />
              Password: <code className="bg-white px-2 py-0.5 rounded">admin123</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted font-rajdhani">
            © 2026 Carangian Inventory System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
