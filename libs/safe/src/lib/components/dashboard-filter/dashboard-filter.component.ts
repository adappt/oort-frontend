import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FilterPosition } from './enums/dashboard-filters.enum';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { SafeFilterBuilderComponent } from './filter-builder-modal/filter-builder.component';
import * as Survey from 'survey-angular';
import { Apollo } from 'apollo-angular';
import { SafeApplicationService } from '../../services/application/application.service';
import { Application } from '../../models/application.model';
import { SafeUnsubscribeComponent } from '../utils/unsubscribe/unsubscribe.component';
import { takeUntil } from 'rxjs/operators';
import {
  EDIT_APPLICATION_FILTER,
  EditApplicationMutationResponse,
} from './graphql/mutations';
import { TranslateService } from '@ngx-translate/core';
import { SafeSnackBarService } from '../../services/snackbar/snackbar.service';

/**  Dashboard contextual filter component. */
@Component({
  selector: 'safe-dashboard-filter',
  templateUrl: './dashboard-filter.component.html',
  styleUrls: ['./dashboard-filter.component.scss'],
})
export class SafeDashboardFilterComponent
  extends SafeUnsubscribeComponent
  implements AfterViewInit, OnInit
{
  // Filter
  @Input() position: FilterPosition = FilterPosition.LEFT;
  public positionList = [
    FilterPosition.LEFT,
    FilterPosition.TOP,
    FilterPosition.BOTTOM,
    FilterPosition.RIGHT,
  ] as const;
  public isDrawerOpen = false;
  public themeColor!: string;
  public filterPosition = FilterPosition;
  public containerWidth!: string;
  public containerHeight!: string;

  // Survey
  public filterFormGroup: FormGroup = new FormGroup({});
  public survey: Survey.Model = new Survey.Model();
  public surveyStructure: any = {};
  @ViewChild('surveyCreatorContainer') surveyCreatorContainer!: ElementRef;

  public applicationId?: string;

  /**
   * Class constructor
   *
   * @param environment environment
   * @param hostElement Host/Component Element
   * @param dialog The material dialog service
   * @param apollo Apollo client
   * @param applicationService Shared application service
   * @param snackBar Shared snackbar service
   * @param translate Angular translate service
   */
  constructor(
    @Inject('environment') environment: any,
    private hostElement: ElementRef,
    private dialog: MatDialog,
    private apollo: Apollo,
    private applicationService: SafeApplicationService,
    private snackBar: SafeSnackBarService,
    private translate: TranslateService
  ) {
    super();
    this.themeColor = environment.theme.primary;
  }

  ngOnInit(): void {
    this.applicationService.application$
      .pipe(takeUntil(this.destroy$))
      .subscribe((application: Application | null) => {
        if (application) {
          this.applicationId = application.id;
          if (application.contextualFilter) {
            this.surveyStructure = application.contextualFilter;
            this.initSurvey();
          }
        }
      });
  }

  /**
   * Set the drawer height and width on resize
   */
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.containerWidth =
      this.hostElement.nativeElement?.offsetWidth.toString() + 'px';
    this.containerHeight =
      this.hostElement.nativeElement?.offsetHeight.toString() + 'px';
  }

  /**
   * Event to close drawer on esc
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEsc() {
    this.isDrawerOpen = false;
  }

  // We need the set the fix values first as we do not know the number of filters the component is going to receive
  // And because the drawerPositioner directive makes the element fixed
  ngAfterViewInit(): void {
    // This settimeout is needed as this dashboard is currently placed inside a mat-drawer
    // We have to set a minimum timeout fix to get the real width of the host component until mat-drawer fully opens
    // If the dashboard filter is placed somewhere else that is not a mat-drawer this would not be needed
    setTimeout(() => {
      this.containerWidth =
        this.hostElement.nativeElement?.offsetWidth.toString() + 'px';
      this.containerHeight =
        this.hostElement.nativeElement?.offsetHeight.toString() + 'px';
    }, 0);
  }

  /**
   * Set the current position of the filter wrapper
   *
   * @param position Position to set
   */
  public changeFilterPosition(position: FilterPosition) {
    this.position = position;
  }

  /**
   * Opens the modal to edit filters
   */
  public onEditFilter() {
    const surveyStructure = this.surveyStructure.text ?? this.surveyStructure;
    const dialogRef = this.dialog.open(SafeFilterBuilderComponent, {
      height: '90%',
      width: '100%',
      panelClass: 'edit-filters-modal',
      data: { surveyStructure },
    });
    dialogRef.afterClosed().subscribe((newStructure) => {
      if (newStructure) {
        this.surveyStructure = newStructure;
        this.initSurvey();
        this.saveFilter();
      }
    });
  }

  /** Saves the application contextual filter using the editApplication mutation */
  private saveFilter(): void {
    this.apollo
      .mutate<EditApplicationMutationResponse>({
        mutation: EDIT_APPLICATION_FILTER,
        variables: {
          id: this.applicationId,
          contextualFilter: this.surveyStructure.text,
        },
      })
      .subscribe(({ errors, data }) => {
        if (errors) {
          this.snackBar.openSnackBar(
            this.translate.instant('common.notifications.objectNotUpdated', {
              type: this.translate.instant('common.filter.one'),
              error: errors ? errors[0].message : '',
            }),
            { error: true }
          );
        } else {
          this.snackBar.openSnackBar(
            this.translate.instant('common.notifications.objectUpdated', {
              type: this.translate.instant('common.filter.one').toLowerCase(),
              value: data?.editApplication.name ?? '',
            })
          );
        }
      });
  }

  /** Render the survey using the saved structure */
  private initSurvey(): void {
    Survey.StylesManager.applyTheme();
    const surveyStructure = this.surveyStructure.JSON ?? this.surveyStructure;
    this.survey = new Survey.Model(surveyStructure);
    this.survey.showCompletedPage = false;
    this.survey.showNavigationButtons = false;
    this.survey.render(this.surveyCreatorContainer.nativeElement);
  }
}
