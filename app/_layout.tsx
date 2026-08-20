import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';

import { GoalProvider } from '../contexts/GoalContext';
import { SavingsProvider } from '../contexts/SavingsContext';
import { TransactionProvider } from '../contexts/TransactionContext';
import { migrateDbIfNeeded } from '../database/migrations';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="savetrack.db" onInit={migrateDbIfNeeded}>
      <TransactionProvider>
        <SavingsProvider>
          <GoalProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="add-transaction" />
              <Stack.Screen name="transaction/[id]" />
              <Stack.Screen name="savings" />
              <Stack.Screen name="savings-entry" />
              <Stack.Screen name="goal-editor" />
              <Stack.Screen name="goal/[id]" />
            </Stack>
          </GoalProvider>
        </SavingsProvider>
      </TransactionProvider>
    </SQLiteProvider>
  );
}
