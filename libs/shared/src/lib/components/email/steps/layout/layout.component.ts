import { Component, OnInit } from '@angular/core';
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
export class LayoutComponent implements OnInit {
  @ViewChild('bodyEditor', { static: false })
  bodyEditor: EditorComponent | null = null;
  /** Tinymce editor configuration */
  public editor: any = EMAIL_LAYOUT_CONFIG;
  bodyHtml: any = '';
  headerHtml: any = '';
  footerHtml: any = '';
  txtSubject: any = '';
  /** Layout Logos */
  headerLogo: string | ArrayBuffer | null = null;
  bannerImage: string | ArrayBuffer | null = null;
  footerLogo: string | ArrayBuffer | null = null;
  showDropdown = false;

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
   * Inserts a dataset token into the body HTML based on the provided tab name.
   *
   * @param tabName The name of the tab to insert the dataset token for.
   */
  insertDataSetToBodyHtmlByTabName(tabName: string): void {
    const token = `{{${tabName}}}`;

    if (this.bodyEditor && this.bodyEditor.editor) {
      this.bodyEditor.editor.insertContent(token);
    } else {
      console.error('Body TinyMCE editor is not initialized');
    }
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
    return colors;
  }
}
