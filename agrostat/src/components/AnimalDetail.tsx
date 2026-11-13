import { useState } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { saveRecord } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@project/components/ui/alert-dialog';
import { Pencil, Skull, Undo2, Loader2, ArrowLeft } from 'lucide-react';
import { Row } from './RecordsPage';
import { Pill } from './Stats';
import { fmtDate, num } from '../lib/format';
import { t, errMsg } from '../lib/i18n';

// Share of live weight (fractions) — typical slaughter yields per species
const YIELD: Record<string, [string, number][]> = {
  Sigir: [['Go‘sht', 0.4], ['Suyak', 0.12], ['Yog‘', 0.04], ['Ichki a’zolar', 0.08], ['Teri', 0.07]],
  "Qo'y": [['Go‘sht', 0.32], ['Suyak', 0.09], ['Yog‘ (dumba)', 0.08], ['Ichki a’zolar', 0.07], ['Teri', 0.1]],
  Echki: [['Go‘sht', 0.33], ['Suyak', 0.1], ['Yog‘', 0.03], ['Ichki a’zolar', 0.08], ['Teri', 0.08]],
  Ot: [['Go‘sht', 0.45], ['Suyak', 0.12], ['Yog‘', 0.04], ['Ichki a’zolar', 0.07], ['Teri', 0.06]],
  Tovuq: [['Go‘sht', 0.55], ['Suyak', 0.15], ['Yog‘', 0.04], ['Ichki a’zolar', 0.08], ['Pat', 0.07]],
};

export const SPECIES_PHOTO: Record<string, string> = {
  Sigir: 'https://images.fillout.com/924155/qtvxhnnszj/generated-images/hNah7DxwXEQzcq6wFL6J3q/img_UCvRPzzeO48Y99vC.jpg',
  "Qo'y": 'https://images.fillout.com/924155/qtvxhnnszj/generated-images/3gGJbKJzGiYusWJF6aVM32/img_Z6J8ct1mk3peHvhG.jpg',
  Echki: 'https://images.fillout.com/924155/qtvxhnnszj/generated-images/sPfKTRi9Gonsc24zkXYpBn/img_CqNW_-R_MvRYUmmP.jpg',
  Ot: 'https://images.fillout.com/924155/qtvxhnnszj/generated-images/9bAKaeZHgqZPc4gu3o38Et/img__UfUz2ve8SgE0UH4.jpg',
  Tovuq: 'https://images.fillout.com/924155/qtvxhnnszj/generated-images/8kVuy4UxAB1Wz4oCTWy9ds/img_23YJR6grKhJ4gM1L.jpg',
};
export const animalPhoto = (r: Row) => (r.photo ? String(r.photo) : SPECIES_PHOTO[String(r.species)] ?? SPECIES_PHOTO.Sigir);

const d = (v: unknown) => (v ? parseISO(String(v).slice(0, 10)) : null);
const today = () => format(new Date(), 'yyyy-MM-dd');

export function yields(r: Row) {
  const w = Number(r.weightKg ?? r.arrivalWeightKg ?? 0);
  const born = d(r.birthDate);
  const ageDays = born ? differenceInDays(d(r.deathDate) ?? new Date(), born) : null;
  const young = ageDays != null && ageDays < 365 && r.species !== 'Tovuq';
  const k = young ? 0.9 : 1; // young animals give a bit less meat
  return { w, parts: (YIELD[String(r.species)] ?? YIELD.Sigir).map(([n, f], i) => [n, w * f * (i === 0 ? k : 1)] as const) };
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-3 backdrop-blur">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t(label)}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

export default function AnimalDetail({ r, back, reload, edit }: { r: Row; back: () => void; reload: () => void; edit: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const dead = r.lifeStatus === "O'lgan";
  const born = d(r.birthDate), arrived = d(r.arrivalDate), end = d(r.deathDate) ?? new Date();
  const ageM = born ? Math.floor(differenceInDays(end, born) / 30.4) : null;
  const days = arrived ? differenceInDays(end, arrived) : null;
  const w0 = r.arrivalWeightKg != null ? Number(r.arrivalWeightKg) : null, w1 = r.weightKg != null ? Number(r.weightKg) : null;
  const gain = w0 != null && w1 != null ? w1 - w0 : null;
  const { w, parts } = yields(r);
  const kg = (n: number | null) => (n == null ? '—' : `${num(Math.round(n * 10) / 10)} kg`);

  const setStatus = async (status: string) => {
    setBusy(true);
    try {
      await saveRecord({ kind: 'animals', id: r.id, data: { ...r, lifeStatus: status, deathDate: status === "O'lgan" ? today() : null } });
      toast.success(t('Saqlandi'));
      setConfirm(false); reload();
    } catch (e) { toast.error(errMsg(e, 'Saqlab bo‘lmadi')); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl glass">
        <div className="relative h-64 sm:h-96">
          <img src={animalPhoto(r)} alt="" className={`h-full w-full object-cover ${dead ? 'grayscale' : ''}`} />
          <button onClick={back} className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-black/60">
            <ArrowLeft className="h-4 w-4" />{t('Orqaga')}
          </button>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 text-white sm:p-8">
            <h1 className="font-display text-3xl text-white sm:text-4xl">#{String(r.tagNumber)}</h1>
            <p className="text-sm text-white/80">{t(String(r.species))}{r.breed ? ` · ${r.breed}` : ''}{r.sex ? ` · ${t(String(r.sex))}` : ''}</p>
          </div>
          {dead && <span className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">{t('O‘lgan')} · {fmtDate(r.deathDate)}</span>}
        </div>

        <div className="grid gap-5 p-5 sm:p-8 lg:grid-cols-2"><div className="space-y-5">
          <div className="flex items-center gap-2"><Pill value={r.healthStatus} /><span className="flex-1" />
            <Button size="sm" variant="outline" onClick={edit}><Pencil className="h-4 w-4" />{t('Tahrirlash')}</Button></div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Stat label="Yoshi" value={ageM == null ? '—' : ageM >= 12 ? `${Math.floor(ageM / 12)} ${t('yil')} ${ageM % 12} ${t('oy')}` : `${ageM} ${t('oy')}`} />
            <Stat label="Kelgan sana" value={fmtDate(r.arrivalDate)} />
            <Stat label="Fermada" value={days == null ? '—' : `${days} ${t('kun')}`} />
            <Stat label="Kelgandagi vazn" value={kg(w0)} />
            <Stat label="Hozirgi vazn" value={kg(w1)} />
            <Stat label="Vazn o‘sishi" value={gain == null ? '—' : <span className={gain >= 0 ? 'text-chart-2' : 'text-destructive'}>{gain >= 0 ? '+' : ''}{kg(gain)}</span>} />
            {gain != null && days ? <Stat label="Kunlik o‘sish" value={`${num(Math.round((gain / days) * 100) / 100)} kg`} /> : null}
            <Stat label="Tug‘ilgan sana" value={fmtDate(r.birthDate)} />
          </div>

          </div><div className="space-y-5">
          <div className={`rounded-3xl border p-4 ${dead ? 'border-accent/50 bg-accent/10' : 'border-foreground/10 bg-foreground/5'}`}>
            <p className="font-display text-lg">{t(dead ? 'Olingan mahsulot (taxminiy)' : 'Taxminiy so‘yim chiqishi')}</p>
            <p className="mb-3 text-xs text-muted-foreground">{t('Tirik vazn')}: {kg(w)}</p>
            {w ? (
              <ul className="space-y-2">
                {parts.map(([n, v]) => (
                  <li key={n}>
                    <div className="flex justify-between text-sm"><span>{t(n)}</span><b>{kg(v)}</b></div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/10"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (v / w) * 180)}%` }} /></div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">{t('Hisoblash uchun vaznni kiriting')}</p>}
          </div>

          {r.notes ? <p className="whitespace-pre-wrap rounded-2xl bg-foreground/5 p-3 text-sm">{String(r.notes)}</p> : null}

          {dead
            ? <Button variant="outline" className="w-full" disabled={busy} onClick={() => setStatus('Tirik')}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}{t('Tirik deb belgilash')}</Button>
            : <Button className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => setConfirm(true)}><Skull className="h-4 w-4" />{t('O‘ldi')}</Button>}
        </div></div>

        <AlertDialog open={confirm} onOpenChange={setConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>#{String(r.tagNumber)} {t('o‘ldi deb belgilansinmi?')}</AlertDialogTitle>
              <AlertDialogDescription>{t('Bugungi sana yoziladi va vazn bo‘yicha mahsulot hisoblanadi:')} {parts.map(([n, v]) => `${t(n)} ${kg(v)}`).join(', ')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('Bekor qilish')}</AlertDialogCancel>
              <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); setStatus("O'lgan"); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('Tasdiqlash')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
