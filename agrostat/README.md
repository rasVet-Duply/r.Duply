# AgroStat 🌱 — Firebase versiyasi / Firebase-версия

Tayyor loyiha: React + Vite + Tailwind + **Firebase** (Auth, Firestore, Storage, Hosting).
Готовый проект: React + Vite + Tailwind + **Firebase** (Auth, Firestore, Storage, Hosting).

```
agrostat/
├─ src/                 ilova / приложение (sahifalar, komponentlar)
│  └─ backend/          Firebase bilan ishlash (api.ts, auth.tsx, upload.ts, firebase.ts)
├─ firestore.rules      xavfsizlik qoidalari (direktor/xodim huquqlari)
├─ storage.rules        rasmlar uchun qoidalar
├─ firebase.json        hosting sozlamalari
├─ migration/           eski bazadan ko‘chirish skripti
└─ .env.example         Firebase kalitlari namunasi
```

---

## 🇺🇿 O‘zbekcha — qadam-baqadam

### 1. Kerakli dasturlar
- **Node.js 20+** → https://nodejs.org (LTS ni o‘rnating)
- **Git** → https://git-scm.com
- Terminalda tekshiring: `node -v` va `git --version`

### 2. Firebase loyihasi
1. https://console.firebase.google.com → **Add project** → nom bering → yarating.
2. **Build → Authentication → Get started** → **Email/Password** va **Google** ni yoqing.
3. **Build → Firestore Database → Create database** → *Production mode* → hudud: `eur3` yoki yaqinroq.
4. **Build → Storage → Get started** (Blaze tarif so‘rashi mumkin — rasmlar uchun kerak; bepul limit bor).
5. **Project settings (⚙️) → General → Your apps → Web `</>`** → ilova qo‘shing → `firebaseConfig` qiymatlarini ko‘rasiz.

### 3. Loyihani ishga tushirish
```bash
# arxivni oching va papkaga kiring
cd agrostat
cp .env.example .env        # Windows: copy .env.example .env
# .env faylini oching va firebaseConfig qiymatlarini yozing
npm install
npm run dev                 # http://localhost:5173 ochiladi
```

### 4. Qoidalarni va saytni joylash (deploy)
```bash
npm install -g firebase-tools
firebase login
firebase use --add          # loyihangizni tanlang (yoki .firebaserc da ID ni yozing)
firebase deploy --only firestore:rules,storage
npm run deploy              # build + hosting
```
Sayt manzili: `https://<project-id>.web.app`
⚠️ Authentication → Settings → **Authorized domains** ga o‘z domeningizni qo‘shing (agar boshqa domen ishlatsangiz).

### 5. GitHub'ga yuklash
1. https://github.com/new → nom: `agrostat` → **Create repository** (README qo‘shmang).
2. Loyiha papkasida:
```bash
git init
git add .
git commit -m "AgroStat"
git branch -M main
git remote add origin https://github.com/<LOGIN>/agrostat.git
git push -u origin main
```
`.env` GitHub'ga yuklanmaydi (`.gitignore` da) — bu to‘g‘ri, kalitlar maxfiy qoladi.

**Avtomatik deploy (ixtiyoriy):** terminalda `firebase init hosting:github` → GitHub repozitoriyni tanlang → har `push` da sayt yangilanadi. GitHub → Settings → Secrets → `.env` dagi `VITE_FIREBASE_*` qiymatlarini qo‘shing.

### 6. Eski bazani Firebase'ga ko‘chirish
1. Eski AgroStat ilovasida **direktor** sifatida kiring → **Sozlamalar → Hisob → “Ma’lumotlarni yuklab olish (JSON)”** → `agrostat-data.json` fayli tushadi.
2. Firebase Console → ⚙️ **Project settings → Service accounts → Generate new private key** → `serviceAccount.json`.
3. Ikkala faylni `migration/` papkasiga qo‘ying va:
```bash
cd migration
npm install
node import.mjs
```
4. Natija: ferma, hayvonlar, mahsulot, moliya, chiqindilar, xodimlar, maoshlar ko‘chadi. Har bir xodim o‘z emaili bilan **“Parolni unutdingizmi?”** orqali parol o‘rnatadi (yoki Google bilan kiradi).
⚠️ `serviceAccount.json` va `agrostat-data.json` ni hech qachon GitHub'ga yuklamang!

### 7. Huquqlar (firestore.rules da)
- **Direktor**: hammasi — moliya, xodimlar, maosh, taklif kodi.
- **Xodim**: hayvonlar, mahsulot, chiqindilarni kiritadi; jamoani faqat ko‘radi; moliyada faqat **o‘z maoshini** ko‘radi.

---

## 🇷🇺 Русский — пошагово

1. **Установите** Node.js 20+ (https://nodejs.org) и Git (https://git-scm.com).
2. **Firebase:** https://console.firebase.google.com → Add project → включите **Authentication** (Email/Password + Google), **Firestore** (production mode), **Storage** → Project settings → Your apps → Web `</>` → скопируйте `firebaseConfig`.
3. **Запуск:**
   ```bash
   cd agrostat
   cp .env.example .env     # впишите значения firebaseConfig
   npm install
   npm run dev
   ```
4. **Публикация:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only firestore:rules,storage
   npm run deploy
   ```
   Сайт: `https://<project-id>.web.app`
5. **GitHub:** создайте репозиторий на https://github.com/new, затем
   `git init && git add . && git commit -m "AgroStat" && git branch -M main && git remote add origin https://github.com/<LOGIN>/agrostat.git && git push -u origin main`.
   Автодеплой: `firebase init hosting:github`.
6. **Перенос базы:** в старом AgroStat (как директор) → Настройки → «Скачать данные (JSON)» → положите `agrostat-data.json` и `serviceAccount.json` (Firebase → Service accounts → Generate new private key) в папку `migration/` → `cd migration && npm install && node import.mjs`. Сотрудники входят по своему email через «Забыли пароль?» или Google.
   ⚠️ Не загружайте `serviceAccount.json` и `agrostat-data.json` в GitHub.

## ❓ Muammolar / Проблемы
- **Missing or insufficient permissions** → `firebase deploy --only firestore:rules` bajarilmagan.
- **auth/unauthorized-domain** → Authentication → Settings → Authorized domains ga domen qo‘shing.
- **Rasm yuklanmaydi / фото не грузится** → Storage yoqilmagan yoki `storage.rules` deploy qilinmagan.
- Oq ekran → `.env` to‘ldirilmagan; `npm run dev` ni qayta ishga tushiring.
