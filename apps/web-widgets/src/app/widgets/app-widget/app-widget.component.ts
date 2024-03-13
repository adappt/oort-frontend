import {
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { ShadowRootExtendedHostComponent } from '../../utils/shadow-root-extended-host.component';
import {
  Application,
  ApplicationService,
  ContentType,
  ContextService,
  DataTemplateService,
  WorkflowService,
  MapLayersService,
  AuthService,
} from '@oort-front/shared';
import { Subject, debounceTime, filter, takeUntil } from 'rxjs';
import { isEmpty } from 'lodash';
import { ShadowDomService } from '@oort-front/ui';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

/**
 * Application as Web Widget.
 */
@Component({
  selector: 'app-application-widget',
  templateUrl: './app-widget.component.html',
  styleUrls: ['./app-widget.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  providers: [
    ApplicationService,
    WorkflowService,
    ContextService,
    DataTemplateService,
    MapLayersService,
  ],
})
export class AppWidgetComponent
  extends ShadowRootExtendedHostComponent
  implements OnInit, OnDestroy
{
  /** Application Id */
  @Input()
  set id(value: string) {
    this.applicationService.loadApplication(value);
    // Get the current path
    const currentPath = this.router.url;
    if (currentPath.includes(value)) {
      // Path includes the id
      this.router.navigateByUrl(currentPath);
    } else {
      // Else, navigate to homepage of the app
      this.router.navigate([`./${value}`]);
    }
  }

  /**
   * Check if system that embeds web-widget has finish token refresh
   */
  @Input()
  set isTokenRefreshed(tokenRefreshed: boolean) {
    this.authService.isTokenRefreshed.next(tokenRefreshed);
  }

  /**
   * Set dashboard filter visibility status
   */
  @Input()
  set toggleFilter(opened: boolean) {
    this.onToggleFilter(opened);
  }

  /** Navigation path */
  @Input()
  set path(value: string) {
    this.router.navigate([value]);
  }

  /** Pass new value to the filter */
  @Input()
  set filter(value: any) {
    this.contextService.filter.next(value);
  }

  /** Send reminder to system about token refresh */
  @Output()
  refreshToken$ = new EventEmitter<boolean>();
  /** Is filter active */
  @Output()
  filterActive$ = new EventEmitter<boolean>();
  /** Emit filter value */
  @Output()
  filter$ = new EventEmitter<any>();
  /** Available pages */
  @Output()
  pages = new EventEmitter<any[]>();
  /** Trigger subscription teardown on component destruction */
  private destroy$: Subject<void> = new Subject<void>();
  /** Navigation in SUI is loading */
  public isNavigationLoading = false;

  /**
   * Application as Web Widget.
   *
   * @param el class related element reference
   * @param injector angular application injector
   * @param contextService Shared context service
   * @param applicationService Shared application service
   * @param router Angular router service
   * @param shadowDomService Shared shadow dom service
   * @param authService Auth service
   */
  constructor(
    el: ElementRef,
    injector: Injector,
    private contextService: ContextService,
    private applicationService: ApplicationService,
    private router: Router,
    private shadowDomService: ShadowDomService,
    private authService: AuthService
  ) {
    console.log('DEBUG: build from 03/13/2023, v1');
    super(el, injector);
    this.shadowDomService.shadowRoot = el.nativeElement.shadowRoot;

    // Subscribe to filter changes to emit them
    this.contextService.filter$
      .pipe(debounceTime(500))
      .subscribe(({ current }) => {
        this.filterActive$.emit(!isEmpty(current));
        this.filter$.emit(current);
      });

    // Subscribe to application changes to update the pages
    this.applicationService.application$
      .pipe(takeUntil(this.destroy$))
      .subscribe((application: Application | null) => {
        if (application) {
          const pages = application.pages
            ?.filter((x) => x.content)
            .map((x) => ({
              name: x.name,
              path:
                x.type === ContentType.form
                  ? `./${application.id}/${x.type}/${x.id}`
                  : `./${application.id}/${x.type}/${x.content}`,
              icon: x.icon || this.getNavIcon(x.type || ''),
              fontFamily: x.icon ? 'fa' : 'material',
              visible: x.visible,
            }));
          this.pages.emit(pages);
        } else {
          this.pages.emit([]);
        }
      });

    // Subscribe to token refresh events
    this.authService.refreshToken$
      .pipe(
        filter((refreshToken) => !!refreshToken),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => this.refreshToken$.emit(),
      });

    // Subscribe to router events, to show / hide loading indicator
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isNavigationLoading = true;
      }
      if (event instanceof NavigationEnd) {
        this.isNavigationLoading = false;
      }
    });
  }

  /**
   * Configuration of the Authentication behavior
   */
  override ngOnInit(): void {
    super.ngOnInit();
    const fonts = [
      'https://fonts.googleapis.com/css?family=Roboto:300,400,500&display=swap',
      'https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0',
      'https://unpkg.com/@progress/kendo-font-icons/dist/index.css',
    ];
    // Function to check if a link with the given href already exists in the head
    const isFontLinkAdded = (href: string) => {
      const existingLinks = document.head.querySelectorAll<HTMLLinkElement>(
        'link[rel="stylesheet"]'
      );
      return Array.from(existingLinks).some(
        (link: HTMLLinkElement) => link.href === href
      );
    };

    // Make sure that the needed fonts are always available wherever the web component is placed
    fonts.forEach((font) => {
      if (!isFontLinkAdded(font)) {
        const link = document.createElement('link');
        link.href = font;
        link.rel = 'stylesheet';
        // Add them at the beginning of the head element in order to not interfere with any font of the same type
        document.head.prepend(link);
      }
    });
  }

  /**
   * Toggle filter visibility.
   *
   * @param opened visibility status.
   */
  private onToggleFilter(opened: boolean) {
    this.contextService.filterOpened.next(opened);
  }

  /**
   * Gets nav icon from page content type.
   *
   * @param type content type of the page
   * @returns icon
   */
  private getNavIcon(type: string): string {
    switch (type) {
      case 'workflow':
        return 'linear_scale';
      case 'form':
        return 'description';
      default:
        return 'dashboard';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
