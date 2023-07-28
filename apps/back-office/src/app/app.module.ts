import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Http
import {
  HttpClient,
  HttpClientModule,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';

// Env
import { environment } from '../environments/environment';

// Config
import { DialogModule as DialogCdkModule } from '@angular/cdk/dialog';

// TRANSLATOR
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { OAuthModule, OAuthService, OAuthStorage } from 'angular-oauth2-oidc';
import { MessageService } from '@progress/kendo-angular-l10n';
import {
  KendoTranslationService,
  SafeAuthInterceptorService,
  AppAbility,
} from '@oort-front/safe';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeEn from '@angular/common/locales/en';

/** CASL */
import { PureAbility } from '@casl/ability';

// Register local translations for dates
registerLocaleData(localeFr);
registerLocaleData(localeEn);

import { PopupService } from '@progress/kendo-angular-popup';
import { ResizeBatchService } from '@progress/kendo-angular-common';
import { IconsService } from '@progress/kendo-angular-icons';
// import { touchEnabled } from '@progress/kendo-common';
// Apollo / GraphQL
import { GraphQLModule } from './graphql.module';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';

// Code editor component for Angular applications
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

// Fullscreen
import {
  OverlayContainer,
  FullscreenOverlayContainer,
} from '@angular/cdk/overlay';

// Sentry
import { Router } from '@angular/router';
import * as Sentry from '@sentry/angular-ivy';
import { DropdownMultiSelectListModel as AngularDropdownMultiSelectListModel } from 'survey-angular';
import { DropdownMultiSelectListModel as KnockoutDropdownMultiSelectListModel } from 'survey-knockout';

/**
 * Initialize authentication in the platform.
 * Configuration in environment file.
 * Use oAuth
 *
 * @param oauth OAuth Service
 * @returns oAuth configuration
 */
const initializeAuth =
  (oauth: OAuthService): any =>
  () => {
    oauth.configure(environment.authConfig);
  };

/**
 * Sets up translator.
 *
 * @param http http client
 * @returns Translator.
 */
export const httpTranslateLoader = (http: HttpClient) =>
  new TranslateHttpLoader(http);

class OverrideAngularDropdownMultiSelectListModel extends AngularDropdownMultiSelectListModel {
  private syncFilterStringPlaceHolder() {
    console.log('I am ici');
    this.filterStringPlaceholder = this.question.placeholder;
  }
}

class OverrideKnockoutDropdownMultiSelectListModel extends KnockoutDropdownMultiSelectListModel {
  private syncFilterStringPlaceHolder() {
    console.log('I am ici');
    this.filterStringPlaceholder = this.question.placeholder;
  }
}

/**
 * Main module of Back-Office project.
 */
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    DialogCdkModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpTranslateLoader,
        deps: [HttpClient],
      },
    }),
    OAuthModule.forRoot(),
    GraphQLModule,
    DateInputsModule,
    MonacoEditorModule.forRoot(),
  ],
  providers: [
    {
      provide: 'environment',
      useValue: environment,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true,
      deps: [OAuthService],
    },
    {
      provide: MessageService,
      useClass: KendoTranslationService,
    },
    {
      provide: OAuthStorage,
      useValue: localStorage,
    },
    // TODO: check
    // {
    //   provide: TOUCH_ENABLED,
    //   useValue: [touchEnabled],
    // },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SafeAuthInterceptorService,
      multi: true,
    },
    {
      provide: AppAbility,
      useValue: new AppAbility(),
    },
    {
      provide: PureAbility,
      useExisting: AppAbility,
    },
    PopupService,
    ResizeBatchService,
    IconsService,
    { provide: OverlayContainer, useClass: FullscreenOverlayContainer },
    {
      provide: AngularDropdownMultiSelectListModel,
      useClass: OverrideAngularDropdownMultiSelectListModel,
    },
    {
      provide: KnockoutDropdownMultiSelectListModel,
      useClass: OverrideKnockoutDropdownMultiSelectListModel,
    },
    // Sentry
    ...(environment.sentry
      ? [
          {
            provide: ErrorHandler,
            useValue: Sentry.createErrorHandler({
              showDialog: true,
            }),
          },
          {
            provide: Sentry.TraceService,
            deps: [Router],
          },
          {
            provide: APP_INITIALIZER,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            useFactory: () => () => {},
            deps: [Sentry.TraceService],
            multi: true,
          },
        ]
      : []),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
