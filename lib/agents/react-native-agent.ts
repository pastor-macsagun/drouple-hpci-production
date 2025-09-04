import { Task, AgentResponse, ReactNativeTaskParams } from '../types/agent-types';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';

export interface ReactNativeAgentConfig {
  projectPath: string;
  platform: 'ios' | 'android' | 'both';
  buildType: 'debug' | 'release';
  deviceTarget?: string;
  bundleId?: string;
  keystorePath?: string;
}

export class ReactNativeAgent {
  private config: ReactNativeAgentConfig;

  constructor(config: ReactNativeAgentConfig) {
    this.config = config;
  }

  // Public method to execute a command directly
  async runCommand(command: string): Promise<AgentResponse> {
    try {
      const output = await this.executeCommand(command);
      return {
        success: true,
        data: { command, output }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command execution failed'
      };
    }
  }

  async executeTask(task: Task): Promise<AgentResponse> {
    try {
      switch (task.type) {
        case 'setup':
          return await this.setupProject(task.params);
        case 'build':
          return await this.buildProject(task.params);
        case 'run':
          return await this.runProject(task.params);
        case 'test':
          return await this.runTests(task.params);
        case 'bundle':
          return await this.bundleProject(task.params);
        case 'release':
          return await this.createRelease(task.params);
        case 'debug':
          return await this.startDebugger(task.params);
        case 'metro':
          return await this.startMetro(task.params);
        case 'install':
          return await this.installDependencies(task.params);
        case 'link':
          return await this.linkNativeModules(task.params);
        case 'pod-install':
          return await this.installPods(task.params);
        case 'clean':
          return await this.cleanProject(task.params);
        case 'doctor':
          return await this.runDoctor();
        case 'upgrade':
          return await this.upgradeProject(task.params);
        case 'codegen':
          return await this.generateCode(task.params);
        case 'flipper':
          return await this.configureFlipperDebugger(task.params);
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async setupProject(params: ReactNativeTaskParams): Promise<AgentResponse> {
    try {
      const { projectName } = params as any;
      if (!projectName) {
        return { success: false, error: 'Project name is required for setup' };
      }

      // Check if React Native CLI is installed
      try {
        execSync('npx react-native --version', { stdio: 'pipe' });
      } catch {
        return { success: false, error: 'React Native CLI not found. Install with: npm install -g @react-native-community/cli' };
      }

      const commands = [
        `npx react-native init ${projectName}`,
        `cd ${projectName}/ios && pod install`,
        `cd ${projectName} && npx react-native doctor`
      ];

      return {
        success: true,
        data: {
          message: `React Native project "${projectName}" setup commands ready`,
          commands,
          projectPath: path.resolve(projectName),
          nextSteps: [
            `cd ${projectName}`,
            'Run the commands above in sequence',
            'Start Metro bundler with: npm start'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Setup failed'
      };
    }
  }

  private async buildProject(params: ReactNativeTaskParams): Promise<AgentResponse> {
    try {
      const { platform = this.config.platform, buildType = this.config.buildType } = params;

      // Check if we're in a React Native project
      if (!existsSync(path.join(this.config.projectPath, 'package.json'))) {
        return { success: false, error: 'Not in a React Native project directory' };
      }

      const buildCommands = {
        ios: {
          debug: 'npx react-native run-ios --scheme Debug',
          release: 'npx react-native run-ios --scheme Release'
        },
        android: {
          debug: 'npx react-native run-android --variant debug', 
          release: 'npx react-native run-android --variant release'
        }
      };

      const command = platform === 'both' 
        ? [buildCommands.ios[buildType], buildCommands.android[buildType]]
        : buildCommands[platform][buildType];

      return {
        success: true,
        data: {
          command,
          platform,
          buildType,
          workingDirectory: this.config.projectPath,
          prerequisites: this.getBuildPrerequisites(platform)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Build preparation failed'
      };
    }
  }

  private getBuildPrerequisites(platform: string): string[] {
    const common = ['Metro bundler will be started automatically'];
    
    if (platform === 'ios' || platform === 'both') {
      common.push('Xcode and iOS Simulator installed');
    }
    
    if (platform === 'android' || platform === 'both') {
      common.push('Android SDK and emulator configured');
    }
    
    return common;
  }

  private async executeCommand(command: string, options?: { cwd?: string }): Promise<string> {
    try {
      const result = execSync(command, {
        cwd: options?.cwd || this.config.projectPath,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return result.toString();
    } catch (error) {
      throw new Error(`Command failed: ${command}\n${error}`);
    }
  }

  private validateProject(): { valid: boolean; error?: string } {
    const packageJsonPath = path.join(this.config.projectPath, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      return { valid: false, error: 'Not in a React Native project directory (no package.json found)' };
    }

    try {
      const packageJson = require(packageJsonPath);
      if (!packageJson.dependencies?.['react-native']) {
        return { valid: false, error: 'Not a React Native project (react-native not found in dependencies)' };
      }
    } catch {
      return { valid: false, error: 'Invalid package.json file' };
    }

    return { valid: true };
  }

  private async runProject(params: ReactNativeTaskParams): Promise<AgentResponse> {
    try {
      const { platform = this.config.platform, device } = params;
      
      // Check if we're in a React Native project
      if (!existsSync(path.join(this.config.projectPath, 'package.json'))) {
        return { success: false, error: 'Not in a React Native project directory' };
      }

      const runCommands = {
        ios: device 
          ? `npx react-native run-ios --device "${device}"`
          : 'npx react-native run-ios --simulator "iPhone 15"',
        android: device
          ? `npx react-native run-android --deviceId ${device}`
          : 'npx react-native run-android'
      };

      const command = platform === 'both' 
        ? [runCommands.ios, runCommands.android]
        : runCommands[platform];

      return {
        success: true,
        data: {
          command,
          platform,
          device,
          workingDirectory: this.config.projectPath,
          prerequisites: [
            'Metro bundler should be running',
            'iOS Simulator or Android Emulator should be running',
            'For physical devices, ensure USB debugging is enabled'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Run preparation failed'
      };
    }
  }

  private async runTests(params: ReactNativeTaskParams): Promise<AgentResponse> {
    try {
      const { testType = 'unit', platform } = params;
      
      const testCommands = {
        unit: 'npm test',
        e2e: 'npx detox test',
        ios_e2e: 'npx detox test --configuration ios',
        android_e2e: 'npx detox test --configuration android'
      };

      const command = testCommands[testType] || testCommands.unit;

      return {
        success: true,
        data: {
          command,
          testType,
          platform,
          workingDirectory: this.config.projectPath,
          requirements: testType.includes('e2e') ? [
            'Detox installed and configured',
            'Build app for testing first',
            'Simulator/Emulator running'
          ] : ['Jest testing framework configured']
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Test preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async bundleProject(params: ReactNativeTaskParams): Promise<AgentResponse> {
    try {
      const { platform = this.config.platform, dev = false } = params;
      
      const validation = this.validateProject();
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const bundleCommands = {
        ios: `npx react-native bundle --platform ios --entry-file index.js --bundle-output ./ios/bundle.js --dev ${dev}`,
        android: `npx react-native bundle --platform android --entry-file index.js --bundle-output ./android/app/src/main/assets/bundle.js --dev ${dev}`
      };

      const command = platform === 'both' 
        ? [bundleCommands.ios, bundleCommands.android]
        : bundleCommands[platform];

      return {
        success: true,
        data: {
          command,
          platform,
          dev,
          workingDirectory: this.config.projectPath,
          outputPath: platform === 'ios' 
            ? './ios/bundle.js' 
            : platform === 'android' 
            ? './android/app/src/main/assets/bundle.js'
            : 'Multiple platforms'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Bundle preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async createRelease(params: any) {
    const { platform = this.config.platform } = params;
    
    const releaseSteps = {
      ios: [
        'Open Xcode project',
        'Select "Any iOS Device" as target',
        'Product → Archive',
        'Distribute App → App Store Connect'
      ],
      android: [
        'cd android',
        './gradlew assembleRelease',
        'Find APK in android/app/build/outputs/apk/release/',
        'Upload to Google Play Console'
      ]
    };

    return {
      success: true,
      data: {
        steps: platform === 'both' 
          ? { ios: releaseSteps.ios, android: releaseSteps.android }
          : releaseSteps[platform],
        prerequisites: [
          'Code signing certificates configured (iOS)',
          'Keystore configured (Android)',
          'App Store Connect / Play Console access'
        ]
      }
    };
  }

  private async startDebugger(params: any) {
    return {
      success: true,
      data: {
        debugOptions: [
          'React DevTools: npx react-devtools',
          'Flipper: Open Flipper app',
          'Chrome DevTools: Shake device → Debug',
          'VS Code: React Native Tools extension'
        ],
        ports: {
          metro: 8081,
          devtools: 8097,
          flipper: 9090
        }
      }
    };
  }

  private async startMetro(params: ReactNativeTaskParams): Promise<AgentResponse> {
    try {
      const { reset = false, port = 8081 } = params;
      
      const command = reset 
        ? `npx react-native start --reset-cache --port ${port}`
        : `npx react-native start --port ${port}`;

      return {
        success: true,
        data: {
          command,
          port,
          resetCache: reset,
          note: 'Metro bundler will run in foreground. Use Ctrl+C to stop.',
          workingDirectory: this.config.projectPath
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Metro start failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async installDependencies(params: ReactNativeTaskParams): Promise<AgentResponse> {
    try {
      const { package: packageName, dev = false } = params as any;
      
      const command = packageName 
        ? `npm install ${packageName}${dev ? ' --save-dev' : ''}`
        : 'npm install';

      const output = await this.executeCommand(command);

      // Auto-run pod install for iOS if package was installed
      let podOutput = '';
      if (packageName && existsSync(path.join(this.config.projectPath, 'ios'))) {
        try {
          podOutput = await this.executeCommand('pod install', { 
            cwd: path.join(this.config.projectPath, 'ios') 
          });
        } catch (podError) {
          console.warn('Pod install failed:', podError);
        }
      }

      return {
        success: true,
        data: {
          command,
          output,
          podOutput: podOutput || 'Skipped (no iOS directory or no package specified)',
          postInstall: [
            'Dependencies installed successfully',
            podOutput ? 'iOS pods updated' : 'No iOS pod updates needed',
            'Restart Metro bundler if running'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Package installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async linkNativeModules(params: any) {
    return {
      success: true,
      data: {
        command: 'npx react-native link',
        note: 'Auto-linking is default in RN 0.60+',
        manualSteps: [
          'iOS: Add to Podfile and run pod install',
          'Android: Add to settings.gradle and MainApplication.java',
          'Configure permissions in Info.plist/AndroidManifest.xml'
        ]
      }
    };
  }

  private async installPods(params: any) {
    const { update = false } = params;
    
    return {
      success: true,
      data: {
        command: update ? 'cd ios && pod install --repo-update' : 'cd ios && pod install',
        troubleshooting: [
          'pod deintegrate && pod install (if issues)',
          'rm -rf Pods && pod install (clean install)',
          'pod repo update (update CocoaPods specs)'
        ]
      }
    };
  }

  private async cleanProject(params: any) {
    const { platform = 'both' } = params;
    
    const cleanCommands = {
      ios: [
        'cd ios && xcodebuild clean',
        'rm -rf ~/Library/Developer/Xcode/DerivedData',
        'rm -rf ios/build'
      ],
      android: [
        'cd android && ./gradlew clean',
        'rm -rf android/build',
        'rm -rf android/app/build'
      ],
      metro: [
        'npx react-native start --reset-cache',
        'rm -rf node_modules && npm install',
        'watchman watch-del-all'
      ]
    };

    return {
      success: true,
      data: {
        commands: platform === 'both' 
          ? [...cleanCommands.ios, ...cleanCommands.android, ...cleanCommands.metro]
          : [...cleanCommands[platform], ...cleanCommands.metro]
      }
    };
  }

  private async runDoctor(): Promise<AgentResponse> {
    try {
      const output = await this.executeCommand('npx react-native doctor');
      
      return {
        success: true,
        data: {
          command: 'npx react-native doctor',
          output,
          checks: [
            'Node.js version compatibility',
            'npm/yarn installation',
            'Android SDK and tools',
            'iOS development environment',
            'Watchman installation',
            'CocoaPods installation'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Doctor check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async upgradeProject(params: any) {
    const { version } = params;
    
    return {
      success: true,
      data: {
        command: version 
          ? `npx react-native upgrade ${version}`
          : 'npx react-native upgrade',
        steps: [
          'Create backup of current project',
          'Run upgrade command',
          'Resolve merge conflicts manually',
          'Test thoroughly before committing'
        ],
        alternative: 'Use React Native Upgrade Helper: https://react-native-community.github.io/upgrade-helper/'
      }
    };
  }

  private async generateCode(params: any) {
    return {
      success: true,
      data: {
        command: 'npx react-native codegen',
        description: 'Generate native code from Flow/TypeScript specs',
        requirements: [
          'New Architecture (Fabric/TurboModules) enabled',
          'Properly configured codegen in package.json'
        ]
      }
    };
  }

  private async configureFlipperDebugger(params: any) {
    const { enable = true } = params;
    
    return {
      success: true,
      data: {
        enabled: enable,
        setup: [
          'Download Flipper from https://fbflipper.com/',
          'Install flipper-react-native: npm install --save-dev react-native-flipper',
          'Configure in React Native app initialization',
          'Rebuild app to enable Flipper integration'
        ],
        features: [
          'Layout Inspector',
          'Network Inspector', 
          'Logs Viewer',
          'React DevTools',
          'Performance Monitor'
        ]
      }
    };
  }
}

export default ReactNativeAgent;