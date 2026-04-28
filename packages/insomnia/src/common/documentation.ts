const noDocumentationLink = '';

export const docsBase = noDocumentationLink;
export const docsGitSync = noDocumentationLink;
export const docsTemplateTags = noDocumentationLink;
export const docsVersionControl = noDocumentationLink;
export const docsPlugins = noDocumentationLink;
export const docsImportExport = noDocumentationLink;
export const docsKeyMaps = noDocumentationLink;
export const docsIntroductionIusomnia = noDocumentationLink;
export const docsWorkingWithDesignDocs = noDocumentationLink;
export const docsUnitTesting = noDocumentationLink;
export const docsIntroductionToInsoCLI = noDocumentationLink;
export const docsPreRequestScript = noDocumentationLink;
export const docsAfterResponseScript = noDocumentationLink;
export const docsMcpClient = noDocumentationLink;
export const docsMcpAuthentication = noDocumentationLink;
export const docsPricingLearnMoreLink = noDocumentationLink;

export const docsGitAccessToken = {
  github: 'https://docs.github.com/github/authenticating-to-github/creating-a-personal-access-token',
  gitlab: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html',
  bitbucket: 'https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/',
  bitbucketServer: 'https://confluence.atlassian.com/bitbucketserver/personal-access-tokens-939515499.html',
  azureDevOps:
    'https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate',
};

export const documentationLinks = {
  introductionToIusomnia: {
    title: 'Introduction to Iusomnia',
    url: docsIntroductionIusomnia,
  },
  workingWithDesignDocs: {
    title: 'Working with Design Documents',
    url: docsWorkingWithDesignDocs,
  },
  unitTesting: {
    title: 'Unit Testing',
    url: docsUnitTesting,
  },
  introductionToInsoCLI: {
    title: 'Introduction to Inso CLI',
    url: docsIntroductionToInsoCLI,
  },
  introductionToPreRequestScript: {
    title: 'Pre-request Script Overview',
    url: docsPreRequestScript,
  },
  introductionToAfterResponseScript: {
    title: 'After-Response Script Overview',
    url: docsAfterResponseScript,
  },
} as const;
