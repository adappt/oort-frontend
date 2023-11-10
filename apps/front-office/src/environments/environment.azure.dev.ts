import { AuthConfig } from 'angular-oauth2-oidc';
import { theme } from '../themes/default/default.dev';
import { sharedEnvironment } from './environment.shared';
import { Environment } from './environment.type';

/** Authentication configuration of the module. */
const authConfig: AuthConfig = {
  issuer:
    'https://login.microsoftonline.com/76d22fc8-2330-45cf-ab36-51074cf8f1e2/v2.0',
  redirectUri: 'https://emspoc.adapptlabs.com/',
  postLogoutRedirectUri: 'https://emspoc.adapptlabs.com/auth',
  clientId: 'db40357f-374e-476e-9ce8-5c9b3cbe475a',
  scope: 'openid profile email offline_access',
  responseType: 'code',
  showDebugInformation: true,
  strictDiscoveryDocumentValidation: false,
};

/** Environment configuration */
export const environment: Environment = {
  ...sharedEnvironment,
  production: true,
  apiUrl: 'https://emspocdev.adapptlabs.com/api',
  subscriptionApiUrl: 'wss://emspocdev.adapptlabs.com/api',
  frontOfficeUri: 'https://emspoc.adapptlabs.com/',
  backOfficeUri: 'https://emspoc.adapptlabs.com/backoffice/',
  availableLanguages: ['en'],
  authConfig,
  theme,
};
