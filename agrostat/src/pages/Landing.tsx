import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from 'zitejs/auth';
import { Button } from '@project/components/ui/button';
import { Sprout, ArrowRight, Beef, HeartPulse, Milk, Wallet, Recycle } from 'lucide-react';
import { t } from '../lib/i18n';
import LangSwitcher from '../components/LangSwitcher';

const HERO = 'https://images.fillout.com/923010/cva3fqdmg5/generated-images/4ZMwzajZdDEzGkfmzXT3Zw/img_Vu3mHhFUyNvYup3l.jpg';

const features = [
  { icon: Beef, title: 'Hayvonlar hisobi', text: "Har bir sigir, qo'y va echkini raqami bilan kuzating." },
  { icon: HeartPulse, title: "Sog'liq nazorati", text: 'Kasal va davolanayotgan hayvonlarni darhol ko‘ring.' },
  { icon: Milk, title: 'Mahsulot', text: "Sut, go'sht, tuxum va jun ishlab chiqarish grafiklari." },
  { icon: Wallet, title: 'Moliya', text: "Daromad va xarajatlarni so'mda oyma-oy tahlil qiling." },
  { icon: Recycle, title: 'Chiqindilar', text: 'Go‘ng va boshqa chiqindilarni hisoblang.' },
];

const roles = [
  { title: 'Direktor', text: 'Ferma yaratadi, xodimlarni havola orqali taklif qiladi, barcha statistikani ko‘radi va xodimlarni guruhdan chiqara oladi.', cta: 'Direktor sifatida kirish →' },
  { title: 'Xodim', text: 'Direktor yuborgan havola orqali qo‘shiladi va hayvonlar, mahsulot, moliya hamda chiqindilar ma’lumotini kiritadi.', cta: 'Xodim sifatida kirish →' },
];

export default function Landing() {
  const nav = useNavigate();
  const { user } = useAuth();
  const go = () => nav(user ? '/dashboard' : '/onboarding');
  return (
    <div className="min-h-screen bg-[hsl(var(--forest))] text-white">
      <section className="relative overflow-hidden">
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--forest)/0.6)] via-[hsl(var(--forest)/0.5)] to-[hsl(var(--forest))]" />
        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 font-display text-2xl">
            <Sprout className="h-7 w-7 text-accent" />
            AgroStat
          </div>
          <div className="flex items-center gap-2"><LangSwitcher className="bg-white/15 text-white" />
          <Button onClick={go} className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
            {t(user ? 'Panelga o‘tish' : 'Kirish')}
          </Button></div>
        </nav>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 mx-auto max-w-4xl px-6 pb-32 pt-20 text-center">
          <h1 className="font-display text-5xl leading-tight md:text-7xl">{t('Fermangiz — bir qarashda.')}</h1>
          <div className="mx-auto mt-4 h-1 w-48 rounded-full bg-accent" />
          <p className="mx-auto mt-6 max-w-xl text-white/75">
            {t('Yirik fermer xo‘jaliklari uchun statistika paneli: hayvonlar soni, mahsulot, kasalliklar, daromad va chiqindilar — barchasi bitta joyda.')}
          </p>
          <Button onClick={go} className="mt-10 h-11 rounded-full bg-accent px-8 text-accent-foreground hover:bg-accent/90">
            {t('Boshlash')} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-center font-display text-4xl">{t('Nimalarni kuzatasiz')}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className={`rounded-2xl p-6 text-center ${i === 0 ? 'bg-primary' : 'bg-[hsl(var(--forest-2))]'}`}>
              <f.icon className="mx-auto h-10 w-10 text-accent" strokeWidth={1.4} />
              <h3 className="mt-4 font-display text-lg">{t(f.title)}</h3>
              <p className="mt-2 text-sm text-white/65">{t(f.text)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <h2 className="text-center font-display text-4xl">{t('Ikki rol')}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {roles.map((r) => (
            <button key={r.title} onClick={go} className="rounded-2xl bg-[hsl(var(--forest-2))] p-6 text-left transition-colors hover:bg-primary">
              <p className="font-display text-2xl text-accent">{t(r.title)}</p>
              <p className="mt-2 text-sm text-white/70">{t(r.text)}</p>
              <p className="mt-4 text-sm font-semibold">{t(r.cta)}</p>
            </button>
          ))}
        </div>
      </section>
      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/50">© 2026 AgroStat · {t('O‘zbekiston')}</footer>
    </div>
  );
}
