import { format } from 'date-fns';
import RecordsPage, { Row } from '../components/RecordsPage';
import { useNavigate } from 'react-router-dom';
import { animalPhoto } from '../components/AnimalDetail';
import { StatCard, StatGrid, Pill } from '../components/Stats';
import { fmtDate, num } from '../lib/format';
import { t } from '../lib/i18n';

export const animalFields = [
  { key: 'photo', label: 'Rasm', type: 'photo' as const },
  { key: 'tagNumber', label: 'Raqam (birka)', type: 'text' as const, required: true },
  { key: 'species', label: 'Turi', type: 'select' as const, options: ['Sigir', "Qo'y", 'Echki', 'Ot', 'Tovuq'], required: true },
  { key: 'breed', label: 'Zoti', type: 'text' as const },
  { key: 'sex', label: 'Jinsi', type: 'select' as const, options: ["Urg'ochi", 'Erkak'] },
  { key: 'birthDate', label: 'Tug‘ilgan sana', type: 'date' as const },
  { key: 'arrivalDate', label: 'Kelgan sana', type: 'date' as const },
  { key: 'arrivalWeightKg', label: 'Kelgandagi vazn (kg)', type: 'number' as const },
  { key: 'weightKg', label: 'Hozirgi vazn (kg)', type: 'number' as const },
  { key: 'healthStatus', label: 'Sog‘ligi', type: 'select' as const, options: ["Sog'lom", 'Kasal', 'Davolanmoqda'], required: true },
  { key: 'notes', label: 'Izoh', type: 'textarea' as const },
];

const alive = (rows: Row[]) => rows.filter((r) => r.lifeStatus !== "O'lgan");
const count = (rows: Row[], s: string) => alive(rows).filter((r) => r.healthStatus === s).length;

export default function Animals() {
  const nav = useNavigate();
  return (
    <RecordsPage
      kind="animals" title="Hayvonlar" subtitle="Har bir hayvonni raqami, zoti va sog‘ligi bilan kuzating." noun="Hayvon"
      fields={animalFields} filterKey="species" searchKeys={['tagNumber', 'breed', 'species']}
      defaults={{ healthStatus: "Sog'lom", species: 'Sigir', arrivalDate: format(new Date(), 'yyyy-MM-dd') }}
      onOpen={(r) => nav(`/animals/${r.id}`)}
      columns={[
        { key: 'tagNumber', label: 'Raqam', render: (r) => (
          <span className="flex items-center gap-3">
            <img src={animalPhoto(r)} alt="" className={`h-11 w-11 shrink-0 rounded-xl object-cover ${r.lifeStatus === "O'lgan" ? 'grayscale' : ''}`} />
            <span className="font-mono font-semibold">#{String(r.tagNumber)}</span>
          </span>
        ) },
        { key: 'species', label: 'Turi', render: (r) => t(String(r.species ?? '—')) },
        { key: 'breed', label: 'Zoti', className: 'hidden md:table-cell' },
        { key: 'arrivalDate', label: 'Kelgan sana', render: (r) => fmtDate(r.arrivalDate), className: 'hidden lg:table-cell' },
        { key: 'weightKg', label: 'Vazn', render: (r) => (r.weightKg != null ? `${num(Number(r.weightKg))} kg` : '—') },
        { key: 'healthStatus', label: 'Sog‘ligi', render: (r) => (r.lifeStatus === "O'lgan" ? <Pill value="O‘lgan" /> : <Pill value={r.healthStatus} />) },
      ]}
      summary={(rows) => {
        const a = alive(rows);
        const w = a.filter((r) => typeof r.weightKg === 'number');
        return (
          <StatGrid>
            <StatCard highlight label="Tirik hayvonlar" value={a.length} hint={`${rows.length - a.length} ${t('o‘lgan')}`} />
            <StatCard label="Sog‘lom" value={count(rows, "Sog'lom")} />
            <StatCard label="Kasal / davolanmoqda" value={count(rows, 'Kasal') + count(rows, 'Davolanmoqda')} />
            <StatCard label="O‘rtacha vazn" value={w.length ? `${num(w.reduce((s, r) => s + Number(r.weightKg), 0) / w.length)} kg` : '—'} />
          </StatGrid>
        );
      }}
    />
  );
}
