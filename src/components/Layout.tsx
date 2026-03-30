import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  HomeIcon,
  CubeTransparentIcon,
  ShoppingCartIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface LayoutProps {
  children: ReactNode
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Inventory', href: '/inventory', icon: CubeTransparentIcon },
  { name: 'POS', href: '/pos', icon: ShoppingCartIcon },
  { name: 'Transactions', href: '/transactions', icon: ArrowsRightLeftIcon },
  { name: 'Profit', href: '/profit', icon: CurrencyDollarIcon },
  { name: 'Monthly Report', href: '/reports', icon: ChartBarIcon },
]

export default function Layout({ children, sidebarOpen, setSidebarOpen }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen futuristic-bg flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        <div className="flex h-full flex-col bg-white border-r border-border-light">
          {/* Logo */}
          <div className={`flex h-20 items-center ${sidebarOpen ? 'justify-between px-6' : 'justify-center px-4'}`}>
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'lg:justify-center lg:w-full'}`}>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-neon-blue">
                  <CubeTransparentIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              {sidebarOpen && (
                <div className="animate-fade-in overflow-hidden">
                  <h1 className="text-lg font-bold font-orbitron gradient-text whitespace-nowrap">CARANGIAN</h1>
                  <p className="text-xs text-text-muted font-medium whitespace-nowrap">Centralized Web System</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-text-muted hover:text-neon-orange transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Collapse Toggle Button (Desktop) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex absolute -right-3 top-16 items-center justify-center w-6 h-6 rounded-full bg-white border border-border-light shadow-md text-text-muted hover:text-neon-blue hover:border-neon-blue transition-colors z-10"
          >
            {sidebarOpen ? (
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            ) : (
              <ChevronDoubleRightIcon className="h-4 w-4" />
            )}
          </button>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-6 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative flex items-center ${
                    sidebarOpen ? 'px-3 py-3.5' : 'lg:justify-center lg:px-0 lg:py-3.5'
                  } text-sm font-medium rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-neon-blue/10 to-neon-orange/10 border border-neon-blue/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-300 flex-shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-br from-neon-blue to-neon-orange shadow-neon-blue'
                      : 'bg-bg-tertiary'
                  }`}>
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-black' : 'text-text-secondary'}`} />
                  </div>
                  {sidebarOpen && (
                    <span className={`ml-3 font-rajdhani font-semibold tracking-wide whitespace-nowrap animate-fade-in ${
                      isActive ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'
                    }`}>
                      {item.name}
                    </span>
                  )}
                  {!sidebarOpen && (
                    <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-text-primary text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {item.name}
                    </div>
                  )}
                  {sidebarOpen && isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-neon-yellow flex-shrink-0"></div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className={`border-t border-border-light p-3 ${!sidebarOpen && 'lg:p-2'}`}>
            {sidebarOpen ? (
              <p className="text-xs text-text-muted text-center font-rajdhani">© 2026 COGS Tracker</p>
            ) : (
              <div className="lg:flex lg:justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-border-light bg-white/80 backdrop-blur-md px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-text-muted hover:text-neon-blue transition-colors p-2 rounded-lg hover:bg-bg-tertiary"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-between gap-x-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-base font-bold font-orbitron text-text-primary">
                  {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
                </h2>
                <p className="text-xs text-text-muted font-rajdhani">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Right side - User profile */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-rajdhani text-green-700 font-medium">Active</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-tertiary border border-border-light">
                <UserCircleIcon className="h-6 w-6 text-text-secondary" />
                <div className="hidden sm:block">
                  <p className="text-xs font-bold font-rajdhani text-text-primary uppercase">{user?.username || 'Admin'}</p>
                  <p className="text-[10px] text-text-muted font-rajdhani">{user?.role === 'admin' ? 'Administrator' : 'Customer'}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-bg-primary">
          <div className="mx-auto max-w-7xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
