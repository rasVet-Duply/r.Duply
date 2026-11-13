import { Milk, Drumstick, Egg, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import RecordsPage, { Row } from '../components/RecordsPage';
import { StatCard, StatGrid, Pill } from '../components/Stats';
import { fmtDate, num } from '../lib/format';
import { t } from '../lib/i18n';

const units: Record<string, string> = { Sut: 'l', "Go'sht": 'kg', Tuxum: 'dona', Jun: 'kg' };
const fields = [
  { key: 'recordDate', label: 'Sana', type: 'date' as const, required: true },
  { key: 'product', label: 'Mahsulot', type: 'select' as const, options: ['Sut', "Go'sht", 'Tuxum', 'Jun'], required: true },
  { key: 'quantity', label: 'Miqdori (l / kg / dona)', type: 'number' as const, required: true },
  { key: 'notes', label: 'Izoh', type: 'textarea' as const },
];

const thisMonth = (rows: Row[], p: string) => {
  const m = format(new Date(), 'yyyy-MM');
  return rows.filter((r) => r.product === p && String(r.recordDate ?? '').startsWith(m)).reduce((s, r) => s + Number(r.quantity ?? 0), 0);
};

export default function Production() {
  return (
    <RecordsPage
      kind="production" title="Mahsulot" subtitle="Sut, go‘sht, tuxum va jun ishlab chiqarishini kiriting." noun="Yozuv"
      fields={fields} filterKey="product" searchKeys={['product', 'notes']} defaults={{ recordDate: format(new Date(), 'yyyy-MM-dd'), product: 'Sut' }}
      columns={[
        { key: 'recordDate', label: 'Sana', render: (r) => fmtDate(r.recordDate) },
        { key: 'product', label: 'Mahsulot', render: (r) => <Pill value={r.product} /> },
        { key: 'quantity', label: 'Miqdori', render: (r) => `${num(Number(r.quantity ?? 0))} ${t(units[String(r.product)] ?? '')}` },
        { key: 'notes', label: 'Izoh', className: 'hidden md:table-cell max-w-xs truncate' },
      ]}
      summary={(rows) => (
        <StatGrid>
          <StatCard highlight icon={Milk} label="Sut (shu oy)" value={`${num(thisMonth(rows, 'Sut'))} l`} />
          <StatCard icon={Drumstick} label="Go‘sht (shu oy)" value={`${num(thisMonth(rows, "Go'sht"))} kg`} />
          <StatCard icon={Egg} label="Tuxum (shu oy)" value={`${num(thisMonth(rows, 'Tuxum'))} ${t('dona')}`} />
          <StatCard icon={Sparkles} label="Jun (shu oy)" value={`${num(thisMonth(rows, 'Jun'))} kg`} />
        </StatGrid>
      )}
    />
  );
}
