import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { listRecords, saveRecord, deleteRecord, ListRecordsInputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Skeleton } from '@project/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@project/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@project/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import RecordForm, { FieldDef } from './RecordForm';
import { PageTitle } from './Stats';
import { t, errMsg, getLang } from '../lib/i18n';

export type Row = Record<string, unknown> & { id: string };
export type Column = { key: string; label: string; render?: (r: Row) => ReactNode; className?: string };

type Props = {
  kind: ListRecordsInputType['kind'];
  title: string;
  subtitle: string;
  noun: string;
  fields: FieldDef[];
  columns: Column[];
  filterKey?: string;
  searchKeys: string[];
  defaults?: Record<string, unknown>;
  summary?: (rows: Row[]) => ReactNode;
  onOpen?: (r: Row) => void;
  detail?: (r: Row, ctx: { close: () => void; reload: () => void; edit: () => void }) => ReactNode;
};

const PAGE = 15;

export default function RecordsPage(p: Props) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);
  const open = (r: Row) => (p.onOpen ? p.onOpen(r) : p.detail ? setViewing(r) : setEditing(r));

  const load = useCallback(async () => {
    try {
      const res = await listRecords({ kind: p.kind });
      setRows(res.records as Row[]);
    } catch {
      toast.error(t('Ma’lumotlarni yuklab bo‘lmadi'));
      setRows([]);
    }
  }, [p.kind]);
  useEffect(() => { load(); }, [load]);

  const filterOpts = p.fields.find((f) => f.key === p.filterKey)?.options ?? [];
  const visible = useMemo(() => {
    let r = rows ?? [];
    const s = q.trim().toLowerCase();
    if (s) r = r.filter((x) => p.searchKeys.some((k) => String(x[k] ?? '').toLowerCase().includes(s)));
    if (p.filterKey && filter !== 'all') r = r.filter((x) => x[p.filterKey!] === filter);
    if (sort) r = [...r].sort((a, b) => {
      const av = a[sort.key] ?? '', bv = b[sort.key] ?? '';
      return (typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))) * sort.dir;
    });
    return r;
  }, [rows, q, filter, sort, p.searchKeys, p.filterKey]);
  const pages = Math.max(1, Math.ceil(visible.length / PAGE));
  const slice = visible.slice(page * PAGE, page * PAGE + PAGE);
  useEffect(() => setPage(0), [q, filter]);

  const onSave = async (data: Record<string, unknown>) => {
    try {
      await saveRecord({ kind: p.kind, id: editing && editing !== 'new' ? editing.id : undefined, data });
      toast.success(t('Saqlandi'));
      setEditing(null);
      load();
    } catch (e) {
      toast.error(errMsg(e, 'Saqlab bo‘lmadi'));
    }
  };
  const onDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    setRows((r) => r?.filter((x) => x.id !== target.id) ?? r);
    try {
      await deleteRecord({ kind: p.kind, id: target.id });
      toast.success(t('O‘chirildi'));
    } catch {
      toast.error(t('O‘chirib bo‘lmadi'));
      load();
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageTitle title={t(p.title)} subtitle={t(p.subtitle)}
        action={<Button onClick={() => setEditing('new')} className="h-11 rounded-full bg-accent px-6 text-accent-foreground shadow-lg hover:bg-accent/90"><Plus className="h-4 w-4" />{t(p.noun)} {getLang() === 'uz' ? 'qo‘shish' : ''}</Button>} />

      {rows && p.summary?.(rows)}

      <div className="glass">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Qidirish...')} className="pl-9" />
          </div>
          {p.filterKey && (
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('Barchasi')}</SelectItem>
                {filterOpts.map((o) => <SelectItem key={o} value={o}>{t(o)}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <ul className="divide-y md:hidden">
          {!rows && [0, 1, 2].map((i) => <li key={i} className="p-4"><Skeleton className="h-16 w-full" /></li>)}
          {rows && slice.length === 0 && <li className="py-12 text-center text-sm text-muted-foreground">{t('Hozircha yozuvlar yo‘q')}</li>}
          {slice.map((r) => {
            const [head, ...rest] = p.columns;
            const cell = (c: Column) => (c.render ? c.render(r) : t(String(r[c.key] ?? '—')));
            return (
              <li key={r.id} className="flex gap-3 p-4 active:bg-foreground/5" onClick={() => open(r)}>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{cell(head)}</div>
                  <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    {rest.map((c) => (
                      <div key={c.key} className="min-w-0">
                        <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{t(c.label)}</dt>
                        <dd className="truncate">{cell(c)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <Button size="icon" variant="ghost" className="shrink-0" onClick={(e) => { e.stopPropagation(); setDeleting(r); }} aria-label={t('O‘chirish')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            );
          })}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {p.columns.map((c) => (
                  <TableHead key={c.key} className={c.className}>
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 1 ? -1 : 1 }))}>
                      {t(c.label)}<ArrowUpDown className="h-3 w-3 opacity-50" />
                    </button>
                  </TableHead>
                ))}
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!rows && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={p.columns.length + 1}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
              ))}
              {rows && slice.length === 0 && (
                <TableRow><TableCell colSpan={p.columns.length + 1} className="py-12 text-center text-muted-foreground">{t('Hozircha yozuvlar yo‘q')}</TableCell></TableRow>
              )}
              {slice.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => open(r)}>
                  {p.columns.map((c) => <TableCell key={c.key} className={c.className}>{c.render ? c.render(r) : t(String(r[c.key] ?? '—'))}</TableCell>)}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)} aria-label={t('Tahrirlash')}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleting(r)} aria-label={t('O‘chirish')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>{t('Jami:')} {visible.length}</span>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span>{page + 1} / {pages}</span>
            <Button size="icon" variant="ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {viewing && p.detail?.(rows?.find((x) => x.id === viewing.id) ?? viewing, { close: () => setViewing(null), reload: load, edit: () => { setEditing(rows?.find((x) => x.id === viewing.id) ?? viewing); } })}
      {editing && (
        <RecordForm open onOpenChange={(o) => !o && setEditing(null)} fields={p.fields}
          title={editing === 'new' ? `${t('Yangi')}: ${t(p.noun).toLowerCase()}` : t('Tahrirlash')}
          initial={editing === 'new' ? { ...(p.defaults ?? {}) } : editing} onSubmit={onSave} />
      )}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Yozuvni o‘chirish?')}</AlertDialogTitle>
            <AlertDialogDescription>{t('Bu amalni qaytarib bo‘lmaydi.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Bekor qilish')}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('O‘chirish')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
