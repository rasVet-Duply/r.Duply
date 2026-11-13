import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { toast } from 'sonner';
import { Sprout, Loader2 } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { auth } from '../backend/firebase';
import FarmBackground from '../components/FarmBackground';
import LangSwitcher from '../components/LangSwitcher';
import { t } from '../lib/i18n';

export default function Login() {
  const [params] = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const done = () => window.location.assign(next);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); done(); } catch (e) { toast.error((e as Error).message.replace('Firebase: ', '')); } finally { setBusy(false); }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => (mode === 'in' ? signInWithEmailAndPassword(auth, email, pass) : createUserWithEmailAndPassword(auth, email, pass)));
  };
  const reset = async () => {
    if (!email) return toast.error(t('Emailni kiriting'));
    try { await sendPasswordResetEmail(auth, email); toast.success(t('Parolni tiklash havolasi yuborildi')); } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <FarmBackground />
      <form onSubmit={submit} className="glass w-full max-w-sm space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-2xl"><Sprout className="h-7 w-7 text-accent" />AgroStat</div>
          <LangSwitcher />
        </div>
        <p className="text-sm text-muted-foreground">{t(mode === 'in' ? 'Hisobingizga kiring' : 'Yangi hisob yarating')}</p>
        <div><Label>Email</Label><Input className="mt-1.5" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label>{t('Parol')}</Label><Input className="mt-1.5" type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} /></div>
        <Button type="submit" disabled={busy} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}{t(mode === 'in' ? 'Kirish' : 'Ro‘yxatdan o‘tish')}
        </Button>
        <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => run(() => signInWithPopup(auth, new GoogleAuthProvider()))}>Google</Button>
        <div className="flex justify-between text-sm">
          <button type="button" className="text-accent" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{t(mode === 'in' ? 'Ro‘yxatdan o‘tish' : 'Kirish')}</button>
          {mode === 'in' && <button type="button" className="text-muted-foreground" onClick={reset}>{t('Parolni unutdingizmi?')}</button>}
        </div>
      </form>
    </div>
  );
}
