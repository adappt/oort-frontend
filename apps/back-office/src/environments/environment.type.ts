import { AuthConfig } from 'angular-oauth2-oidc';

/**
 * Interface for User environment configuration.
 */
interface UserConfiguration {
  attributes?: string[];
}

/**
 * Interface of Angular environment configuration.
 */
export interface Environment {
  module: string;
  version: any;
  production: boolean;
  apiUrl: string;
  subscriptionApiUrl: string;
  frontOfficeUri: string;
  backOfficeUri: string;
  availableLanguages: string[];
  authConfig: AuthConfig;
  esriApiKey: string;
  theme: any;
  availableWidgets: string[];
  sentry?: any;
  user?: UserConfiguration;
}
