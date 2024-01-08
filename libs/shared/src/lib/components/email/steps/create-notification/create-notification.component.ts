import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { EmailService } from '../../email.service';

/**
 * create notification page component.
 */
@Component({
  selector: 'app-create-notification',
  templateUrl: './create-notification.component.html',
  styleUrls: ['./create-notification.component.scss'],
})
export class CreateNotificationComponent {
  public dataSetFormGroup: FormGroup | any = this.emailService.datasetsForm;
  public notificationTypes: string[] = this.emailService.notificationTypes;

  /**
   * initializing Email Service
   *
   * @param emailService helper functions
   */
  constructor(public emailService: EmailService) {}

  /**
   *
   */
  toggle() {
    this.emailService.isExisting = !this.emailService.isExisting;
  }
}
