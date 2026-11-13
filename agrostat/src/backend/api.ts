/**
 * Firebase version of the AgroStat "server" functions.
 * The same function names as the original app, so pages work unchanged.
 * Access control is enforced by firestore.rules (keep them deployed!).
 */
import {
  collection, doc, getDoc, getDocs, query, where, writeBatch, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { format, subMonths, subDays } from 'date-fns';
import { auth, db } from './firebase';

export class AppError extends Error {
  userFacingMessage: string;
  constructor(msg: string) { super(msg); this.userFacingMessage = msg; }
}

type Role = 'Direktor' | 'Xodim';
type Kind = 'animals' | 'production' | 'finance' | 'waste';
type Rec = Record<string, unknown> & { id: string };

function uid() {
  const u = auth.currentUser;
  if (!u) throw new AppError('Iltimos, tizimga kiring.');
  return u.uid;
}
async function membership() {
  const s = await getDoc(doc(db, 'members', uid()));
  return s.exists() ? (s.data() as { farmId: string; role: Role; displayName: string }) : null;
}
async function requireMembership(director = false) {
  const m = await membership();
  if (!m) throw new AppError('Siz hech qaysi fermaga a’zo emassiz.');
  if (director && m.role !== 'Direktor') throw new AppError('Bu amal faqat direktor uchun.');
  return m;
}
function newInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => chars[b % chars.length]).join('');
}
async function listFarm(col: string, farmId: string, extra: ReturnType<typeof where>[] = []): Promise<Rec[]> {
  const s = await getDocs(query(collection(db, col), where('farmId', '==', farmId), ...extra));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
const clean = (o: Record<string, unknown>) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, farmId, ...rest } = o;
  return Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v === '' || v === undefined ? null : v]));
};

// ---------- me / farm ----------
export type GetMeOutputType = {
  farm: { id: string; farmName: string; region: string; inviteCode: string | null } | null;
  role: Role | null;
  displayName: string | null;
};
export async function getMe(_: object = {}): Promise<GetMeOutputType> {
  const m = await membership();
  if (!m) return { farm: null, role: null, displayName: null };
  const f = await getDoc(doc(db, 'farms', m.farmId));
  if (!f.exists()) return { farm: null, role: null, displayName: null };
  const code = m.role === 'Direktor' ? ((await getDoc(doc(db, 'farmSecrets', m.farmId))).data()?.inviteCode ?? null) : null;
  return { farm: { id: f.id, farmName: f.data().farmName ?? '', region: f.data().region ?? '', inviteCode: code }, role: m.role, displayName: m.displayName };
}

export async function createFarm(input: { farmName: string; region: string; displayName: string }) {
  if (await membership()) throw new AppError('Siz allaqachon fermaga a’zosiz.');
  const me = uid();
  const farmRef = doc(collection(db, 'farms'));
  const code = newInviteCode();
  const b = writeBatch(db);
  b.set(farmRef, { farmName: input.farmName.trim(), region: input.region.trim(), ownerUid: me, createdAt: serverTimestamp() });
  b.set(doc(db, 'members', me), {
    farmId: farmRef.id, role: 'Direktor', displayName: input.displayName.trim(), email: auth.currentUser?.email ?? '',
    joinedAt: format(new Date(), 'yyyy-MM-dd'), position: '', phone: '', hireDate: '',
  });
  b.set(doc(db, 'farmSecrets', farmRef.id), { inviteCode: code });
  b.set(doc(db, 'invites', code), { farmId: farmRef.id });
  await b.commit();
  return { farmId: farmRef.id };
}

export async function joinFarm(input: { code: string; displayName: string }) {
  if (await membership()) throw new AppError('Siz allaqachon fermaga a’zosiz.');
  const code = input.code.trim().toUpperCase();
  const inv = await getDoc(doc(db, 'invites', code));
  if (!inv.exists()) throw new AppError('Taklif kodi noto‘g‘ri.');
  const farmId = inv.data().farmId as string;
  await setDoc(doc(db, 'members', uid()), {
    farmId, role: 'Xodim', inviteCode: code, displayName: input.displayName.trim(), email: auth.currentUser?.email ?? '',
    joinedAt: format(new Date(), 'yyyy-MM-dd'), position: '', phone: '', hireDate: '',
  });
  const f = await getDoc(doc(db, 'farms', farmId));
  return { farmName: (f.data()?.farmName as string) ?? '' };
}

export async function updateSettings(input: { displayName?: string; farmName?: string; region?: string; regenerateCode?: boolean }) {
  const m = await requireMembership();
  if (input.displayName) await updateDoc(doc(db, 'members', uid()), { displayName: input.displayName.trim() });
  if (input.farmName !== undefined || input.region !== undefined) {
    await requireMembership(true);
    await updateDoc(doc(db, 'farms', m.farmId), {
      ...(input.farmName !== undefined ? { farmName: input.farmName.trim() } : {}),
      ...(input.region !== undefined ? { region: input.region.trim() } : {}),
    });
  }
  if (input.regenerateCode) {
    await requireMembership(true);
    const old = (await getDoc(doc(db, 'farmSecrets', m.farmId))).data()?.inviteCode as string | undefined;
    const code = newInviteCode();
    const b = writeBatch(db);
    if (old) b.delete(doc(db, 'invites', old));
    b.set(doc(db, 'invites', code), { farmId: m.farmId });
    b.set(doc(db, 'farmSecrets', m.farmId), { inviteCode: code });
    await b.commit();
  }
  return { success: true };
}

// ---------- records ----------
export type ListRecordsInputType = { kind: Kind };
const sortField: Record<Kind, string> = { animals: 'tagNumber', production: 'recordDate', finance: 'recordDate', waste: 'recordDate' };
export async function listRecords(input: ListRecordsInputType) {
  const m = await requireMembership(input.kind === 'finance');
  const rows = await listFarm(input.kind, m.farmId);
  const k = sortField[input.kind], dir = input.kind === 'animals' ? 1 : -1;
  rows.sort((a, b) => String(a[k] ?? '').localeCompare(String(b[k] ?? ''), undefined, { numeric: true }) * dir);
  return { records: rows };
}
export async function saveRecord(input: { kind: Kind; id?: string; data: Record<string, unknown> }) {
  const m = await requireMembership(input.kind === 'finance');
  const data = clean(input.data);
  if (input.id) { await updateDoc(doc(db, input.kind, input.id), data); return { id: input.id }; }
  const r = await addDoc(collection(db, input.kind), { ...data, farmId: m.farmId, createdAt: serverTimestamp() });
  return { id: r.id };
}
export async function deleteRecord(input: { kind: Kind; id: string }) {
  await requireMembership(input.kind === 'finance');
  await deleteDoc(doc(db, input.kind, input.id));
  return { success: true };
}

// ---------- team & salary ----------
const thisMonth = () => format(new Date(), 'yyyy-MM');
export type GetTeamOutputType = {
  members: {
    id: string; displayName: string; email: string; role: string; isMe: boolean; joinedAt: string;
    position: string; phone: string; hireDate: string; monthlySalary: number | null; paidMonth: number | null;
  }[];
};
export async function getTeam(_: object = {}): Promise<GetTeamOutputType> {
  const m = await requireMembership();
  const me = uid(), isDir = m.role === 'Direktor';
  const members = await listFarm('members', m.farmId);
  const salaries = new Map<string, number>();
  const paid = new Map<string, number>();
  if (isDir) {
    (await listFarm('salaries', m.farmId)).forEach((s) => salaries.set(s.id, Number(s.monthlySalary ?? 0)));
    (await listFarm('salaryPayments', m.farmId)).filter((p) => String(p.paymentDate).startsWith(thisMonth()))
      .forEach((p) => paid.set(String(p.memberId), (paid.get(String(p.memberId)) ?? 0) + Number(p.amount ?? 0)));
  }
  members.sort((a, b) => String(a.role).localeCompare(String(b.role)) || String(a.joinedAt).localeCompare(String(b.joinedAt)));
  return {
    members: members.map((x) => ({
      id: x.id, displayName: String(x.displayName ?? ''), email: String(x.email ?? ''), role: String(x.role ?? 'Xodim'),
      isMe: x.id === me, joinedAt: String(x.joinedAt ?? ''), position: String(x.position ?? ''),
      phone: isDir ? String(x.phone ?? '') : '', hireDate: String(x.hireDate ?? ''),
      monthlySalary: isDir && salaries.has(x.id) ? salaries.get(x.id)! : null,
      paidMonth: isDir ? paid.get(x.id) ?? 0 : null,
    })),
  };
}
export async function removeMember(input: { memberId: string }) {
  const m = await requireMembership(true);
  if (input.memberId === uid()) throw new AppError('O‘zingizni chiqara olmaysiz.');
  const b = writeBatch(db);
  b.delete(doc(db, 'members', input.memberId));
  const sal = await getDoc(doc(db, 'salaries', input.memberId)).catch(() => null);
  if (sal?.exists() && sal.data().farmId === m.farmId) b.delete(sal.ref);
  await b.commit();
  return { success: true };
}
export async function updateMember(input: { memberId: string; displayName: string; position: string; phone: string; hireDate: string; monthlySalary: number | null }) {
  const m = await requireMembership(true);
  await updateDoc(doc(db, 'members', input.memberId), {
    displayName: input.displayName, position: input.position, phone: input.phone, hireDate: input.hireDate,
  });
  await setDoc(doc(db, 'salaries', input.memberId), { farmId: m.farmId, monthlySalary: input.monthlySalary });
  return { ok: true };
}
export type ListSalaryOutputType = {
  displayName: string; position: string; monthlySalary: number | null;
  payments: { id: string; paymentDate: string; amount: number; note: string }[];
};
export async function listSalary(input: { memberId?: string }): Promise<ListSalaryOutputType> {
  const m = await requireMembership();
  const me = uid();
  const target = input.memberId ?? me;
  if (target !== me && m.role !== 'Direktor') throw new AppError('Bu amal faqat direktor uchun.');
  const mem = await getDoc(doc(db, 'members', target));
  const sal = await getDoc(doc(db, 'salaries', target)).catch(() => null);
  const pays = await listFarm('salaryPayments', m.farmId, [where('memberId', '==', target)]);
  pays.sort((a, b) => String(b.paymentDate).localeCompare(String(a.paymentDate)));
  return {
    displayName: String(mem.data()?.displayName ?? ''), position: String(mem.data()?.position ?? ''),
    monthlySalary: sal?.exists() && sal.data().monthlySalary != null ? Number(sal.data().monthlySalary) : null,
    payments: pays.map((p) => ({ id: p.id, paymentDate: String(p.paymentDate ?? ''), amount: Number(p.amount ?? 0), note: String(p.note ?? '') })),
  };
}
export async function saveSalaryPayment(input: { memberId: string; deleteId?: string; paymentDate?: string; amount?: number; note?: string }) {
  const m = await requireMembership(true);
  if (input.deleteId) { await deleteDoc(doc(db, 'salaryPayments', input.deleteId)); return { ok: true }; }
  if (!input.amount || !input.paymentDate) throw new AppError('Ma’lumotlar to‘liq emas.');
  await addDoc(collection(db, 'salaryPayments'), {
    farmId: m.farmId, memberId: input.memberId, paymentDate: input.paymentDate, amount: input.amount, note: input.note ?? '',
  });
  return { ok: true };
}

// ---------- dashboard ----------
export type GetDashboardOutputType = {
  animalsBySpecies: { species: string; count: number }[];
  health: { status: string; count: number }[];
  productionByMonth: { month: string; product: string; total: number }[];
  financeByMonth: { month: string; income: number; expense: number }[];
  wasteByMonth: { month: string; total: number }[];
  wasteByType: { type: string; total: number }[];
  totals: { animals: number; sick: number; income: number; expense: number; waste: number; milk30: number };
};
const group = <T,>(rows: T[], key: (r: T) => string, val: (r: T) => number) => {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + val(r)));
  return m;
};
export async function getDashboard(_: object = {}): Promise<GetDashboardOutputType> {
  const m = await requireMembership();
  const isDir = m.role === 'Direktor';
  const [animals, prod, waste, fin] = await Promise.all([
    listFarm('animals', m.farmId), listFarm('production', m.farmId), listFarm('waste', m.farmId),
    isDir ? listFarm('finance', m.farmId) : Promise.resolve([] as Rec[]),
  ]);
  const since = format(subMonths(new Date(), 5), 'yyyy-MM');
  const month = (r: Rec) => String(r.recordDate ?? '').slice(0, 7);
  const alive = animals.filter((a) => a.lifeStatus !== "O'lgan");
  const recentProd = prod.filter((r) => month(r) >= since);
  const recentFin = fin.filter((r) => month(r) >= since);
  const recentWaste = waste.filter((r) => month(r) >= since);
  const health = [...group(alive, (a) => String(a.healthStatus ?? 'Noma’lum'), () => 1)].map(([status, count]) => ({ status, count }));
  const prodMap = group(recentProd, (r) => `${month(r)}|${r.product}`, (r) => Number(r.quantity ?? 0));
  const months = [...new Set(recentFin.map(month))].sort();
  const financeByMonth = months.map((mo) => ({
    month: mo,
    income: recentFin.filter((r) => month(r) === mo && r.kind === 'Daromad').reduce((s, r) => s + Number(r.amount ?? 0), 0),
    expense: recentFin.filter((r) => month(r) === mo && r.kind === 'Xarajat').reduce((s, r) => s + Number(r.amount ?? 0), 0),
  }));
  const wasteByType = [...group(waste, (r) => String(r.wasteType ?? 'Boshqa'), (r) => Number(r.quantityKg ?? 0))]
    .map(([type, total]) => ({ type, total })).sort((a, b) => b.total - a.total);
  const day30 = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  return {
    animalsBySpecies: [...group(alive, (a) => String(a.species ?? 'Boshqa'), () => 1)].map(([species, count]) => ({ species, count })).sort((a, b) => b.count - a.count),
    health,
    productionByMonth: [...prodMap].map(([k, total]) => ({ month: k.split('|')[0], product: k.split('|')[1], total })).sort((a, b) => a.month.localeCompare(b.month)),
    financeByMonth,
    wasteByMonth: [...group(recentWaste, month, (r) => Number(r.quantityKg ?? 0))].map(([mo, total]) => ({ month: mo, total })).sort((a, b) => a.month.localeCompare(b.month)),
    wasteByType,
    totals: {
      animals: alive.length,
      sick: alive.filter((a) => a.healthStatus !== "Sog'lom").length,
      income: financeByMonth.reduce((s, r) => s + r.income, 0),
      expense: financeByMonth.reduce((s, r) => s + r.expense, 0),
      waste: wasteByType.reduce((s, r) => s + r.total, 0),
      milk30: prod.filter((r) => r.product === 'Sut' && String(r.recordDate) >= day30).reduce((s, r) => s + Number(r.quantity ?? 0), 0),
    },
  };
}
