import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { listSalary, saveSalaryPayment, ListSalaryOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Skeleton } from '@project/components/ui/skeleton';
import { Loader2, Plus, Trash2, CalendarCheck } from 'lucide-react';
import { StatCard, StatGrid } from './Stats';
import { fmtDate, som } from '../lib/format';
import { t, errMsg } from '../lib/i18n';

const thisMonth = () => format(new Date(), 'yyyy-MM');

export default function SalaryView({ memberId, canEdit, onChanged }: { memberId?: string; canEdit?: boolean; onChanged?: () => void }) {
  const [d, setD] = useState<ListSalaryOutputType | null>(null);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => listSalary({ memberId }).then(setD).catch((e) => toast.error(errMsg(e, 'Ma’lumotlarni yuklab bo‘lmadi'))), [memberId]);
  useEffect(() => { load(); }, [load]);

  if (!d) return <div className="space-y-3"><Skeleton className="h-28 rounded-3xl" /><Skeleton className="h-40 rounded-3xl" /></div>;

  const paid = d.payments.filter((p) => p.paymentDate.startsWith(thisMonth())).reduce((s, p) => s + p.amount, 0);
  const left = Math.max(0, (d.monthlySalary ?? 0) - paid);
  const total = d.payments.reduce((s, p) => s + p.amount, 0);

  const add = async () => {
    const n = Number(amount);
    if (!n || n <= 0) return toast.error(t('Musbat son kiriting'));
    setBusy(true);
    try {
      await saveSalaryPayment({ memberId: memberId!, amount: n, paymentDate: date, note });
      setAmount(''); setNote('');
      toast.success(t('Saqlandi'));
      await load(); onChanged?.();
    } catch (e) { toast.error(errMsg(e, 'Saqlab bo‘lmadi')); } finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    setD((x) => x && { ...x, payments: x.payments.filter((p) => p.id !== id) });
    try { await saveSalaryPayment({ memberId: memberId!, deleteId: id }); onChanged?.(); }
    catch { toast.error(t('O‘chirib bo‘lmadi')); load(); }
  };

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatCard highlight label="Oylik maosh" value={d.monthlySalary != null ? som(d.monthlySalary) : '—'} />
        <StatCard label="Shu oy berildi" value={som(paid)} />
        <StatCard label="Qolgan" value={som(left)} hint="Shu oy uchun" />
        <StatCard label="Jami olingan" value={som(total)} />
      </StatGrid>
      {canEdit && (
        <div className="glass grid gap-3 p-4 sm:grid-cols-[1fr_1fr_1.5fr_auto] sm:items-end">
          <div><Label>{t('Summa (so‘m)')}</Label><Input className="mt-1.5" inputMode="numeric" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><Label>{t('Sana')}</Label><Input className="mt-1.5" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>{t('Izoh')}</Label><Input className="mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <Button onClick={add} disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{t('To‘lov qo‘shish')}</Button>
        </div>
      )}
      <div className="glass">
        <h3 className="border-b px-5 py-4 font-display text-lg">{t('To‘lovlar tarixi')}</h3>
        <ul className="divide-y">
          {d.payments.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">{t('Hozircha to‘lovlar yo‘q')}</li>}
          {d.payments.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chart-2/15 text-chart-2"><CalendarCheck className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{som(p.amount)}</p>
                <p className="truncate text-xs text-muted-foreground">{fmtDate(p.paymentDate)}{p.note && ` · ${p.note}`}</p>
              </div>
              {canEdit && <Button size="icon" variant="ghost" onClick={() => remove(p.id)} aria-label={t('O‘chirish')}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
