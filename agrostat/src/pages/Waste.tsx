import { Recycle, Leaf, Flame, Trash } from 'lucide-react';
import { format } from 'date-fns';
import RecordsPage, { Row } from '../components/RecordsPage';
import { StatCard, StatGrid, Pill } from '../components/Stats';
import { fmtDate, num } from '../lib/format';

const fields = [
  { key: 'recordDate', label: 'Sana', type: 'date' as const, required: true },
  { key: 'wasteType', label: 'Chiqindi turi', type: 'select' as const, options: ["Go'ng", 'Yem qoldiqlari', 'Plastik', 'Boshqa'], required: true },
  { key: 'quantityKg', label: 'Miqdori (kg)', type: 'number' as const, required: true },
  { key: 'disposal', label: 'Qayta ishlash', type: 'select' as const, options: ["O'g'it", 'Biogaz', 'Sotildi', 'Tashlandi'] },
  { key: 'notes', label: 'Izoh', type: 'textarea' as const },
];

const by = (rows: Row[], k: string, v: string) => rows.filter((r) => r[k] === v).reduce((s, r) => s + Number(r.quantityKg ?? 0), 0);

export default function Waste() {
  return (
    <RecordsPage
      kind="waste" title="Chiqindilar" subtitle="Go‘ng va boshqa chiqindilarni hisobga oling." noun="Yozuv"
      fields={fields} filterKey="wasteType" searchKeys={['wasteType', 'disposal', 'notes']} defaults={{ recordDate: format(new Date(), 'yyyy-MM-dd'), wasteType: "Go'ng" }}
      columns={[
        { key: 'recordDate', label: 'Sana', render: (r) => fmtDate(r.recordDate) },
        { key: 'wasteType', label: 'Turi', render: (r) => <Pill value={r.wasteType} /> },
        { key: 'quantityKg', label: 'Miqdori', render: (r) => `${num(Number(r.quantityKg ?? 0))} kg` },
        { key: 'disposal', label: 'Qayta ishlash' },
        { key: 'notes', label: 'Izoh', className: 'hidden md:table-cell max-w-xs truncate' },
      ]}
      summary={(rows) => (
        <StatGrid>
          <StatCard highlight icon={Recycle} label="Jami chiqindi" value={`${num(rows.reduce((s, r) => s + Number(r.quantityKg ?? 0), 0))} kg`} />
          <StatCard icon={Leaf} label="Go‘ng" value={`${num(by(rows, 'wasteType', "Go'ng"))} kg`} />
          <StatCard icon={Flame} label="Biogaz / o‘g‘itga" value={`${num(by(rows, 'disposal', 'Biogaz') + by(rows, 'disposal', "O'g'it"))} kg`} />
          <StatCard icon={Trash} label="Tashlandi" value={`${num(by(rows, 'disposal', 'Tashlandi'))} kg`} />
        </StatGrid>
      )}
    />
  );
}
