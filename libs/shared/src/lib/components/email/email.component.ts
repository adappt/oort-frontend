import { Component } from '@angular/core';
import { EmailService } from './email.service';
import { Router } from '@angular/router';

/**
 * Email Notification setup component.
 */
@Component({
  selector: 'app-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss'],
})
export class EmailComponent {
  isExisting = true;
  templateData: any = [];

  /**
   *
   * @param emailService
   * @param router
   */
  constructor(public emailService: EmailService, private router: Router) {}

  ngOnInit(): void {
    this.getExistingTemplate();
  }

  /**
   *
   */
  toggle() {
    this.isExisting = !this.isExisting;
  }

  /**
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  getExistingTemplate() {
    this.emailService.getEmailNotifications().subscribe((res: any) => {
      console.log('getEmailNotifications :', res);
    });
  }

  /**
   *
   * @param searchText
   * @param event
   */
  searchTemplate(event: any) {
    console.log(event);
  }
}
