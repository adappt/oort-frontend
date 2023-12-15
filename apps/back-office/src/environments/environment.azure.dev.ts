import { AuthConfig } from 'angular-oauth2-oidc';
import { theme } from '../themes/default/default.dev';
import { sharedEnvironment } from './environment.shared';
import { Environment } from './environment.type';

/**
 * Authentication configuration
 */
const authConfig: AuthConfig = {
  issuer:
    'https://login.microsoftonline.com/76d22fc8-2330-45cf-ab36-51074cf8f1e2/v2.0',
  redirectUri: 'https://emspocdev.adapptlabs.com/backoffice/',
  postLogoutRedirectUri: 'https://emspocdev.adapptlabs.com/backoffice/auth',
  clientId: 'db40357f-374e-476e-9ce8-5c9b3cbe475a',
  scope: 'openid profile email offline_access',
  responseType: 'code',
  showDebugInformation: true,
  strictDiscoveryDocumentValidation: false,
};

/**
 * Environment file for local development.
 */
export const environment: Environment = {
  ...sharedEnvironment,
  production: true,
  apiUrl: 'https://emspocdev.adapptlabs.com/api',
  subscriptionApiUrl: 'wss://emspocdev.adapptlabs.com/api',
  frontOfficeUri: 'https://emspocdev.adapptlabs.com/',
  backOfficeUri: 'https://emspocdev.adapptlabs.com/backoffice/',
  module: 'backoffice',
  availableLanguages: ['en'],
  authConfig,
  theme,
  availableWidgets: [
    'donut-chart',
    'line-chart',
    'bar-chart',
    'column-chart',
    'pie-chart',
    'polar-chart',
    'radar-chart',
    'grid',
    'text',
    'map',
    'summaryCard',
    'tabs',
  ],
  sentry: {
    environment: 'development',
    dns: 'https://37ca208310369a4cee685fd50e1105ad@o4504696331632640.ingest.sentry.io/4505997745782784',
    tracePropagationTargets: ['emspocdev.adapptlabs.com'],
  },
};
