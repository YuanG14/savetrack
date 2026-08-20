import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

import { GoalForm } from '../components/goals/GoalForm';
import { useGoals } from '../contexts/GoalContext';
import type { GoalInput } from '../types/goal';

export default function GoalEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { goals, createGoal, updateGoal } = useGoals();

  const id = params.id ? Number(params.id) : null;
  const existingGoal =
    id && Number.isFinite(id)
      ? goals.find((goal) => goal.id === id)
      : undefined;

  const handleSubmit = async (input: GoalInput) => {
    try {
      if (existingGoal) {
        await updateGoal(existingGoal.id, input);
      } else {
        await createGoal(input);
      }

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Could not save goal',
        'Something went wrong while saving. Please try again.'
      );
      throw error;
    }
  };

  return (
    <GoalForm
      title={existingGoal ? 'Edit goal' : 'Create goal'}
      subtitle={
        existingGoal
          ? 'Update the target and details.'
          : 'Turn your savings into something meaningful.'
      }
      submitLabel={existingGoal ? 'Save changes' : 'Create goal'}
      initialValue={existingGoal}
      onSubmit={handleSubmit}
    />
  );
}
