import { Outlet, useNavigation } from 'react-router'
import BottomNav from '../components/BottomNav'
import ReloadPrompt from '../components/ReloadPrompt'

export default function AppLayout() {
  const navigation = useNavigation()

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <header className="sticky top-0 z-10 bg-brand pt-[env(safe-area-inset-top)] text-white shadow md:hidden">
        <h1 className="flex h-14 items-center px-4 text-lg font-semibold">Meu WebApp</h1>
      </header>

      <BottomNav />

      <main
        className={`flex-1 px-4 pt-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] transition-opacity md:px-8 md:pt-8 md:pb-8 ${
          navigation.state === 'loading' ? 'opacity-60' : ''
        }`}
      >
        <div className="mx-auto w-full max-w-3xl">
          <Outlet />
        </div>
      </main>

      <ReloadPrompt />
    </div>
  )
}
