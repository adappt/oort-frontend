import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import {
  StepperActivateEvent,
  StepperComponent,
} from '@progress/kendo-angular-layout';
import { EmailService } from '../../email.service';
import { Router } from '@angular/router';
import { ApplicationService } from '../../../../services/application/application.service';
import { SnackbarService } from '@oort-front/ui';
import { TranslateService } from '@ngx-translate/core';

/**
 * Email template to create distribution list
 */
@Component({
  selector: 'ems-template',
  templateUrl: './ems-template.component.html',
  styleUrls: ['./ems-template.component.scss'],
})
export class EmsTemplateComponent {
  @ViewChild('stepper', { static: true })
  public stepper: StepperComponent | undefined;
  public addEmailnotification = this.emailService.addEmailNotification;

  public currentStep = 0;
  public isLinear = true;
  @Output() navigateToEms: EventEmitter<any> = new EventEmitter();

  private submitted = false;

  public steps: any[];

  public form = new FormGroup({
    accountDetails: new FormGroup({
      userName: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required),
      avatar: new FormControl(null),
    }),
    personalDetails: new FormGroup({
      fullName: new FormControl('', [Validators.required]),
      country: new FormControl('', [Validators.required]),
      gender: new FormControl(null, [Validators.required]),
      about: new FormControl(''),
    }),
    paymentDetails: new FormGroup({
      paymentType: new FormControl(null, Validators.required),
      cardNumber: new FormControl('', Validators.required),
      cvc: new FormControl('', [
        Validators.required,
        Validators.maxLength(3),
        Validators.minLength(3),
      ]),
      expirationDate: new FormControl('', Validators.required),
      cardHolder: new FormControl('', Validators.required),
    }),
  });

  private isStepValid = (index: number): boolean => {
    return this.getGroupAt(index).valid;
  };

  private shouldValidate = (): boolean => {
    return this.submitted === true;
  };

  /**
   * initializing Email Service
   *
   * @param emailService helper functions
   * @param router
   * @param applicationService
   */
  constructor(
    public emailService: EmailService,
    private router: Router,
    public applicationService: ApplicationService,
    private snackBar: SnackbarService,
    private translate: TranslateService
  ) {
    this.steps = [
      {
        label: 'Notification/Alert',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
      {
        label: 'Dataset',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
      {
        label: 'Distribution List',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
      {
        label: 'Schedule Alert',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
      {
        label: 'Layout',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
      {
        label: 'Preview',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
    ];
  }

  /**
   * Getter for the current form group.
   *
   * @returns The current form group.
   */
  public get currentGroup(): FormGroup {
    return this.getGroupAt(this.currentStep);
  }

  /**
   * Moves to the specified step.
   *
   * @param step The step to move to.
   */
  moveTo(step: any) {
    this.currentStep = step;
  }

  /**
   * Increments the current step by one.
   */
  public next(): void {
    if (this.currentStep === 0) {
      if (
        this.emailService.datasetsForm.controls['name'].valid &&
        this.emailService.datasetsForm.controls['notificationType'].valid
      ) {
        this.currentStep += 1;
      } else {
        this.emailService.datasetsForm.controls['name'].markAsTouched();
        this.emailService.datasetsForm.controls[
          'notificationType'
        ].markAsTouched();
      }
    } else {
      if (this.currentStep === 1) {
        this.emailService.datasetSave.emit(true);
      }
      this.currentStep += 1;
    }
  }

  // public preview(): void {
  //   if (this.currentStep === 1) {
  //     this.emailService.datasetSave.emit(true);
  //   }
  // }

  /**
   * Decrements the current step by one.
   */
  public prev(): void {
    this.currentStep -= 1;
  }

  /**
   * Dynamic form submission.
   */
  // public submit(): void {
  //   this.submitted = true;

  //   // if (!this.form.valid) {
  //   //     this.form.markAllAsTouched();
  //   //     //this.stepper.validateSteps();
  //   // }

  //   // console.log('Submitted data', this.form.value);
  // }

  /**
   * Sending emails
   */
  public send(): void {
    const emailData = {
      // Your email data here
    };

    this.emailService
      .sendEmail(this.emailService.configId, emailData)
      .subscribe(
        (response) => {
          console.log('Email sent successfully:', response);
          this.snackBar.openSnackBar(
            this.translate.instant('pages.application.settings.emailSent')
          );
          this.navigateToEms.emit();
        },
        (error) => {
          console.error('Error sending email:', error);
        }
      );
  }

  /**
   * This function returns the form group at the specified index.
   *
   * @param index The index of the form group.
   * @returns {FormGroup} The form group at the specified index.
   */
  private getGroupAt(index: number): FormGroup {
    const groups = Object.keys(this.form.controls).map((groupName) =>
      this.form.get(groupName)
    ) as FormGroup[];

    return groups[index];
  }

  /**
   *
   * submission
   */
  submit() {
    if (Object.keys(this.emailService.datasetsForm.value).length) {
      this.emailService.datasetsForm?.value?.datasets?.forEach((data: any) => {
        delete data.cacheData;
      });
      this.applicationService.application$.subscribe((res: any) => {
        this.emailService.datasetsForm.get('applicationId')?.setValue(res?.id);
      });
      this.emailService
        .addEmailNotification(this.emailService.datasetsForm.value)
        .subscribe((res: any) => {
          console.log(res);
          this.emailService.configId = res.data.addEmailNotification.id;
          console.log(this.emailService.configId);
          //window.location.reload();
          this.snackBar.openSnackBar(
            this.translate.instant('pages.application.settings.emailCreated')
          );
          this.navigateToEms.emit();
        });
    }
  }

  /**
   *
   */
  navigateToListScreen() {
    this.navigateToEms.emit();
  }

  /**
   *
   * @param ev
   */
  public onStepActivate(ev: StepperActivateEvent): void {
    if (ev.index === 4 || ev.index === 5) {
      this.isLinear = false;
    } else {
      this.isLinear = true;
    }
  }
}
