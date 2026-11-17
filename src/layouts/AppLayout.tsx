import { useState } from 'react'
import { Outlet, useNavigation } from 'react-router'
import BottomNav from '../components/BottomNav'
import Header from '../components/Header'
import ReloadPrompt from '../components/ReloadPrompt'
import Sidebar from '../components/Sidebar'
import { SidebarSlotContext } from './sidebarSlotContext'

/**
 * Até 1279px: header + conteúdo + bottom nav.
 * A partir de `xl`: sidebar fixa à esquerda + coluna principal (a página decide se tem mapa).
 */
export default function AppLayout() {
  const navigation = useNavigation()
  const [sidebarSlot, setSidebarSlot] = useState<HTMLElement | null>(null)

  return (
    <SidebarSlotContext value={sidebarSlot}>
      <div className="min-h-dvh xl:flex">
        <Sidebar slotRef={setSidebarSlot} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main
            className={`flex-1 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] transition-opacity md:px-6 xl:px-8 xl:pt-6 xl:pb-8 ${
              navigation.state === 'loading' ? 'opacity-60' : ''
            }`}
          >
            <Outlet />
          </main>
        </div>

        <BottomNav />
        <ReloadPrompt />
      </div>
    </SidebarSlotContext>
  )
}
