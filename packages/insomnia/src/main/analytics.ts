export function setCurrentOrganizationId(id: string | undefined): void {
  void id;
}

export enum SegmentEvent {
  appStarted = 'App Started',
  collectionCreate = 'Collection Created',
  dataExport = 'Data Exported',
  dataImport = 'Data Imported',
  loginSuccess = 'Login Success',
  documentCreate = 'Document Created',
  kongConnected = 'Iusomnia Connected',
  kongSync = 'Iusomnia Synced',
  requestBodyTypeSelect = 'Request Body Type Selected',
  requestCreated = 'Request Created',
  requestExecuted = 'Request Executed',
  collectionRunExecute = 'Collection Run Executed',
  projectLocalCreate = 'Local Project Created',
  projectLocalDelete = 'Local Project Deleted',
  testSuiteCreate = 'Test Suite Created',
  testSuiteDelete = 'Test Suite Deleted',
  unitTestCreate = 'Unit Test Created',
  unitTestDelete = 'Unit Test Deleted',
  unitTestRun = 'Ran Individual Unit Test',
  unitTestRunAll = 'Ran All Unit Tests',
  vcsSyncStart = 'VCS Sync Started',
  vcsSyncComplete = 'VCS Sync Completed',
  vcsAction = 'VCS Action Executed',
  gitAuthenticationCompleted = 'Git Authentication Completed',
  gitAuthenticationUpdated = 'Git Authentication Updated',
  buttonClick = 'Button Clicked',
  aiFeatureEnabled = 'AI Feature Enabled',
  aiFeatureDisabled = 'AI Feature Disabled',
  mcpClientConnected = 'MCP Client Connected',
  mcpClientDisconnected = 'MCP Client Disconnected',
  mcpToolCalled = 'MCP Tool Called',
  mcpResourceRead = 'MCP Resource Read',
  mcpPromptCalled = 'MCP Prompt Called',
  installPlugin = 'Plugin Installed',
}

export async function trackSegmentEvent(event: SegmentEvent, properties?: Record<string, any>) {
  void event;
  void properties;
}

export async function trackPageView(name: string) {
  void name;
}
