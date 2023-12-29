import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StepperComponent } from '@progress/kendo-angular-layout';

/**
 * Email Notification setup component.
 */
@Component({
  selector: 'app-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss'],
})
export class EmailComponent {
  @ViewChild('stepper', { static: true })
  public stepper: StepperComponent | undefined;

  public currentStep = 1;

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
   * Constructs the EmailComponent and initializes the kendo stepoer.
   */
  constructor() {
    this.steps = [
      {
        label: 'Create Notification/Alert',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
      {
        label: 'Create dataset',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
      {
        label: 'select distribution',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
      {
        label: 'Schedule Alert',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
      {
        label: 'layout',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
      {
        label: 'Preview',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
      {
        label: 'Send',
        isValid: this.isStepValid,
        validate: this.shouldValidate,
      },
    ];
  }

  // public steps = [
  //     { label: "First step" },
  //     { label: "Second step", optional: true },
  //     { label: "Third step" },
  //   ];

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
    this.currentStep += 1;
  }

  /**
   * Decrements the current step by one.
   */
  public prev(): void {
    this.currentStep -= 1;
  }

  /**
   * Dynamic form submission.
   */
  public submit(): void {
    this.submitted = true;

    // if (!this.form.valid) {
    //     this.form.markAllAsTouched();
    //     //this.stepper.validateSteps();
    // }

    // console.log('Submitted data', this.form.value);
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
}
