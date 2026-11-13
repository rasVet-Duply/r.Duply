import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import RecordsPage, { Row } from '../components/RecordsPage';
import { StatCard, StatGrid, Pill, PageTitle } from '../components/Stats';
import SalaryView from '../components/SalaryView';
import { useFarm } from '../lib/farm';
import { fmtDate, som } from '../lib/format';

const fields = [
  { key: 'description', label: 'Tavsif', type: 'text' as const, required: true },
  { key: 'kind', label: 'Turi', type: 'select' as const, options: ['Daromad', 'Xarajat'], required: true },
  { key: 'category', label: 'Toifa (yem, veterinar, sut savdosi...)', type: 'text' as const },
  { key: 'amount', label: 'Summa (so‘m)', type: 'number' as const, required: true },
  { key: 'recordDate', label: 'Sana', type: 'date' as const, required: true },
];

const sum = (rows: Row[], k: string) => rows.filter((r) => r.kind === k).reduce((s, r) => s + Number(r.amount ?? 0), 0);

export default function Finance() {
  const { me } = useFarm();
  if (me?.role !== 'Direktor') return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageTitle title="Mening maoshim" subtitle="Qachon va qancha olganingiz, qancha qolgani" />
      <SalaryView />
    </div>
  );
  return <DirectorFinance />;
}

function DirectorFinance() {
  return (
    <RecordsPage
      kind="finance" title="Moliya" subtitle="Daromad va xarajatlarni so‘mda yuriting." noun="Operatsiya"
      fields={fields} filterKey="kind" searchKeys={['description', 'category']} defaults={{ kind: 'Xarajat', recordDate: format(new Date(), 'yyyy-MM-dd') }}
      columns={[
        { key: 'recordDate', label: 'Sana', render: (r) => fmtDate(r.recordDate) },
        { key: 'description', label: 'Tavsif' },
        { key: 'category', label: 'Toifa', className: 'hidden md:table-cell' },
        { key: 'kind', label: 'Turi', render: (r) => <Pill value={r.kind} /> },
        { key: 'amount', label: 'Summa', className: 'text-right', render: (r) => (
          <span className={r.kind === 'Daromad' ? 'text-chart-2' : 'text-destructive'}>{r.kind === 'Daromad' ? '+' : '−'}{som(Number(r.amount ?? 0))}</span>
        ) },
      ]}
      summary={(rows) => {
        const m = format(new Date(), 'yyyy-MM');
        const month = rows.filter((r) => String(r.recordDate ?? '').startsWith(m));
        const inc = sum(rows, 'Daromad'), exp = sum(rows, 'Xarajat');
        return (
          <StatGrid>
            <StatCard highlight icon={Wallet} label="Sof foyda (jami)" value={som(inc - exp)} />
            <StatCard icon={TrendingUp} label="Daromad (jami)" value={som(inc)} />
            <StatCard icon={TrendingDown} label="Xarajat (jami)" value={som(exp)} />
            <StatCard icon={Receipt} label="Shu oy foyda" value={som(sum(month, 'Daromad') - sum(month, 'Xarajat'))} />
          </StatGrid>
        );
      }}
    />
  );
}
