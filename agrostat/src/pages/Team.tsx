import { useCallback, useEffect, useState } from 'react';
import { PageTitle } from '../components/Stats';
import { toast } from 'sonner';
import { getTeam, removeMember, updateMember, GetTeamOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Skeleton } from '@project/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@project/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@project/components/ui/alert-dialog';
import { Copy, UserMinus, Search, Loader2, ChevronRight, Phone } from 'lucide-react';
import SalaryView from '../components/SalaryView';
import { useFarm } from '../lib/farm';
import { fmtDate, som } from '../lib/format';
import { t, errMsg } from '../lib/i18n';

type Member = GetTeamOutputType['members'][0];

function MemberForm({ m, onSaved }: { m: Member; onSaved: () => void }) {
  const [f, setF] = useState({ displayName: m.displayName, position: m.position, phone: m.phone, hireDate: m.hireDate, salary: m.monthlySalary?.toString() ?? '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    if (!f.displayName.trim()) return toast.error(t('Majburiy maydon'));
    const sal = f.salary === '' ? null : Number(f.salary);
    if (sal != null && (isNaN(sal) || sal < 0)) return toast.error(t('Musbat son kiriting'));
    setBusy(true);
    try {
      await updateMember({ memberId: m.id, displayName: f.displayName.trim(), position: f.position, phone: f.phone, hireDate: f.hireDate, monthlySalary: sal });
      toast.success(t('Saqlandi')); onSaved();
    } catch (e) { toast.error(errMsg(e, 'Saqlab bo‘lmadi')); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      <div><Label>{t('Ism')}</Label><Input className="mt-1.5" value={f.displayName} onChange={set('displayName')} /></div>
      <div><Label>{t('Lavozim')}</Label><Input className="mt-1.5" value={f.position} onChange={set('position')} placeholder={t('Masalan: sog‘uvchi, cho‘pon')} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>{t('Telefon')}</Label><Input className="mt-1.5" type="tel" value={f.phone} onChange={set('phone')} placeholder="+998" /></div>
        <div><Label>{t('Ishga kirgan sana')}</Label><Input className="mt-1.5" type="date" value={f.hireDate} onChange={set('hireDate')} /></div>
      </div>
      <div><Label>{t('Oylik maosh (so‘m)')}</Label><Input className="mt-1.5" type="number" inputMode="numeric" value={f.salary} onChange={set('salary')} /></div>
      <Button onClick={save} disabled={busy} className="w-full">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{t('Saqlash')}</Button>
    </div>
  );
}

export default function Team() {
  const { me } = useFarm();
  const isDirector = me?.role === 'Direktor';
  const [members, setMembers] = useState<Member[] | null>(null);
  const [q, setQ] = useState('');
  const [removing, setRemoving] = useState<Member | null>(null);
  const [open, setOpen] = useState<Member | null>(null);
  const load = useCallback(() => getTeam({}).then((r) => setMembers(r.members)).catch(() => toast.error(t('Jamoani yuklab bo‘lmadi'))), []);
  useEffect(() => { load(); }, [load]);

  const link = me?.farm?.inviteCode ? `${window.location.origin}/join/${me.farm.inviteCode}` : '';
  const copy = (txt: string) => navigator.clipboard.writeText(txt).then(() => toast.success(t('Nusxalandi')));
  const doRemove = async () => {
    if (!removing) return;
    const target = removing;
    setRemoving(null); setOpen(null);
    setMembers((m) => m?.filter((x) => x.id !== target.id) ?? m);
    try { await removeMember({ memberId: target.id }); toast.success(t('Xodim chiqarildi')); } catch { toast.error(t('Chiqarib bo‘lmadi')); load(); }
  };
  const list = (members ?? []).filter((m) => `${m.displayName} ${m.email} ${m.position}`.toLowerCase().includes(q.toLowerCase()));
  const payroll = (members ?? []).reduce((s, m) => s + (m.monthlySalary ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageTitle title="Jamoa" subtitle={isDirector ? 'Xodimlar, maosh va to‘lovlar' : 'Fermangiz xodimlari'} />
      {isDirector && link && (
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/60 p-5 text-primary-foreground shadow-lg sm:p-6">
          <p className="font-display text-xl">{t('Xodimlarni taklif qilish')}</p>
          <p className="mt-1 text-sm text-primary-foreground/70">{t('Ushbu havolani xodimga yuboring. Kod:')} <span className="font-mono font-semibold text-accent">{me!.farm!.inviteCode}</span></p>
          <div className="mt-4 flex gap-2">
            <Input readOnly value={link} className="bg-background/40 font-mono text-xs" />
            <Button onClick={() => copy(link)} className="bg-accent text-accent-foreground hover:bg-accent/90"><Copy className="h-4 w-4" /><span className="hidden sm:inline">{t('Nusxa')}</span></Button>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/80">{t('Oylik fond:')} <b>{som(payroll)}</b></p>
        </div>
      )}
      <div className="glass">
        <div className="border-b p-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Qidirish...')} className="pl-9" /></div>
        </div>
        <ul className="divide-y">
          {!members && [0, 1, 2].map((i) => <li key={i} className="p-4"><Skeleton className="h-10" /></li>)}
          {list.map((m) => {
            const Row = isDirector ? 'button' : 'div';
            return (
              <li key={m.id}>
                <Row onClick={isDirector ? () => setOpen(m) : undefined} className={`flex w-full items-center gap-3 p-4 text-left ${isDirector ? 'transition hover:bg-foreground/5 active:bg-foreground/10' : ''}`}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-lg text-accent">{m.displayName.charAt(0).toUpperCase() || '?'}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{m.displayName}{m.isMe && <span className="text-muted-foreground"> {t('(siz)')}</span>}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.position || t(m.role)} · {fmtDate(m.hireDate || m.joinedAt)}</p>
                    {isDirector && m.monthlySalary != null && (
                      <p className="mt-0.5 text-xs"><span className="text-chart-2">{som(m.paidMonth ?? 0)}</span> / {som(m.monthlySalary)}</p>
                    )}
                  </div>
                  <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline ${m.role === 'Direktor' ? 'bg-accent/20 text-accent' : 'bg-secondary'}`}>{t(m.role)}</span>
                  {isDirector && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </Row>
              </li>
            );
          })}
          {members && list.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">{t('Hech kim topilmadi')}</li>}
        </ul>
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {open && (
            <>
              <SheetHeader className="mb-4 text-left">
                <SheetTitle className="font-display text-2xl">{open.displayName}</SheetTitle>
                <p className="text-sm text-muted-foreground">{open.email}{open.phone && <> · <a href={`tel:${open.phone}`} className="inline-flex items-center gap-1 text-accent"><Phone className="h-3 w-3" />{open.phone}</a></>}</p>
              </SheetHeader>
              <Tabs defaultValue="salary">
                <TabsList className="mb-4 grid w-full grid-cols-2">
                  <TabsTrigger value="salary">{t('Maosh')}</TabsTrigger>
                  <TabsTrigger value="info">{t('Ma’lumotlar')}</TabsTrigger>
                </TabsList>
                <TabsContent value="salary"><SalaryView memberId={open.id} canEdit onChanged={load} /></TabsContent>
                <TabsContent value="info">
                  <MemberForm key={open.id} m={open} onSaved={() => { load(); setOpen(null); }} />
                  {!open.isMe && (
                    <Button variant="outline" className="mt-3 w-full text-destructive" onClick={() => setRemoving(open)}><UserMinus className="h-4 w-4" />{t('Chiqarish')}</Button>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{removing?.displayName} {t('ni guruhdan chiqarish?')}</AlertDialogTitle>
            <AlertDialogDescription>{t('U fermaning ma’lumotlariga kira olmaydi. Keyin yana taklif qilishingiz mumkin.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Bekor qilish')}</AlertDialogCancel>
            <AlertDialogAction onClick={doRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('Chiqarish')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
