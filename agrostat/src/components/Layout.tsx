import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { logout } from 'zitejs/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, LayoutDashboard, Beef, Milk, Wallet, Recycle, Users, Settings, LogOut, Sun, Moon, LayoutGrid, X } from 'lucide-react';
import { cn } from '@project/components/lib/utils';
import { useFarm } from '../lib/farm';
import { useTheme } from '../lib/theme';
import FarmBackground from './FarmBackground';
import { t } from '../lib/i18n';

const links = [
  { to: '/dashboard', label: 'Boshqaruv paneli', short: 'Panel', icon: LayoutDashboard },
  { to: '/animals', label: 'Hayvonlar', short: 'Hayvonlar', icon: Beef },
  { to: '/production', label: 'Mahsulot', short: 'Mahsulot', icon: Milk },
  { to: '/finance', label: 'Moliya', short: 'Moliya', icon: Wallet },
  { to: '/waste', label: 'Chiqindilar', short: 'Chiqindilar', icon: Recycle },
  { to: '/team', label: 'Jamoa', short: 'Jamoa', icon: Users },
  { to: '/settings', label: 'Sozlamalar', short: 'Sozlamalar', icon: Settings },
];
const primary = links.slice(0, 4);
const more = links.slice(4);

const linkCls = ({ isActive }: { isActive: boolean }) =>
  cn('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
    isActive ? 'bg-accent text-accent-foreground shadow-md' : 'text-foreground/80 hover:bg-foreground/5 hover:text-foreground');

export function ThemeButton({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label={t('Mavzu')} className={cn('relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground/10 transition hover:bg-foreground/15', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.25 }}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function BottomBar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const moreActive = more.some((l) => loc.pathname.startsWith(l.to));
  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div className="glass fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 grid grid-cols-2 gap-2 p-3 md:hidden"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
              {more.map((l) => (
                <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={(s) => cn(linkCls(s), 'flex-col gap-1.5 py-4 text-sm')}>
                  <l.icon className="h-6 w-6" />{t(l.label)}
                </NavLink>
              ))}
              <button onClick={() => logout()} className="flex flex-col items-center gap-1.5 rounded-2xl py-4 text-sm font-medium text-destructive hover:bg-foreground/5">
                <LogOut className="h-6 w-6" />{t('Chiqish')}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-[hsl(var(--glass)/0.75)] pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden">
        <div className="grid grid-cols-5">
          {primary.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold">
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="tab-pill" className="absolute top-1.5 h-8 w-14 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 450, damping: 32 }} />}
                  <l.icon className={cn('relative h-5 w-5 mt-1.5', isActive ? 'text-accent-foreground' : 'text-foreground/70')} />
                  <span className={cn('mt-1 max-w-full truncate px-1', isActive ? 'text-foreground' : 'text-foreground/60')}>{t(l.short)}</span>
                </>
              )}
            </NavLink>
          ))}
          <button onClick={() => setOpen((o) => !o)} className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold">
            {(open || moreActive) && <span className="absolute top-1.5 h-8 w-14 rounded-full bg-accent" />}
            {open ? <X className="relative mt-1.5 h-5 w-5 text-accent-foreground" /> : <LayoutGrid className={cn('relative mt-1.5 h-5 w-5', moreActive ? 'text-accent-foreground' : 'text-foreground/70')} />}
            <span className="mt-1 text-foreground/60">{t('Yana')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default function Layout() {
  const { me } = useFarm();
  const loc = useLocation();
  const name = me?.displayName ?? '';
  return (
    <div className="min-h-screen md:flex md:gap-6 md:p-5">
      <FarmBackground />
      <aside className="glass hidden w-72 shrink-0 flex-col p-6 md:sticky md:top-5 md:flex md:h-[calc(100vh-2.5rem)]">
        <div className="flex items-center gap-3 px-2 font-display text-3xl"><Sprout className="h-8 w-8 text-accent" />AgroStat</div>
        <p className="mb-3 mt-10 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('Menyu')}</p>
        <nav className="flex flex-1 flex-col gap-1.5">
          {links.map((l) => <NavLink key={l.to} to={l.to} className={linkCls}><l.icon className="h-5 w-5" />{t(l.label)}</NavLink>)}
        </nav>
        <button onClick={() => logout()} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-foreground/80 hover:bg-foreground/5">
          <LogOut className="h-5 w-5" />{t('Chiqish')}
        </button>
      </aside>

      <div className="min-w-0 flex-1 space-y-4 px-3 pt-3 md:space-y-5 md:p-0">
        <header className="glass sticky top-3 z-30 flex items-center justify-between gap-3 rounded-full px-4 py-2.5 md:top-5 md:px-6 md:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Sprout className="h-6 w-6 shrink-0 text-accent md:hidden" />
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-tight md:text-2xl">{me?.farm?.farmName}</p>
              <p className="text-xs text-muted-foreground md:text-sm">{t(me?.role === 'Direktor' ? 'Direktor' : 'Xodim')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeButton />
            <NavLink to="/settings" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground ring-2 ring-accent/60">{name.charAt(0).toUpperCase() || '?'}</div>
              <span className="hidden font-semibold lg:inline">{name}</span>
            </NavLink>
          </div>
        </header>
        <motion.main key={loc.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
          className="pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-16">
          <Outlet />
        </motion.main>
      </div>
      <BottomBar />
    </div>
  );
}
