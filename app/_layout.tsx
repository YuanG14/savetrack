import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';

import { AppLockOverlay } from '../components/security/AppLockOverlay';
import { AppErrorBoundary } from '../components/ui/AppErrorBoundary';
import { AuthProvider } from '../contexts/AuthContext';
import { BudgetProvider } from '../contexts/BudgetContext';
import { GoalProvider } from '../contexts/GoalContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { SafeSpendProvider } from '../contexts/SafeSpendContext';
import { SavingsProvider } from '../contexts/SavingsContext';
import { SecurityProvider } from '../contexts/SecurityContext';
import { ToastProvider } from '../contexts/ToastContext';
import { TransactionProvider } from '../contexts/TransactionContext';
import { migrateDbIfNeeded } from '../database/migrations';

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <SQLiteProvider
            databaseName="savetrack.db"
            onInit={migrateDbIfNeeded}
          >
            <SecurityProvider>
              <TransactionProvider>
                <SavingsProvider>
                  <GoalProvider>
                    <SafeSpendProvider>
                      <BudgetProvider>
                        <NotificationProvider>
                          <StatusBar style="dark" />

                          <Stack
                            screenOptions={{
                              headerShown: false,
                              animation: 'none',
                            }}
                          >
                            <Stack.Screen name="(tabs)" />
                            <Stack.Screen name="add-transaction" />
                            <Stack.Screen name="transaction/[id]" />
                            <Stack.Screen name="savings" />
                            <Stack.Screen name="savings-entry" />
                            <Stack.Screen name="goal-editor" />
                            <Stack.Screen name="goal/[id]" />
                            <Stack.Screen name="safe-to-spend" />
                            <Stack.Screen name="commitment-editor" />
                            <Stack.Screen name="can-i-afford-it" />
                            <Stack.Screen name="what-if" />
                            <Stack.Screen name="budgets" />
                            <Stack.Screen name="budget-editor" />
                            <Stack.Screen name="notifications" />
                            <Stack.Screen name="cloud" />
                            <Stack.Screen name="security" />
                          </Stack>

                          <AppLockOverlay />
                        </NotificationProvider>
                      </BudgetProvider>
                    </SafeSpendProvider>
                  </GoalProvider>
                </SavingsProvider>
              </TransactionProvider>
            </SecurityProvider>
          </SQLiteProvider>
        </ToastProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
