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
   * To show/hide the email temple
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
   * data for to
   * @param data
   */
  to(data: any): void {
    this.recipients.To = data;
  }

  /**
   * data for cc
   * @param data
   */
  cc(data: any): void {
    this.recipients.Cc = data;
  }

  /**
   * data for bcc
   * @param data
   */
  bcc(data: any): void {
    this.recipients.Bcc = data;
  }

  ngOnDestroy(): void {
    this.emailService.recipients = this.recipients;
  }
}
