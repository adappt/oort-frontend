import { Component, OnDestroy, OnInit } from '@angular/core';
import { EmailService } from '../../email.service';
import { FormGroup } from '@angular/forms';

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
  public toEmailFilter!: FormGroup | any;
  public ccEmailFilter!: FormGroup | any;
  public bccEmailFilter!: FormGroup | any;
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
    this.toEmailFilter = this.emailService.toEmailFilter;
    this.ccEmailFilter = this.emailService.ccEmailFilter;
    this.bccEmailFilter = this.emailService.bccEmailFilter;
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
   * @param data.emails Array of email addresses to be set in the 'To' field.
   * @param data.emailFilter The form group representing the email filter.
   */
  to(data: { emails: string[]; emailFilter: any }): void {
    this.recipients.To = data.emails;
    this.toEmailFilter = data.emailFilter;
  }

  /**
   * This method is used to set the 'CC' field of the email.
   *
   * @param data The data to be set in the 'CC' field.
   * @param data.emails Array of email addresses to be set in the 'CC' field.
   * @param data.emailFilter The form group representing the email filter.
   */
  cc(data: { emails: string[]; emailFilter: any }): void {
    this.recipients.Cc = data.emails;
    this.ccEmailFilter = data.emailFilter;
  }

  /**
   * This method is used to set the 'BCC' field of the email.
   *
   * @param data The data to be set in the 'BCC' field.
   * @param data.emails Array of email addresses to be set in the 'BCC' field.
   * @param data.emailFilter The form group representing the email filter.
   */
  bcc(data: { emails: string[]; emailFilter: any }): void {
    this.recipients.Bcc = data.emails;
    this.bccEmailFilter = data.emailFilter;
  }

  ngOnDestroy(): void {
    this.emailService.recipients = this.recipients;
    this.emailService.toEmailFilter = this.toEmailFilter;
    this.emailService.ccEmailFilter = this.ccEmailFilter;
    this.emailService.bccEmailFilter = this.bccEmailFilter;
  }
}
