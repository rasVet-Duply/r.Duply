import { useEffect, useState } from 'react';
import { getDashboard, GetDashboardOutputType } from 'zitejs/api';
import { Skeleton } from '@project/components/ui/skeleton';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { StatCard, StatGrid, PageTitle } from '../components/Stats';
import { useFarm } from '../lib/farm';
import { som, num, monthLabel } from '../lib/format';
import { t } from '../lib/i18n';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const tip = { contentStyle: { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12 }, cursor: { fill: 'hsl(var(--muted))' } };
const axis = { stroke: 'hsl(var(--muted-foreground))', fontSize: 12, tickLine: false, axisLine: false };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-5">
      <h2 className="mb-4 font-display text-xl">{t(title)}</h2>
      <div className="h-64">{children}</div>
    </div>
  );
}

function last6() {
  const out: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) { const x = new Date(now.getFullYear(), now.getMonth() - i, 1); out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`); }
  return out;
}

function Overview({ d, isDir }: { d: GetDashboardOutputType; isDir: boolean }) {
  const months = last6();
  const cur = months[5];
  const data = months.map((m) => ({
    month: monthLabel(m), key: m,
    prod: d.productionByMonth.filter((r) => r.month === m).reduce((s, r) => s + r.total, 0),
    waste: d.wasteByMonth.find((r) => r.month === m)?.total ?? 0,
    income: (d.financeByMonth.find((r) => r.month === m)?.income ?? 0) / 1e6,
  }));
  const bar = (key: string, color: string, name: string) => (
    <Bar dataKey={key} name={name} radius={[999, 999, 999, 999]} barSize={18}>
      {data.map((r) => <Cell key={r.key} fill={r.key === cur ? color : `url(#hatch-${key})`} stroke={color} strokeOpacity={r.key === cur ? 0 : 0.5} />)}
    </Bar>
  );
  return (
    <div className="glass p-5 lg:col-span-2">
      <div className="mb-4 flex items-end justify-between gap-2">
        <h2 className="font-display text-xl">{t('Umumiy statistika')}</h2>
        <span className="text-xs text-muted-foreground">{t('so‘nggi 6 oy')}</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={data} barGap={4}>
            <defs>
              {[['prod', COLORS[1]], ['waste', COLORS[4]], ['income', COLORS[0]]].map(([k, c]) => (
                <pattern key={k} id={`hatch-${k}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill={c} fillOpacity={0.18} /><line x1="0" y1="0" x2="0" y2="6" stroke={c} strokeWidth="3" strokeOpacity={0.55} />
                </pattern>
              ))}
            </defs>
            <XAxis dataKey="month" {...axis} /><YAxis {...axis} width={40} />
            <Tooltip {...tip} formatter={(v: number, n: string) => (n === t('Daromad (mln)') ? `${num(v)} mln` : num(v))} /><Legend />
            {bar('prod', COLORS[1], t('Mahsulot'))}
            {bar('waste', COLORS[4], t('Chiqindilar (kg)'))}
            {isDir && bar('income', COLORS[0], t('Daromad (mln)'))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HealthGauge({ d }: { d: GetDashboardOutputType }) {
  const total = d.totals.animals, healthy = total - d.totals.sick;
  const pct = total ? Math.round((healthy / total) * 100) : 0;
  return (
    <div className="glass flex flex-col p-5">
      <h2 className="font-display text-xl">{t('Podaning sog‘ligi')}</h2>
      <div className="relative h-44 flex-1">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={[{ v: healthy || 0 }, { v: d.totals.sick || (total ? 0 : 1) }]} dataKey="v" startAngle={180} endAngle={0} cy="80%" innerRadius="95%" outerRadius="130%" cornerRadius={20} paddingAngle={total && d.totals.sick ? 3 : 0} stroke="none">
              <Cell fill={COLORS[1]} /><Cell fill="hsl(var(--foreground) / 0.12)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-x-0 bottom-3 text-center">
          <p className="text-4xl font-bold">{pct}%</p>
          <p className="text-xs text-muted-foreground">{t('Sog‘lom hayvonlar')}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-chart-2" />{t('Sog‘lom')} {healthy}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />{t('Kasal')} {d.totals.sick}</span>
      </div>
    </div>
  );
}

const Empty = () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t('Ma’lumot yo‘q')}</div>;

export default function Dashboard() {
  const { me } = useFarm();
  const isDir = me?.role === 'Direktor';
  const [d, setD] = useState<GetDashboardOutputType | null>(null);
  useEffect(() => { getDashboard({}).then(setD).catch(() => toast.error(t('Statistikani yuklab bo‘lmadi'))); }, []);

  const prodData = d ? Object.values(d.productionByMonth.reduce<Record<string, Record<string, number | string>>>((acc, r) => {
    acc[r.month] ??= { month: monthLabel(r.month) };
    acc[r.month][t(r.product)] = r.total;
    return acc;
  }, {})) : [];
  const products = d ? [...new Set(d.productionByMonth.map((r) => t(r.product)))] : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageTitle title="Boshqaruv paneli" subtitle={`${me?.farm?.region || t('Fermangizning umumiy ko‘rsatkichlari')} · ${t('so‘nggi 6 oy')}`} />
      {!d ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div> : (
        <>
          <StatGrid>
            <StatCard highlight to="/animals" label="Jami hayvonlar" value={d.totals.animals} hint={`${d.animalsBySpecies.length} ${t('xil tur')}`} />
            <StatCard to="/animals" label="Kasallar" value={d.totals.sick} hint="Kasal yoki davolanmoqda" />
            <StatCard to="/production" label="Sut (30 kun)" value={`${num(d.totals.milk30)} l`} hint="Oxirgi 30 kun" />
            {isDir
              ? <StatCard to="/finance" label="Sof foyda" value={som(d.totals.income - d.totals.expense)} hint={`${t('Daromad')} ${som(d.totals.income)} · ${t('Xarajat')} ${som(d.totals.expense)}`} />
              : <StatCard to="/waste" label="Chiqindilar (kg)" value={`${num(d.totals.waste)} kg`} />}
          </StatGrid>
          <div className="grid gap-4 lg:grid-cols-3">
            <Overview d={d} isDir={isDir} />
            <HealthGauge d={d} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {isDir && <Panel title="Moliya">
              {d.financeByMonth.length ? (
                <ResponsiveContainer><BarChart data={d.financeByMonth.map((r) => ({ ...r, month: monthLabel(r.month) }))}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="month" {...axis} /><YAxis {...axis} width={70} tickFormatter={(v) => num(v / 1e6) + 'm'} />
                  <Tooltip {...tip} formatter={(v: number) => som(v)} /><Legend />
                  <Bar dataKey="income" name={t('Daromad')} fill={COLORS[1]} radius={[6, 6, 0, 0]} /><Bar dataKey="expense" name={t('Xarajat')} fill={COLORS[3]} radius={[6, 6, 0, 0]} />
                </BarChart></ResponsiveContainer>) : <Empty />}
            </Panel>}
            <Panel title="Mahsulot">
              {prodData.length ? (
                <ResponsiveContainer><BarChart data={prodData}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="month" {...axis} /><YAxis {...axis} width={50} />
                  <Tooltip {...tip} /><Legend />
                  {products.map((p, i) => <Bar key={p} dataKey={p} stackId="a" fill={COLORS[i % 5]} />)}
                </BarChart></ResponsiveContainer>) : <Empty />}
            </Panel>
            <Panel title="Hayvonlar turi bo‘yicha">
              {d.animalsBySpecies.length ? (
                <ResponsiveContainer><PieChart>
                  <Pie data={d.animalsBySpecies.map((r) => ({ ...r, species: t(r.species) }))} dataKey="count" nameKey="species" innerRadius={55} outerRadius={95} paddingAngle={3} stroke="none">
                    {d.animalsBySpecies.map((_, i) => <Cell key={i} fill={COLORS[i % 5]} />)}
                  </Pie><Tooltip {...tip} /><Legend />
                </PieChart></ResponsiveContainer>) : <Empty />}
            </Panel>
            <Panel title="Chiqindilar (kg)">
              {d.wasteByType.length ? (
                <ResponsiveContainer><BarChart data={d.wasteByType.map((r) => ({ ...r, type: t(r.type) }))} layout="vertical">
                  <XAxis type="number" {...axis} /><YAxis type="category" dataKey="type" {...axis} width={110} />
                  <Tooltip {...tip} formatter={(v: number) => `${num(v)} kg`} /><Bar dataKey="total" name={t('Miqdor')} fill={COLORS[4]} radius={[0, 6, 6, 0]} />
                </BarChart></ResponsiveContainer>) : <Empty />}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
