import { motion } from 'framer-motion';
import { Lang, useLang } from '../lib/i18n';

const LANGS: Lang[] = ['uz', 'en', 'ru'];

export default function LangSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`relative flex rounded-full bg-foreground/10 p-1 ${className}`}>
      {LANGS.map((l) => (
        <button key={l} onClick={() => setLang(l)} className={`relative z-10 rounded-full px-2.5 py-1.5 text-xs font-bold uppercase transition-colors ${lang === l ? 'text-accent-foreground' : 'opacity-70 hover:opacity-100'}`}>
          {lang === l && <motion.span layoutId="lang-pill" className="absolute inset-0 -z-10 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
          {l}
        </button>
      ))}
    </div>
  );
}
