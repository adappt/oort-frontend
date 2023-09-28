import { Component, OnInit } from '@angular/core';
import { AuthService, FormService } from '@oort-front/shared';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../environments/environment';

/**
 * Root component of back-office.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'back-office';

  /**
   * Root component of back-office
   *
   * @param authService Shared authentication service
   * @param formService Shared form service
   * @param translate Angular translate service
   */
  constructor(
    private authService: AuthService,
    // We need to initialize the service there
    private formService: FormService,
    private translate: TranslateService
  ) {
    this.translate.addLangs(environment.availableLanguages);
    this.translate.setDefaultLang(environment.availableLanguages[0]);
  }

  /**
   * Configuration of the Authentication behavior
   */
  ngOnInit(): void {
    this.authService.initLoginSequence();
  }
}
