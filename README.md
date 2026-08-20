<div align="center">

# SaveTrack

### A local-first personal finance and savings companion

Track money, protect savings, plan purchases, and understand what you can safely spend — all from one mobile app.

**React Native · Expo · TypeScript · SQLite · Firebase**

</div>

---

## Overview

**SaveTrack** is a mobile personal finance application designed to do more than record expenses.

Instead of only showing where money went, SaveTrack helps users answer practical questions such as:

- How much money is actually available?
- How much should remain protected as savings?
- Can I afford a purchase right now?
- How will a purchase affect my savings goals?
- What happens if my income or spending changes?
- Am I staying within my monthly budgets?

The app follows a **local-first architecture**. Core financial data is stored on the device using SQLite, while Firebase is used as an optional account and cloud-backup layer.

---

## Highlights

### Income & Expense Tracking

Create, edit, delete, categorize, and review income and expense transactions.

The dashboard automatically calculates the user's current financial position from real transaction data.

### Reserved Savings

Users can move part of their available money into a protected savings pool.

Savings deposits are **not treated as expenses**, and savings withdrawals are **not treated as income**. This keeps financial calculations accurate while still separating spendable and protected money.

### Savings Goals

Create savings goals with:

- target amount
- target date
- priority level
- custom icon or emoji
- contribution history
- progress tracking

Money allocated to goals comes from the existing reserved savings pool rather than creating duplicate balances.

### Savings Planner

Estimate how long it will take to reach a target based on:

- target price
- amount already saved
- weekly savings amount

The planner also compares multiple savings scenarios and can turn a plan into an actual savings goal.

### Safe-to-Spend

SaveTrack calculates how much money can safely be spent after accounting for:

- current balance
- protected savings
- upcoming financial commitments
- next expected income date

Conceptually:

```text
Safe-to-Spend
= Current Balance
- Reserved Savings
- Relevant Upcoming Commitments
```

The app can also calculate a daily Safe-to-Spend allowance until the user's next income.

### Can I Afford It?

Enter a planned purchase and SaveTrack evaluates it against the user's current financial position.

Possible results include:

- Comfortable
- Possible
- Risky
- Not Recommended

The feature also shows how the purchase may affect Safe-to-Spend, daily allowance, and savings-goal progress.

### What-If Simulator

Experiment with hypothetical financial changes without modifying real app data.

Users can simulate:

- additional income
- lower spending
- unexpected expenses
- increased weekly savings
- faster savings-goal progress

### Insights & Analytics

The Insights screen provides local, rule-based financial analysis without requiring a paid AI service.

It includes:

- monthly income and expense trends
- net cash flow
- category spending breakdown
- average monthly expenses
- savings rate
- budget health
- commitment pressure
- savings observations

### Monthly Budgets

Create monthly spending limits by category.

Budget usage is calculated automatically from real expense transactions and classified as:

- Good
- Warning
- Over Budget

### Notifications

SaveTrack supports local reminders for:

- daily money check-ins
- weekly savings
- upcoming commitments
- next income
- budget warnings

Notification preferences remain stored locally on the device.

### Cloud Accounts & Backup

Firebase adds optional:

- email/password accounts
- persistent sign-in
- password reset
- manual cloud backup
- manual restore
- per-user Firestore data isolation

SQLite remains the primary source of local financial data.

### Security & Privacy

SaveTrack includes an additional app-level privacy layer:

- 4-digit app PIN
- salted and hashed PIN verifier
- secure device storage
- automatic app locking
- temporary lockout after repeated incorrect attempts
- optional biometric quick unlock
- hide financial amounts mode
- privacy shield when the app leaves the foreground

---

## Tech Stack

| Technology | Purpose |
| --- | --- |
| React Native | Mobile application UI |
| Expo | Development and native tooling |
| TypeScript | Type-safe application development |
| Expo Router | File-based navigation |
| Expo SQLite | Local financial database |
| Firebase Authentication | Optional user accounts |
| Cloud Firestore | Optional cloud backup |
| AsyncStorage | Firebase authentication persistence |
| Expo Notifications | Local reminders |
| Expo SecureStore | Secure device storage |
| Expo Local Authentication | Biometric authentication |
| Expo Crypto | PIN hashing utilities |
| Expo Haptics | Subtle interaction feedback |

---

## Architecture

```text
                         SaveTrack Mobile App
                                │
                ┌───────────────┴───────────────┐
                │                               │
          Local Application                 Optional Cloud
                │                               │
         Expo + React Native                 Firebase
                │                               │
        ┌───────┴────────┐             ┌────────┴─────────┐
        │                │             │                  │
      SQLite       Secure Device    Authentication      Firestore
    Financial DB      Storage          Accounts          Backup
```

### Local-First Design

SaveTrack is designed so the core app continues to work using the local SQLite database.

Cloud functionality is optional rather than being required for every transaction.

This provides:

- faster local access
- reduced cloud dependency
- simpler offline use
- clearer ownership of financial data
- optional backup rather than mandatory synchronization

---

## Financial Data Model

SaveTrack separates different types of money movement so calculations remain meaningful.

### Transactions

Transactions represent actual financial activity:

```text
Income → increases balance
Expense → decreases balance
```

### Savings

Savings entries represent reserving or releasing existing money:

```text
Savings deposit → protects part of existing balance
Savings withdrawal → makes protected money spendable again
```

They do not count as income or expenses.

### Goal Allocations

Savings goals divide the reserved savings pool into specific purposes.

```text
Reserved Savings
├── Emergency Fund
├── New Laptop
└── Travel
```

Goal allocations do not create additional money.

### Planned Commitments

Commitments represent upcoming obligations such as bills or planned payments.

They affect Safe-to-Spend calculations but do not become actual expenses until recorded as transactions.

---

## Getting Started

### Prerequisites

Install:

- Node.js
- npm
- Git
- Expo Go on a supported mobile device

Clone the repository:

```bash
git clone <your-repository-url>
cd savetrack
```

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

Scan the QR code using Expo Go on your device.

If Metro or Expo has stale cached data:

```bash
npx expo start -c
```

---

## Firebase Setup

Firebase is only required for the optional account and cloud-backup features.

Create a Firebase project and enable:

1. **Authentication**
   - Email/Password

2. **Cloud Firestore**

Create a `.env.local` file in the project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Do not commit `.env.local`.

The repository should contain an `.env.example` showing the required variable names without private values.

---

## Firestore Security Rules

Each signed-in user should only be able to access their own SaveTrack cloud data.

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

---

## Running Quality Checks

TypeScript:

```bash
npx tsc --noEmit
```

Linting:

```bash
npm run lint
```

These checks are recommended before committing major changes.

---

## Project Structure

```text
savetrack/
├── app/
│   ├── (tabs)/
│   ├── transaction/
│   ├── goal/
│   ├── security.tsx
│   ├── cloud.tsx
│   ├── notifications.tsx
│   └── ...
│
├── components/
│   ├── budgets/
│   ├── insights/
│   ├── savings/
│   ├── security/
│   ├── transactions/
│   └── ui/
│
├── contexts/
│   ├── TransactionContext.tsx
│   ├── SavingsContext.tsx
│   ├── GoalContext.tsx
│   ├── SafeSpendContext.tsx
│   ├── BudgetContext.tsx
│   ├── NotificationContext.tsx
│   ├── AuthContext.tsx
│   └── SecurityContext.tsx
│
├── database/
│   └── migrations.ts
│
├── types/
├── utils/
├── assets/
└── package.json
```

---

## Core Screens

SaveTrack currently includes:

```text
Home
Transactions
Add / Edit Transaction
Savings
Savings Goals
Savings Planner
Safe-to-Spend
Can I Afford It?
What-If Simulator
Insights & Analytics
Budgets
Notifications
Account & Cloud Backup
Security & Privacy
```

---

## Screenshots

Add final screenshots of the application here before using the repository in a portfolio.

Recommended screenshots:

```text
assets/screenshots/home.png
assets/screenshots/transactions.png
assets/screenshots/goals.png
assets/screenshots/planner.png
assets/screenshots/insights.png
assets/screenshots/security.png
```

Then they can be displayed in the README with:

```html
<p align="center">
  <img src="assets/screenshots/home.png" width="220" alt="SaveTrack Home">
  <img src="assets/screenshots/goals.png" width="220" alt="SaveTrack Goals">
  <img src="assets/screenshots/insights.png" width="220" alt="SaveTrack Insights">
</p>
```

---

## Sharing the App

SaveTrack does not need to be published on the App Store or Google Play to be presented as a portfolio project.

Recommended presentation options:

- GitHub repository
- screenshots in this README
- short screen-recorded demo
- Expo development demo
- optional downloadable Android APK through GitHub Releases

For iOS portfolio demonstrations, a recorded walkthrough is often the easiest option when the app is not being distributed through the App Store.

---

## Engineering Decisions

### Why SQLite?

Personal finance data is frequently accessed and should remain available without requiring a network connection.

SQLite provides fast local persistence and allows SaveTrack's core functionality to remain independent from cloud services.

### Why Firebase Only for Backup?

SaveTrack intentionally avoids making cloud connectivity mandatory.

Firebase provides optional authentication and backup while SQLite remains the main local database.

### Why Separate Savings from Expenses?

Moving money into savings does not mean the money has been spent.

Treating savings as expenses would distort spending analytics, budget calculations, and cash-flow reports.

### Why Rule-Based Insights?

The application can produce meaningful financial observations without sending sensitive financial data to an external AI service.

This keeps the feature:

- free
- deterministic
- fast
- private
- available offline

---

## Privacy Notes

SaveTrack is designed around personal financial data, so the project intentionally minimizes unnecessary data exposure.

The app:

- stores core financial data locally
- makes cloud backup optional
- isolates cloud backups by authenticated user
- stores the app-lock PIN verifier using secure device storage
- provides financial-value masking
- hides app content when leaving the foreground

For a production financial application, additional professional security review, compliance work, penetration testing, and privacy documentation would still be required.

---

## Development Approach

SaveTrack was developed incrementally, with each major feature implemented and tested as an independent development phase.

The completed roadmap covered:

1. Mobile foundation
2. Expense and income tracking
3. Savings system
4. Savings goals
5. Savings planner
6. Safe-to-Spend
7. Can I Afford It?
8. What-If simulator
9. Insights and analytics
10. Budget system
11. Notifications
12. Cloud accounts and backup
13. Security and privacy
14. UX polish
15. Portfolio-ready finalization

---

## Future Improvements

Possible future additions include:

- recurring transactions
- CSV import/export
- encrypted backup exports
- more advanced financial reports
- custom categories
- multiple wallets/accounts
- shared household budgets
- widgets
- richer accessibility settings
- optional cross-device synchronization

---

## Project Status

**SaveTrack is currently a portfolio and personal-use project.**

The application is not currently distributed through the Apple App Store or Google Play Store.

---

<div align="center">

### SaveTrack

**Track intentionally. Save consistently. Spend confidently.**

</div>
