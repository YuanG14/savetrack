# SaveTrack Phase 2 — Transactions

This ZIP is designed to be pasted into the existing SaveTrack Expo project from Phase 1.

## 1. Create the feature branch

Run from the SaveTrack project root:

```bash
git checkout -b feature/transactions
```

If that branch already exists, use:

```bash
git checkout feature/transactions
```

## 2. Install SQLite

```bash
npx expo install expo-sqlite
```

Use `npx expo install`, not a manually chosen npm version, so Expo installs the version compatible with your SDK.

## 3. Copy the ZIP contents

Extract this ZIP, then copy these folders/files into the ROOT of the existing `savetrack` project:

- `app/`
- `components/`
- `constants/`
- `contexts/`
- `database/`
- `types/`
- `utils/`

When Windows asks whether to replace existing files, choose **Replace**.

Do NOT delete or replace:

- `node_modules/`
- `package.json`
- `package-lock.json`
- `app.json`
- `.git/`

The `npx expo install expo-sqlite` command will update `package.json` and `package-lock.json` for you.

## 4. Restart Expo

After copying the files:

```bash
npx expo start -c
```

Scan the QR code and reopen SaveTrack in Expo Go.

## 5. Test Phase 2

Test all of these:

1. Tap the + button.
2. Add an expense, for example:
   - Expense
   - ₱150
   - Food
   - Lunch
3. Confirm it appears on Home and Transactions.
4. Add income, for example:
   - Income
   - ₱1,800
   - Allowance
5. Confirm the balance updates.
6. Filter Transactions by Expense and Income.
7. Tap a transaction and edit it.
8. Delete a transaction.
9. Close Expo Go completely and reopen the app.
10. Confirm your transactions are still there.

## 6. Check TypeScript / lint

```bash
npx tsc --noEmit
npm run lint
```

If either reports an error, do not commit yet.

## 7. Commit Phase 2

When everything works:

```bash
git add .
git commit -m "feat: add persistent transaction tracking"
```

Do not merge into `main` until you have tested add, edit, delete, filters, dashboard calculations, and persistence.

## What Phase 2 implements

- Expo SQLite local database
- Persistent transactions
- Add expense
- Add income
- Edit transaction
- Delete transaction
- Transaction categories
- Description/notes
- Transaction date
- All / Expense / Income filters
- Pull-to-refresh
- Real dashboard balance
- Real monthly income
- Real monthly spending
- Recent transactions
- Lightweight insights preview
- Amount inputs that can be fully cleared and retyped normally

## Database design note

Money is stored as integer centavos (`amount_cents`) rather than floating-point values. This avoids common floating-point rounding problems when storing financial values.
