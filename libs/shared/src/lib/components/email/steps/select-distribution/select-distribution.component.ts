import { Component, OnInit } from '@angular/core';

/**
 * Select Distribution component.
 */
@Component({
  selector: 'app-select-distribution',
  templateUrl: './select-distribution.component.html',
  styleUrls: ['./select-distribution.component.scss'],
})
export class SelectDistributionComponent implements OnInit {
  public showEmailTemplate = false;
  public templateFor = '';

  ngOnInit(): void {
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
}
