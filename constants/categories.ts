import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { TransactionType } from '../types/transaction';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type TransactionCategory = {
  name: string;
  icon: IoniconName;
  types: TransactionType[];
};

export const transactionCategories: TransactionCategory[] = [
  { name: 'Food', icon: 'fast-food-outline', types: ['expense'] },
  { name: 'Transport', icon: 'car-outline', types: ['expense'] },
  { name: 'Shopping', icon: 'bag-outline', types: ['expense'] },
  { name: 'School', icon: 'school-outline', types: ['expense'] },
  { name: 'Bills', icon: 'document-text-outline', types: ['expense'] },
  { name: 'Entertainment', icon: 'game-controller-outline', types: ['expense'] },
  { name: 'Health', icon: 'medkit-outline', types: ['expense'] },
  { name: 'Other', icon: 'ellipsis-horizontal-outline', types: ['expense', 'income'] },
  { name: 'Allowance', icon: 'wallet-outline', types: ['income'] },
  { name: 'Salary', icon: 'briefcase-outline', types: ['income'] },
  { name: 'Freelance', icon: 'laptop-outline', types: ['income'] },
  { name: 'Gift', icon: 'gift-outline', types: ['income'] },
  { name: 'Refund', icon: 'return-down-back-outline', types: ['income'] },
];

export function getCategory(name: string) {
  return transactionCategories.find((item) => item.name === name);
}
