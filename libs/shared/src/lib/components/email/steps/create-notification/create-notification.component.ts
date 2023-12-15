import { Component, ViewChild } from '@angular/core';

/**
 * create notification page component.
 */
@Component({
  selector: 'app-create-notification',
  templateUrl: './create-notification.component.html',
  styleUrls: ['./create-notification.component.scss'],
})
export class CreateNotificationComponent {
  
  isExisting=false;

  toggle(){
    this.isExisting=!this.isExisting;
  }
}
