import { AuthConfig } from 'angular-oauth2-oidc';
import { theme } from '../themes/oort/oort.prod';

/** Authentication configuration of the module. */
const authConfig: AuthConfig = {
  issuer: 'https://id.oortcloud.tech/auth/realms/oort-demo',
  redirectUri: 'https://d3rv4m9pcr8lg2.cloudfront.net/',
  postLogoutRedirectUri: 'https://d3rv4m9pcr8lg2.cloudfront.net/auth/',
  clientId: 'oort-client',
  scope: 'openid profile email offline_access',
  responseType: 'code',
  showDebugInformation: true,
};

/** Environment configuration */
export const environment = {
  production: true,
  apiUrl: 'https://demo.oortcloud.tech/api',
  subscriptionApiUrl: 'wss://demo.oortcloud.tech/api',
  frontOfficeUri: 'https://d3rv4m9pcr8lg2.cloudfront.net',
  backOfficeUri: 'https://d3rv4m9pcr8lg2.cloudfront.net/admin/',
  module: 'frontoffice',
  availableLanguages: ['en', 'fr'],
  authConfig,
  esriApiKey:
    'AAPKf2bae9b3f32943e2a8d58b0b96ffea3fj8Vt8JYDt1omhzN_lONXPRHN8B89umU-pA9t7ze1rfCIiiEVXizYEiFRFiVrl6wg',
  theme,
};
