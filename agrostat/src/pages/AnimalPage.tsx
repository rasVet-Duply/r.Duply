import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { listRecords, saveRecord } from 'zitejs/api';
import { Skeleton } from '@project/components/ui/skeleton';
import { Button } from '@project/components/ui/button';
import AnimalDetail from '../components/AnimalDetail';
import RecordForm from '../components/RecordForm';
import { Row } from '../components/RecordsPage';
import { animalFields } from './Animals';
import { t, errMsg } from '../lib/i18n';

export default function AnimalPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [r, setR] = useState<Row | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const load = useCallback(() => listRecords({ kind: 'animals' })
    .then((res) => setR((res.records as Row[]).find((x) => x.id === id) ?? null))
    .catch(() => { toast.error(t('Ma’lumotlarni yuklab bo‘lmadi')); setR(null); }), [id]);
  useEffect(() => { load(); }, [load]);
  const back = () => nav('/animals');

  if (r === undefined) return <div className="mx-auto max-w-5xl space-y-4"><Skeleton className="h-80 rounded-3xl" /><Skeleton className="h-60 rounded-3xl" /></div>;
  if (!r) return <div className="glass mx-auto max-w-md p-8 text-center"><p className="mb-4">{t('Hayvon topilmadi')}</p><Button onClick={back}>{t('Orqaga')}</Button></div>;

  return (
    <>
      <AnimalDetail r={r} back={back} reload={load} edit={() => setEditing(true)} />
      {editing && (
        <RecordForm open onOpenChange={setEditing} fields={animalFields} title={t('Tahrirlash')} initial={r}
          onSubmit={async (data) => {
            try { await saveRecord({ kind: 'animals', id: r.id, data }); toast.success(t('Saqlandi')); setEditing(false); load(); }
            catch (e) { toast.error(errMsg(e, 'Saqlab bo‘lmadi')); }
          }} />
      )}
    </>
  );
}
