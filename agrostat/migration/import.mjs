// AgroStat → Firebase import
// 1) Put serviceAccount.json (Firebase Console → Project settings → Service accounts → Generate new private key) in this folder
// 2) Put agrostat-data.json (AgroStat → Sozlamalar → "Ma'lumotlarni yuklab olish") in this folder
// 3) cd migration && npm install && node import.mjs
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync('./serviceAccount.json', 'utf8'))) });
const db = admin.firestore();
const authAdmin = admin.auth();
const data = JSON.parse(readFileSync('./agrostat-data.json', 'utf8'));
const d10 = (v) => (v ? String(v).slice(0, 10) : '');
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(k)));

async function userFor(email) {
  try { return await authAdmin.getUserByEmail(email); }
  catch { return await authAdmin.createUser({ email }); } // user sets a password with "Forgot password?"
}

const farmId = data.farm.id;
const director = data.members.find((m) => m.role === 'Direktor');
if (!director?.email) throw new Error('Director email not found in export');

const uidByMember = {};
for (const m of data.members) {
  if (!m.email) { console.warn('skip member without email', m.displayName); continue; }
  uidByMember[m.id] = (await userFor(m.email)).uid;
}

const code = data.farm.inviteCode || Math.random().toString(36).slice(2, 12).toUpperCase();
await db.doc(`farms/${farmId}`).set({ farmName: data.farm.farmName, region: data.farm.region, ownerUid: uidByMember[director.id] });
await db.doc(`farmSecrets/${farmId}`).set({ inviteCode: code });
await db.doc(`invites/${code}`).set({ farmId });

for (const m of data.members) {
  const uid = uidByMember[m.id];
  if (!uid) continue;
  await db.doc(`members/${uid}`).set({
    farmId, role: m.role, displayName: m.displayName, email: m.email, position: m.position || '', phone: m.phone || '',
    hireDate: d10(m.hireDate), joinedAt: new Date().toISOString().slice(0, 10), ...(m.role === 'Xodim' ? { inviteCode: code } : {}),
  });
  if (m.monthlySalary != null) await db.doc(`salaries/${uid}`).set({ farmId, monthlySalary: Number(m.monthlySalary) });
}

const dateKeys = ['birthDate', 'arrivalDate', 'deathDate', 'recordDate'];
for (const col of ['animals', 'production', 'finance', 'waste']) {
  for (const r of data[col] ?? []) {
    const rec = clean(r);
    for (const k of dateKeys) if (k in rec) rec[k] = d10(rec[k]) || null;
    await db.doc(`${col}/${r.id}`).set({ ...rec, farmId });
  }
  console.log(col, (data[col] ?? []).length);
}
for (const p of data.salaryPayments ?? []) {
  const uid = uidByMember[p.memberId];
  if (!uid) continue;
  await db.doc(`salaryPayments/${p.id}`).set({ farmId, memberId: uid, paymentDate: d10(p.paymentDate), amount: Number(p.amount), note: p.note || '' });
}
console.log('✅ Done. Users sign in with their email via "Forgot password?" to set a password (or Google).');
