import { Component, OnDestroy, OnInit } from '@angular/core';
import { EmailService } from '../../email.service';

/**
 * Select Distribution component.
 */
@Component({
  selector: 'app-select-distribution',
  templateUrl: './select-distribution.component.html',
  styleUrls: ['./select-distribution.component.scss'],
})
export class SelectDistributionComponent implements OnInit, OnDestroy {
  /**
   * Composite email distribution.
   *
   * @param emailService helper functions
   */
  constructor(public emailService: EmailService) {}

  public showEmailTemplate = false;
  public templateFor = '';
  public recipients: {
    distributionListName: string;
    To: string[];
    Cc: string[];
    Bcc: string[];
  } = {
    distributionListName: '',
    To: [],
    Cc: [],
    Bcc: [],
  };

  ngOnInit(): void {
    this.recipients = this.emailService.recipients;
    console.log('SelectDistributionComponent');
  }

  /**
   * This method is used to show/hide the email template
   *
   * @param templateFor distribution email template for [ to | cc | bcc ]
   */
  toggleDropdown(templateFor: string): void {
    if (!this.templateFor || this.templateFor === templateFor) {
      this.showEmailTemplate = !this.showEmailTemplate;
    }
    this.templateFor = templateFor;
  }

  /**
   * This method is used to set the 'To' field of the email.
   *
   * @param data The data to be set in the 'To' field.
   */
  to(data: any): void {
    this.recipients.To = data;
  }

  /**
   * This method is used to set the 'CC' field of the email.
   *
   * @param data The data to be set in the 'CC' field.
   */
  cc(data: any): void {
    this.recipients.Cc = data;
  }

  /**
   * This method is used to set the 'BCC' field of the email.
   *
   * @param data The data to be set in the 'BCC' field.
   */
  bcc(data: any): void {
    this.recipients.Bcc = data;
  }

  ngOnDestroy(): void {
    this.emailService.recipients = this.recipients;
  }
}
