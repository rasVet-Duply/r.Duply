import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { t } from '../lib/i18n';

export function StatCard({ label, value, hint, highlight, to }: { icon?: LucideIcon; label: string; value: ReactNode; hint?: string; highlight?: boolean; to?: string }) {
  const body = (
    <div className={`group h-full rounded-3xl border p-4 shadow-lg backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 sm:p-6 ${highlight ? 'border-transparent bg-gradient-to-br from-primary to-primary/60 text-primary-foreground' : 'glass'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold sm:text-base">{t(label)}</p>
        <span className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover:rotate-45 sm:flex ${highlight ? 'bg-white text-primary' : 'border border-foreground/25'}`}>
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 break-words text-xl font-bold tracking-tight sm:mt-3 sm:text-3xl">{value}</p>
      {hint && <p className={`mt-1 text-xs sm:mt-2 sm:text-sm ${highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{t(hint)}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{children}</div>;
}

// Section headings were removed by request; only the action (e.g. "Add") is kept.
export function PageTitle({ action }: { title: string; subtitle: string; action?: ReactNode }) {
  if (!action) return null;
  return <div className="flex justify-end [&>button]:w-full sm:[&>button]:w-auto">{action}</div>;
}

const tone: Record<string, string> = {
  "Sog'lom": 'bg-chart-2/20 text-chart-2',
  Kasal: 'bg-destructive/20 text-destructive',
  Davolanmoqda: 'bg-accent/25 text-foreground',
  Daromad: 'bg-chart-2/20 text-chart-2',
  Xarajat: 'bg-destructive/20 text-destructive',
};

export function Pill({ value }: { value: unknown }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const v = String(value);
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[v] ?? 'bg-secondary text-secondary-foreground'}`}>{t(v)}</span>;
}
