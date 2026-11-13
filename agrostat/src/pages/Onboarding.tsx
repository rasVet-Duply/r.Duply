import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, logout } from 'zitejs/auth';
import { toast } from 'sonner';
import { createFarm, joinFarm } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { Sprout, Loader2 } from 'lucide-react';
import { useFarm } from '../lib/farm';
import { PENDING_CODE_KEY } from '../lib/format';
import FarmBackground from '../components/FarmBackground';
import { ThemeButton } from '../components/Layout';
import { t, errMsg } from '../lib/i18n';
import LangSwitcher from '../components/LangSwitcher';

export default function Onboarding() {
  const { me, refresh } = useFarm();
  const { user } = useAuth();
  const nav = useNavigate();
  const pending = localStorage.getItem(PENDING_CODE_KEY) ?? '';
  const [name, setName] = useState(user?.name ?? '');
  const [farmName, setFarmName] = useState('');
  const [region, setRegion] = useState('');
  const [code, setCode] = useState(pending);
  const [busy, setBusy] = useState(false);

  if (me?.farm) return <Navigate to="/dashboard" replace />;

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    if (!name.trim()) return toast.error(t('Ismingizni kiriting'));
    setBusy(true);
    try {
      await fn();
      localStorage.removeItem(PENDING_CODE_KEY);
      toast.success(t(msg));
      await refresh();
      nav('/dashboard');
    } catch (e) {
      toast.error(errMsg(e, 'Xatolik yuz berdi'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <FarmBackground />
      <div className="fixed right-5 top-5 flex items-center gap-2"><LangSwitcher /><ThemeButton /></div>
      <div className="w-full max-w-md glass p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-2 font-display text-2xl"><Sprout className="h-7 w-7 text-accent" />AgroStat</div>
        <Label>{t('Ismingiz')}</Label>
        <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Masalan: Akmal Karimov')} />
        <Tabs defaultValue={pending ? 'join' : 'create'} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">{t('Ferma yaratish')}</TabsTrigger>
            <TabsTrigger value="join">{t('Qo‘shilish')}</TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="space-y-4 pt-4">
            <div><Label>{t('Ferma nomi')}</Label><Input className="mt-1.5" value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="Zarafshon agro" /></div>
            <div><Label>{t('Hudud')}</Label><Input className="mt-1.5" value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t('Samarqand viloyati')} /></div>
            <Button disabled={busy || !farmName.trim()} className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => run(() => createFarm({ farmName, region, displayName: name }), 'Ferma yaratildi')}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{t('Direktor sifatida yaratish')}
            </Button>
          </TabsContent>
          <TabsContent value="join" className="space-y-4 pt-4">
            <div><Label>{t('Taklif kodi')}</Label><Input className="mt-1.5 font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD234XYZ" /></div>
            <Button disabled={busy || !code.trim()} className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => run(() => joinFarm({ code, displayName: name }), 'Fermaga qo‘shildingiz')}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{t('Xodim sifatida qo‘shilish')}
            </Button>
          </TabsContent>
        </Tabs>
        <button onClick={() => logout()} className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground">{t('Chiqish')}</button>
      </div>
    </div>
  );
}
