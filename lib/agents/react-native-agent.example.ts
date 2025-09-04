/**
 * Example usage of React Native Agent
 */

import { ReactNativeAgent } from './react-native-agent';
import { Task } from '../types/agent-types';

// Example usage
async function main() {
  // Configure the agent
  const agent = new ReactNativeAgent({
    projectPath: '/path/to/your/react-native-project',
    platform: 'both',
    buildType: 'debug'
  });

  // Example 1: Run React Native doctor
  const doctorTask: Task = {
    type: 'doctor',
    params: {}
  };

  const doctorResult = await agent.executeTask(doctorTask);
  console.log('Doctor check:', doctorResult);

  // Example 2: Install a package
  const installTask: Task = {
    type: 'install',
    params: {
      package: 'react-native-vector-icons',
      dev: false
    }
  };

  const installResult = await agent.executeTask(installTask);
  console.log('Package installation:', installResult);

  // Example 3: Start Metro bundler
  const metroTask: Task = {
    type: 'metro',
    params: {
      reset: true,
      port: 8081
    }
  };

  const metroResult = await agent.executeTask(metroTask);
  console.log('Metro bundler:', metroResult);

  // Example 4: Build project
  const buildTask: Task = {
    type: 'build',
    params: {
      platform: 'ios',
      buildType: 'debug'
    }
  };

  const buildResult = await agent.executeTask(buildTask);
  console.log('Build result:', buildResult);

  // Example 5: Run tests
  const testTask: Task = {
    type: 'test',
    params: {
      testType: 'unit'
    }
  };

  const testResult = await agent.executeTask(testTask);
  console.log('Test result:', testResult);

  // Example 6: Direct command execution
  const commandResult = await agent.runCommand('npm --version');
  console.log('Command result:', commandResult);
}

// Usage patterns for different scenarios
export const commonTasks = {
  // Quick project setup
  setupNewProject: (projectName: string): Task => ({
    type: 'setup',
    params: { projectName }
  }),

  // Development workflow
  startDevelopment: (): Task[] => [
    { type: 'install', params: {} },
    { type: 'metro', params: { reset: true } },
    { type: 'run', params: { platform: 'ios' } }
  ],

  // Release preparation
  prepareRelease: (platform: 'ios' | 'android'): Task[] => [
    { type: 'clean', params: { platform } },
    { type: 'test', params: { testType: 'unit' } },
    { type: 'bundle', params: { platform, dev: false } },
    { type: 'release', params: { platform } }
  ],

  // Debug workflow
  debugApp: (): Task[] => [
    { type: 'doctor', params: {} },
    { type: 'clean', params: { platform: 'both' } },
    { type: 'metro', params: { reset: true } },
    { type: 'debug', params: {} }
  ]
};

// Don't run in production
if (require.main === module) {
  main().catch(console.error);
}