import { Ionicons } from '@expo/vector-icons';
import React, { type ErrorInfo, type PropsWithChildren } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '../../constants/theme';

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<
  PropsWithChildren,
  State
> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SaveTrack render error:', error, info);
  }

  reset = () => {
    this.setState({
      hasError: false,
    });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.icon}>
            <Ionicons
              name="alert-circle-outline"
              size={30}
              color={Colors.danger}
            />
          </View>

          <Text style={styles.title}>SaveTrack hit a problem</Text>

          <Text style={styles.message}>
            Your saved data was not deleted. Try reopening this screen.
          </Text>

          <Pressable
            accessibilityRole="button"
            style={styles.button}
            onPress={this.reset}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: Colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },
  button: {
    minHeight: 46,
    minWidth: 130,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
});
