export interface Task {
  type: string;
  params: any;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ReactNativeTaskParams {
  platform?: 'ios' | 'android' | 'both';
  buildType?: 'debug' | 'release';
  device?: string;
  version?: string;
  package?: string;
  dev?: boolean;
  reset?: boolean;
  port?: number;
  testType?: 'unit' | 'e2e' | 'ios_e2e' | 'android_e2e';
  update?: boolean;
  enable?: boolean;
}