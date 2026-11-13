import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { DatePicker } from '@project/components/ui/date-picker';
import { format, parseISO } from 'date-fns';
import { Loader2, Camera, X } from 'lucide-react';
import { useUpload } from 'zitejs/upload';
import { toast } from 'sonner';
import { t } from '../lib/i18n';

export type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'photo';
  options?: string[];
  required?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  fields: FieldDef[];
  initial: Record<string, unknown>;
  title: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
};

export default function RecordForm({ open, onOpenChange, fields, initial, title, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setValues((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const errs: Record<string, string> = {};
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.key];
      const empty = v === undefined || v === null || v === '';
      if (f.required && empty) errs[f.key] = t('Majburiy maydon');
      else if (f.type === 'number' && !empty) {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0) errs[f.key] = t('Musbat son kiriting');
        else out[f.key] = n;
      } else out[f.key] = empty ? null : v;
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await onSubmit(out);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-display text-2xl font-normal">{title}</DialogTitle></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.type === 'textarea' || f.type === 'photo' ? 'sm:col-span-2' : ''}>
              <Label>{t(f.label)}{f.required && <span className="text-accent"> *</span>}</Label>
              <div className="mt-1.5"><FieldInput f={f} value={values[f.key]} onChange={(v) => set(f.key, v)} /></div>
              {errors[f.key] && <p className="mt-1 text-xs text-destructive">{errors[f.key]}</p>}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Bekor qilish')}</Button>
          <Button disabled={busy} onClick={submit} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{t('Saqlash')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({ f, value, onChange }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const str = value === null || value === undefined ? '' : String(value);
  if (f.type === 'select')
    return (
      <Select value={str || undefined} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={t('Tanlang')} /></SelectTrigger>
        <SelectContent>{f.options?.map((o) => <SelectItem key={o} value={o}>{t(o)}</SelectItem>)}</SelectContent>
      </Select>
    );
  if (f.type === 'date')
    return <DatePicker value={str ? parseISO(str) : undefined} onChange={(d) => onChange(d ? format(d, 'yyyy-MM-dd') : null)} />;
  if (f.type === 'photo') return <PhotoInput value={str} onChange={onChange} />;
  if (f.type === 'textarea') return <Textarea rows={3} value={str} onChange={(e) => onChange(e.target.value)} />;
  return <Input type={f.type === 'number' ? 'number' : 'text'} inputMode={f.type === 'number' ? 'decimal' : undefined} value={str} onChange={(e) => onChange(e.target.value)} />;
}

function PhotoInput({ value, onChange }: { value: string; onChange: (v: unknown) => void }) {
  const { upload, isUploading } = useUpload();
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { onChange((await upload(file)).url); } catch { toast.error(t('Rasmni yuklab bo‘lmadi')); }
  };
  return (
    <label className="relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-foreground/20 bg-foreground/5 transition hover:border-accent">
      {value ? <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" /> : (
        <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          {isUploading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Camera className="h-7 w-7" />}{t('Rasm qo‘shish')}
        </span>
      )}
      {value && isUploading && <span className="absolute inset-0 flex items-center justify-center bg-black/40"><Loader2 className="h-7 w-7 animate-spin text-white" /></span>}
      {value && (
        <button type="button" onClick={(e) => { e.preventDefault(); onChange(null); }} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"><X className="h-4 w-4" /></button>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={isUploading} />
    </label>
  );
}
