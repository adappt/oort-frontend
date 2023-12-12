import {
  Component,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Optional,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { DataTemplateService } from '../../../../services/data-template/data-template.service';
import { UnsubscribeComponent } from '../../../utils/unsubscribe/unsubscribe.component';
import { Dialog } from '@angular/cdk/dialog';
import { HtmlWidgetContentComponent } from '../../common/html-widget-content/html-widget-content.component';
import { takeUntil } from 'rxjs';
import { SummaryCardItemComponent } from '../summary-card-item/summary-card-item.component';

/**
 * Content component of Single Item of Summary Card.
 * Build html from item definition and queried record.
 */
@Component({
  selector: 'shared-summary-card-item-content',
  templateUrl: './summary-card-item-content.component.html',
  styleUrls: ['./summary-card-item-content.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SummaryCardItemContentComponent
  extends UnsubscribeComponent
  implements OnInit, OnChanges
{
  /** Html template */
  @Input() html = '';
  /** Available fields */
  @Input() fields: any[] = [];
  /** Fields value */
  @Input() fieldsValue: any;
  /** Styles to load */
  @Input() styles: any[] = [];
  /** Should style apply to whole card */
  @Input() wholeCardStyles = false;
  /** Reference to html content component */
  @ViewChild(HtmlWidgetContentComponent)
  htmlContentComponent!: HtmlWidgetContentComponent;
  /** Formatted html, to be rendered */
  public formattedHtml: SafeHtml = '';
  /** Formatted style, to be applied */
  public formattedStyle?: string;

  /**
   * Content component of Single Item of Summary Card.
   *
   * @param dataTemplateService Shared data template service, used to render content from template
   * @param dialog CDK Dialog service
   * @param parent Reference to parent summary card item component
   */
  constructor(
    private dataTemplateService: DataTemplateService,
    private dialog: Dialog,
    @Optional() public parent: SummaryCardItemComponent
  ) {
    super();
  }

  ngOnInit(): void {
    this.formattedStyle = this.dataTemplateService.renderStyle(
      this.wholeCardStyles,
      this.fieldsValue,
      this.styles
    );
    this.formattedHtml = this.dataTemplateService.renderHtml(
      this.html,
      this.fieldsValue,
      this.fields,
      this.styles
    );
  }

  /**
   * Detects when the html or record inputs change.
   */
  ngOnChanges(): void {
    this.formattedStyle = this.dataTemplateService.renderStyle(
      this.wholeCardStyles,
      this.fieldsValue,
      this.styles
    );
    this.formattedHtml = this.dataTemplateService.renderHtml(
      this.html,
      this.fieldsValue,
      this.fields,
      this.styles
    );
  }

  /**
   * Listen to click events from host element, if record editor is clicked, open record editor modal
   *
   * @param event Click event from host element
   */
  @HostListener('click', ['$event'])
  onContentClick(event: any) {
    const content = this.htmlContentComponent.el.nativeElement;
    const editorTriggers = content.querySelectorAll('.record-editor');
    editorTriggers.forEach((recordEditor: HTMLElement) => {
      if (recordEditor.contains(event.target)) {
        this.openEditRecordModal();
      }
    });
  }

  /**
   * Pass click event to data template service
   *
   * @param event Click event
   */
  public onClick(event: any) {
    this.dataTemplateService.onClick(event, this.fieldsValue);
  }

  /**
   * Open edit record modal.
   */
  private async openEditRecordModal() {
    if (
      this.parent.card.resource &&
      this.parent.card.layout &&
      this.fieldsValue.canUpdate
    ) {
      const { FormModalComponent } = await import(
        '../../../form-modal/form-modal.component'
      );
      const dialogRef = this.dialog.open(FormModalComponent, {
        disableClose: true,
        data: {
          recordId: this.fieldsValue.id,
          template: this.parent.card.template,
        },
        autoFocus: false,
      });
      dialogRef.closed.pipe(takeUntil(this.destroy$)).subscribe((value) => {
        if (value) {
          this.parent.refresh();
          // Update the record, based on new configuration
          // this.getRecord().then(() => {
          //   this.formattedStyle = this.dataTemplateService.renderStyle(
          //     this.settings.wholeCardStyles || false,
          //     this.fieldsValue,
          //     this.styles
          //   );
          //   this.formattedHtml = this.dataTemplateService.renderHtml(
          //     this.settings.text,
          //     this.fieldsValue,
          //     this.fields,
          //     this.styles
          //   );
          // });
        }
      });
    }
  }
}
