import { useState } from 'react';
import { PageTitle } from '../components/Stats';
import { toast } from 'sonner';
import { useAuth, logout } from 'zitejs/auth';
import { updateSettings } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Loader2, RefreshCw, LogOut, Check } from 'lucide-react';
import { useFarm } from '../lib/farm';
import { t, errMsg, useLang, Lang } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { ThemeButton } from '../components/Layout';

const LANG_OPTS: { code: Lang; name: string; flag: string }[] = [
  { code: 'uz', name: 'O‘zbekcha', flag: '🇺🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="glass p-6">
      <h2 className="font-display text-xl">{t(title)}</h2>
      <p className="mb-5 text-sm text-muted-foreground">{t(desc)}</p>
      {children}
    </div>
  );
}

export default function Settings() {
  const { me, refresh } = useFarm();
  const { user } = useAuth();
  const { lang, setLang } = useLang();
  const { theme } = useTheme();
  const isDirector = me?.role === 'Direktor';
  const [name, setName] = useState(me?.displayName ?? '');
  const [farmName, setFarmName] = useState(me?.farm?.farmName ?? '');
  const [region, setRegion] = useState(me?.farm?.region ?? '');
  const [busy, setBusy] = useState<string | null>(null);

  const save = async (key: string, input: Parameters<typeof updateSettings>[0], msg: string) => {
    setBusy(key);
    try { await updateSettings(input); await refresh(); toast.success(t(msg)); }
    catch (e) { toast.error(errMsg(e, 'Saqlab bo‘lmadi')); }
    finally { setBusy(null); }
  };
  const spin = (k: string) => busy === k && <Loader2 className="h-4 w-4 animate-spin" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle title="Sozlamalar" subtitle="Profil, ferma va hisob" />
      <Section title="Profil" desc={user?.email ?? ''}>
        <Label>{t('Ismingiz')}</Label>
        <div className="mt-1.5 flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Button disabled={!name.trim() || !!busy} onClick={() => save('name', { displayName: name }, 'Profil saqlandi')}>{spin('name')}{t('Saqlash')}</Button>
        </div>
      </Section>
      {isDirector && (
        <Section title="Ferma" desc="Ferma nomi va hududi">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>{t('Ferma nomi')}</Label><Input className="mt-1.5" value={farmName} onChange={(e) => setFarmName(e.target.value)} /></div>
            <div><Label>{t('Hudud')}</Label><Input className="mt-1.5" value={region} onChange={(e) => setRegion(e.target.value)} /></div>
          </div>
          <Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90" disabled={!farmName.trim() || !!busy}
            onClick={() => save('farm', { farmName, region }, 'Ferma saqlandi')}>{spin('farm')}{t('Saqlash')}</Button>
        </Section>
      )}
      {isDirector && (
        <Section title="Taklif kodi" desc="Yangi kod yaratilsa, eski havola ishlamay qoladi.">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-secondary px-3 py-2 font-mono text-accent">{me?.farm?.inviteCode}</span>
            <Button variant="outline" disabled={!!busy} onClick={() => save('code', { regenerateCode: true }, 'Yangi kod yaratildi')}>
              {busy === 'code' ? spin('code') : <RefreshCw className="h-4 w-4" />}{t('Yangilash')}
            </Button>
          </div>
        </Section>
      )}
      <Section title="Til" desc="Butun ilova shu tilda ko‘rsatiladi">
        <div className="grid gap-2 sm:grid-cols-3">
          {LANG_OPTS.map((o) => (
            <button key={o.code} onClick={() => setLang(o.code)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${lang === o.code ? 'border-accent bg-accent/15 ring-2 ring-accent/50' : 'hover:bg-foreground/5'}`}>
              <span className="text-2xl">{o.flag}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{o.name}</span>
                {o.code === 'uz' && <span className="text-xs text-muted-foreground">{t('Asosiy til')}</span>}
              </span>
              {lang === o.code && <Check className="h-5 w-5 text-accent" />}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Mavzu" desc="Qorong‘i yoki yorug‘ ko‘rinish">
        <div className="flex items-center gap-3"><ThemeButton /><span className="text-sm">{t(theme === 'dark' ? 'Qorong‘i' : 'Yorug‘')}</span></div>
      </Section>
      <Section title="Hisob" desc="Ushbu qurilmadan chiqish">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => logout()}><LogOut className="h-4 w-4" />{t('Chiqish')}</Button>
        </div>
      </Section>
    </div>
  );
}
