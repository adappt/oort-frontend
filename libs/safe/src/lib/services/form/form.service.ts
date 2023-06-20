import { Inject, Injectable } from '@angular/core';
import * as SurveyKo from 'survey-knockout';
import * as Survey from 'survey-angular';
import { initCreatorSettings } from '../../survey/creator';
import { CustomQuestions, initCustomSurvey } from '../../survey/init';
import { DomService } from '../dom/dom.service';
import { Dialog } from '@angular/cdk/dialog';
import { Apollo } from 'apollo-angular';
import { UntypedFormBuilder } from '@angular/forms';
import { SafeAuthService } from '../auth/auth.service';
import { SafeReferenceDataService } from '../reference-data/reference-data.service';

/**
 * Shared survey service.
 * Initializes the additional code we made on top of the default logic of the library.
 * Must be initialized at some point in the applications.
 */
@Injectable({ providedIn: 'root' })
export class SafeFormService {
  private environment: any;
  /**
   * Shared survey service.
   * Initializes the additional code we made on top of the default logic of the library.
   * Must be initialized at some point in the applications.
   *
   * @param environment Current environment
   * @param domService Shared DOM service
   * @param dialog Dialog service
   * @param apollo Apollo client
   * @param formBuilder Angular form builder
   * @param authService Shared authentication service
   * @param referenceDataService Reference data service
   */
  constructor(
    @Inject('environment') environment: any,
    public domService: DomService,
    public dialog: Dialog,
    public apollo: Apollo,
    public formBuilder: UntypedFormBuilder,
    public authService: SafeAuthService,
    public referenceDataService: SafeReferenceDataService
  ) {
    this.environment = environment;
    this.setSurveyCreatorInstance();
  }

  /**
   * Set any custom components needed for our survey creator instance
   *
   * @param additionalQuestions Object narrowing the question types that the survey has to have
   * @param additionalQuestions.customQuestions Custom questions to be added to the survey
   */
  setSurveyCreatorInstance(
    additionalQuestions: { customQuestions: CustomQuestions[] } = {
      customQuestions: [
        'resource',
        'resources',
        'owner',
        'users',
        'comment',
        'geospatial',
      ],
    }
  ) {
    // === CUSTOM WIDGETS / COMPONENTS ===
    initCustomSurvey(
      SurveyKo,
      this.domService,
      this.dialog,
      this.apollo,
      this.formBuilder,
      this.authService,
      this.environment,
      this.referenceDataService,
      additionalQuestions.customQuestions
    );
    // === CREATOR SETTINGS ===
    initCreatorSettings(SurveyKo);
    // === CUSTOM WIDGETS / COMPONENTS ===
    initCustomSurvey(
      Survey,
      this.domService,
      this.dialog,
      this.apollo,
      this.formBuilder,
      this.authService,
      this.environment,
      this.referenceDataService,
      additionalQuestions.customQuestions
    );
  }
}
