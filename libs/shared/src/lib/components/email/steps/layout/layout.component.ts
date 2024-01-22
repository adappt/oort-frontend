import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EMAIL_LAYOUT_CONFIG } from '../../../../const/tinymce.const';
import { EditorService } from '../../../../services/editor/editor.service';
import { EmailService } from '../../email.service';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { ViewChild } from '@angular/core';
/**
 * layout page component.
 */
@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild('bodyEditor', { static: false })
  bodyEditor: EditorComponent | null = null;
  /** Tinymce editor configuration */
  public editor: any = EMAIL_LAYOUT_CONFIG;
  public replaceUnderscores = this.emailService.replaceUnderscores;
  bodyHtml: any = '';
  headerHtml: any = '';
  footerHtml: any = '';
  txtSubject: any = '';
  /** Layout Logos */
  headerLogo: string | ArrayBuffer | null = null;
  bannerImage: string | ArrayBuffer | null = null;
  footerLogo: string | ArrayBuffer | null = null;
  showDropdown = false;
  /** First block fields */
  firstBlockFields: string[] = [];
  timeOptions = [
    { value: '{{today.date}}', label: "Today's Date" },
    { value: '{{now.time}}', label: 'Current Time' },
    { value: '{{now.datetime}}', label: 'Date and Time' },
  ];
  @Input() setLayoutValidation = false;

  /**
   * Component used for the selection of fields to display the fields in tabs.
   *
   * @param editorService Editor service used to get main URL and current language
   * @param emailService Service used for email-related operations and state management
   */
  constructor(
    private editorService: EditorService,
    public emailService: EmailService
  ) {
    // Set the editor base url based on the environment file
    this.editor.base_url = editorService.url;
    // Set the editor language
    this.editor.language = editorService.language;
  }

  ngOnInit(): void {
    if (this.emailService.allLayoutdata?.headerLogo) {
      this.headerLogo = URL.createObjectURL(
        this.emailService.allLayoutdata.headerLogo
      );
    }

    if (this.emailService.allLayoutdata?.footerLogo) {
      this.footerLogo = URL.createObjectURL(
        this.emailService.allLayoutdata.footerLogo
      );
    }
    this.initialiseFieldSelectDropdown();
  }

  /**
   *
   */
  initialiseFieldSelectDropdown(): void {
    const firstBlock = this.emailService.getAllPreviewData()[0];
    if (firstBlock && firstBlock.dataList && firstBlock.dataList.length > 0) {
      this.firstBlockFields = Object.keys(firstBlock.dataList[0]);
    }
  }

  /**
   * This method handles the selection of the header logo.
   *
   * @param event - The event triggered when a header logo is selected.
   */
  onHeaderLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => (this.headerLogo = reader.result);
      reader.readAsDataURL(file);
      this.emailService.onHeaderLogoSelected(file);
    }
  }

  /**
   * Removes the header logo from users selection.
   */
  removeHeaderLogo() {
    this.headerLogo = null;
    this.emailService.allLayoutdata.headerLogo = null;
  }

  /**
   * This method handles the selection of the Banner Image.
   *
   * @param event - The event triggered when a Banner Image is selected.
   */
  onBannerSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => (this.bannerImage = reader.result);
      reader.readAsDataURL(file);
      this.emailService.onBannerSelected(file);
    }
  }

  /**
   * This method handles the selection of the footer logo.
   *
   * @param event - The event triggered when a footer logo is selected.
   */
  onFooterLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => (this.footerLogo = reader.result);
      reader.readAsDataURL(file);
      this.emailService.onFooterLogoSelected(file);
    }
  }

  /**
   * Removes the footer logo from users selection.
   */
  removeFooterLogo() {
    this.footerLogo = null;
    this.emailService.allLayoutdata.footerLogo = null;
  }

  /**
   * Inserts a dataset token into the body HTML based on the provided tab name.
   *
   * @param tabName The name of the tab to insert the dataset token for.
   */
  insertDataSetToBodyHtmlByTabName(tabName: any): void {
    const token = `{{${tabName.target.value}}}`;

    if (this.bodyEditor && this.bodyEditor.editor) {
      this.bodyEditor.editor.insertContent(token);
    } else {
      console.error('Body TinyMCE editor is not initialised');
    }
  }

  /**
   * Checks that theres only 1 dataset row and returns the fields in that row if so.
   *
   * @returns The fields in the dataset, else null.
   */
  checkSingleDatasetRow(): string[] | null {
    if (
      this.emailService.allPreviewData.length === 1 &&
      this.emailService.allPreviewData[0].dataList &&
      this.emailService.allPreviewData[0].dataList.length === 1 &&
      Object.keys(this.emailService.allPreviewData[0].dataList[0]).length === 1
    ) {
      // Return the fields from the single row of data
      return Object.keys(this.emailService.allPreviewData[0].dataList[0]);
    }
    return null;
  }

  /**
   * Inserts a dataset token into the subject field based on the selected field.
   *
   * @param event The event object containing the selected field.
   */
  insertSubjectFieldToken(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    if (value) {
      const subjectInput = document.getElementById(
        'subjectInput'
      ) as HTMLInputElement;
      if (subjectInput) {
        const cursorPos =
          subjectInput.selectionStart ?? subjectInput.value.length;
        const textBefore = subjectInput.value.substring(0, cursorPos);
        const textAfter = subjectInput.value.substring(cursorPos);
        subjectInput.value = textBefore + value + textAfter;

        // Trigger the input event to ensure ngModel updates
        const inputEvent = new Event('input', { bubbles: true });
        subjectInput.dispatchEvent(inputEvent);
        selectElement.value = '';
      }
    }
  }

  /**
   * Replaces the email service subject with the provided value by the user.
   *
   * @param event The txtSubject html input element.
   */
  updateEmailServiceSubject(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.emailService.allLayoutdata.txtSubject = inputElement.value;
  }

  /**
   * Handles changes to the editor content and updates the layout data accordingly.
   *
   * @param event The event object containing the updated content.
   */
  onEditorContentChange(event: any): void {
    this.emailService.allLayoutdata.bodyHtml = event.content;
  }

  /**
   * This method retrieves the color values from the form.
   *
   * @returns An object containing color values.
   */
  getColors() {
    const colors = {
      headerBackground: (
        document.getElementById('headerBackgroundColor') as HTMLInputElement
      ).value,
      headerColor: (document.getElementById('headerColor') as HTMLInputElement)
        .value,
      bodyBackground: (
        document.getElementById('bodyBackgroundColor') as HTMLInputElement
      ).value,
      bodyColor: (document.getElementById('bodyColor') as HTMLInputElement)
        .value,
      footerBackground: (
        document.getElementById('footerBackgroundColor') as HTMLInputElement
      ).value,
      footerColor: (document.getElementById('footerColor') as HTMLInputElement)
        .value,
    };

    this.emailService.headerBackgroundColor = colors.headerBackground;
    this.emailService.headerTextColor = colors.headerColor;
    this.emailService.bodyBackgroundColor = colors.bodyBackground;
    this.emailService.bodyTextColor = colors.bodyColor;
    this.emailService.footerBackgroundColor = colors.footerBackground;
    this.emailService.footerTextColor = colors.footerColor;
    return colors;
  }

  /**
   * patch the data in service file.
   */
  ngOnDestroy(): void {
    this.emailService.patchEmailLayout();
  }
}
