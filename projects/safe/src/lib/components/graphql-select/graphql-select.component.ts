import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { QueryRef } from 'apollo-angular';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  MAT_SELECT_SCROLL_STRATEGY,
  MatSelect,
  MatSelectChange,
} from '@angular/material/select';
import { Overlay } from '@angular/cdk/overlay';
import { scrollFactory } from '../../utils/scroll-factory';
import { cloneDeep, get, set } from 'lodash';
import {
  MatFormField,
  MatFormFieldControl,
  MAT_FORM_FIELD,
} from '@angular/material/form-field';
import { NgControl, ControlValueAccessor } from '@angular/forms';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  MatAutocomplete,
  MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';

/** A constant that is used to determine how many items should be added on scroll. */
const ITEMS_PER_RELOAD = 10;

/** Component for a dropdown with pagination */
@Component({
  selector: 'safe-graphql-select',
  templateUrl: './graphql-select.component.html',
  styleUrls: ['./graphql-select.component.scss'],
  providers: [
    {
      provide: MAT_SELECT_SCROLL_STRATEGY,
      useFactory: scrollFactory,
      deps: [Overlay],
    },
    {
      provide: MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
      useFactory: scrollFactory,
      deps: [Overlay],
    },
    {
      provide: MatFormFieldControl,
      useExisting: SafeGraphQLSelectComponent,
    },
  ],
})
export class SafeGraphQLSelectComponent
  implements
    OnInit,
    OnChanges,
    OnDestroy,
    ControlValueAccessor,
    MatFormFieldControl<string | string[]>
{
  static nextId = 0;

  @Input() valueField = '';
  @Input() textField = '';
  @Output() selectionChange = new EventEmitter<string | string[] | null>();

  @Input() filterable = true;
  @Output() searchChange = new EventEmitter<string>();

  /**
   * searchText is either a string or and object.
   * when it's an object, it's used to display the selected value in the input field and there is no search
   * when it's a string, it represents the search text
   */
  public searchText: any = '';
  private searchTimeout: NodeJS.Timeout | null = null;

  /**
   * Gets the value
   *
   * @returns the value
   */
  @Input() get value(): string | string[] | null {
    return this.ngControl.value;
  }

  /** Sets the value */
  set value(val: string | string[] | null) {
    this.onChange(val);
    this.stateChanges.next();
    this.selectionChange.emit(val);
  }

  public stateChanges = new Subject<void>();
  @HostBinding()
  id = `safe-graphql-select-${SafeGraphQLSelectComponent.nextId++}`;

  /**
   * Gets the placeholder for the select
   *
   * @returns the placeholder
   */
  @Input() get placeholder() {
    return this.ePlaceholder;
  }

  /**
   * Sets the placeholder
   */
  set placeholder(plh) {
    this.ePlaceholder = plh;
    this.stateChanges.next();
  }
  private ePlaceholder = '';
  public focused = false;
  public touched = false;
  onTouched = () => {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChange = (_: any) => {};

  /**
   * Gets the empty status
   *
   * @returns if an option is selected
   */
  get empty() {
    // return !this.selected.value;
    return !this.ngControl.control?.value;
  }

  /**
   * Indicates whether the label should be in the floating position
   *
   * @returns whether the label should be in the floating position
   */
  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  /**
   * Indicates whether the field is required
   *
   * @returns whether the field is required
   */
  @Input()
  get required() {
    return this.isRequired;
  }

  /**
   * Sets whether the field is required
   */
  set required(req) {
    this.isRequired = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  private isRequired = false;

  /**
   * Indicates whether the field is disabled
   *
   * @returns whether the field is disabled
   */
  @Input()
  get disabled(): boolean {
    return this.ngControl.disabled || false;
  }

  /** Sets whether the field is disabled */
  set disabled(value: boolean) {
    const isDisabled = coerceBooleanProperty(value);
    if (isDisabled) this.ngControl.control?.disable();
    else this.ngControl.control?.enable();
    this.stateChanges.next();
  }

  /**
   * Indicates whether the input is in an error state
   *
   * @returns whether the input is in an error state
   */
  get errorState(): boolean {
    return (this.ngControl.invalid && this.touched) || false;
    // return this.ngControl.invalid && this.touched;
    // return this.selected.invalid && this.touched;
  }

  public controlType = 'safe-graphql-select';

  @Input('aria-describedby') userAriaDescribedBy!: string;

  /**
   * Sets element ids that should be used for the aria-describedby attribute of your control
   *
   * @param ids id array
   */
  setDescribedByIds(ids: string[]) {
    const controlElement = this.elementRef.nativeElement.querySelector(
      '.safe-graphql-select-container'
    );
    if (!controlElement) return;
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  /**
   * Handles mouse click on container
   *
   * @param event Mouse event
   */
  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() !== 'input') {
      this.elementRef.nativeElement.querySelector('input')?.focus();
    }
  }

  /**
   * ControlValueAccessor set value
   *
   * @param val new value
   */
  writeValue(val: string | null): void {
    this.value = val;
  }

  /**
   * Registers new onChange function
   *
   * @param fn onChange function
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * Registers new onTouched function
   *
   * @param fn onTouched function
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // public selected: FormControl;

  /** Query reference for getting the available contents */
  @Input('query') query!: QueryRef<any>;

  private queryName!: string;
  @Input() path = '';
  @Input() selectedElements: any[] = [];
  public elements = new BehaviorSubject<any[]>([]);
  public elements$!: Observable<any[]>;
  private pageInfo = {
    endCursor: '',
    hasNextPage: true,
  };
  public loading = true;

  @ViewChild(MatSelect) elementSelect?: MatSelect;
  @ViewChild(MatAutocomplete) elementAutocomplete?: MatAutocomplete;

  /**
   * The constructor function is a special function that is called when a new instance of the class is
   * created
   *
   * @param elementRef shared element ref service
   * @param formField MatFormField
   * @param ngControl form control shared service
   */
  constructor(
    private elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.elements$ = this.elements.asObservable();
    this.query.valueChanges.subscribe((res: any) => {
      this.queryName = Object.keys(res.data)[0];
      const path = this.path
        ? `${this.queryName}.${this.path}`
        : this.queryName;
      const elements: any[] = get(res.data, path).edges
        ? get(res.data, path).edges.map((x: any) => x.node)
        : get(res.data, path);
      this.selectedElements = this.selectedElements.filter(
        (selectedElement) =>
          selectedElement &&
          !elements.find(
            (node) => node[this.valueField] === selectedElement[this.valueField]
          )
      );
      this.elements.next([...this.selectedElements, ...elements]);
      this.pageInfo = get(res.data, path).pageInfo;
      this.loading = res.loading;
    });
    this.ngControl.valueChanges?.subscribe((value) => {
      this.selectionChange.emit(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // check if the query has changed
    // if so, reset the loading and pageInfo states
    if (changes.query) {
      this.loading = true;
      this.pageInfo = {
        endCursor: '',
        hasNextPage: true,
      };
    }

    const elements = this.elements.getValue();
    this.selectedElements = this.selectedElements.filter(
      (selectedElement) =>
        selectedElement &&
        !elements.find(
          (node) => node[this.valueField] === selectedElement[this.valueField]
        )
    );
    this.elements.next([...this.selectedElements, ...elements]);

    /**
     * This is needed in order to display previously selected elements
     * when the selectedElements input changes, due to how displayWith works
     */
    if (
      changes.selectedElements &&
      changes.selectedElements.currentValue.length > 0
    ) {
      this.searchText = '';
      this.searchText =
        this.elements
          .getValue()
          .find((x) => x[this.valueField] === this.value) || '';
    }
  }

  ngOnDestroy(): void {
    this.stateChanges.complete();
  }

  /**
   * Gets the display string for an autocomplete option.
   *
   * @param option option to get display text of.
   * @returns a string with the display value.
   */
  public getDisplayText(option: any): string {
    if (typeof option === 'string') {
      // looks for the option id in the elements
      const element = this.elements
        .getValue()
        .find((x) => x[this.valueField] === option);
      // if found, returns the display text
      if (element) return element[this.textField];
      // if not found, returns the option
      return option;
    }
    return option && option[this.textField] ? option[this.textField] : '';
  }

  /**
   * Handles focus on input
   */
  onFocusIn() {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  /**
   * Handles lost focus on input
   *
   * @param event The focus event
   */
  onFocusOut(event: FocusEvent) {
    if (
      this.focused &&
      !this.elementRef.nativeElement.contains(event.relatedTarget as Element)
    ) {
      this.touched = true;
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  /**
   * Adds scroll listener to select.
   *
   * @param e open select event.
   */
  onOpenSelect(e: any): void {
    if (e && this.elementSelect) {
      const panel = this.elementSelect.panel.nativeElement;
      if (panel) {
        panel.addEventListener('scroll', (event: any) =>
          this.loadOnScroll(event)
        );
      }
    }
  }

  /** Adds scroll listener to autocomplete. */
  async onOpenAutocomplete(): Promise<void> {
    // wait a bit to make sure the panel is rendered
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (this.elementAutocomplete) {
      const panel = this.elementAutocomplete.panel?.nativeElement;
      if (panel) {
        panel.addEventListener('scroll', (event: any) =>
          this.loadOnScroll(event)
        );
      }
    }
  }

  /**
   * Triggered when the autocomplete is closed.
   *
   * This is useful so there's no confusion about the value of the input.
   * For example, if the user types the exact name of the element they want,
   * then clicks outside the autocomplete without selecting the element,
   * the value will not be set to the element with that name.
   */
  public onCloseAutocomplete() {
    if (typeof this.value === 'string') this.searchText = this.value;
    else if (this.value === null) this.searchText = '';
    this.searchChange.emit('');
  }

  /**
   * Fetches more resources on scroll.
   *
   * @param e scroll event.
   */
  private loadOnScroll(e: any): void {
    if (
      e.target.scrollHeight - (e.target.clientHeight + e.target.scrollTop) <
      50
    ) {
      if (!this.loading && this.pageInfo.hasNextPage) {
        this.loading = true;
        this.query.fetchMore({
          variables: {
            ...this.query.variables,
            first: ITEMS_PER_RELOAD,
            afterCursor: this.pageInfo.endCursor,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) {
              this.loading = false;
              return prev;
            }
            const prevCpy = cloneDeep(prev);
            const path = this.path
              ? `${this.queryName}.${this.path}`
              : this.queryName;
            set(prevCpy, path, {
              edges: [
                ...(get(prev, path).edges
                  ? get(prev, path).edges
                  : get(prev, path)),
                ...(get(fetchMoreResult, path).edges
                  ? get(fetchMoreResult, path).edges
                  : get(fetchMoreResult, path)),
              ],
              pageInfo: get(fetchMoreResult, path).pageInfo,
              totalCount: get(fetchMoreResult, path).totalCount,
            });
            return prevCpy;
          },
        });
      }
    }
  }

  /**
   * Triggers on search text change for autocomplete
   * If the search text id not an id, emits the search text
   */
  public onSearchTextChange() {
    if (this.searchText && typeof this.searchText === 'string') {
      // debounce
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.searchChange.emit(this.searchText);
      }, 500);
    }
  }

  /**
   * Triggers on selection change for select
   *
   * @param event the selection change event
   */
  public onSelectionChange(event: MatSelectChange) {
    this.value = event.value;
  }

  /**
   * Triggers on selection change for autocomplete
   *
   * @param event the selection change event
   */
  onOptionSelected(event: MatAutocompleteSelectedEvent) {
    this.value = event.option.value[this.valueField];
  }
}
