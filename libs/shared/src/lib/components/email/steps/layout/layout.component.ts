import { Component } from '@angular/core';
import { EMAIL_LAYOUT_CONFIG } from 'libs/shared/src/lib/const/tinymce.const';
import { EditorService } from 'libs/shared/src/lib/services/editor/editor.service';
/**
 * layout page component.
 */
@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  headerLogo: string | ArrayBuffer | null = null;
  bannerImage: string | ArrayBuffer | null = null;
  footerLogo: string | ArrayBuffer | null = null;
  /** Tinymce editor configuration */
  public editor: any = EMAIL_LAYOUT_CONFIG;
  bodyHtml: any = '';
  headerHtml: any = '';
  footerHtml: any = '';

  /**
   * Component used for the selection of fields to display the fields in tabs.
   *
   * @param editorService Editor service used to get main URL and current language
   */
  constructor(private editorService: EditorService) {
    // Set the editor base url based on the environment file
    this.editor.base_url = editorService.url;
    // Set the editor language
    this.editor.language = editorService.language;
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
    }
  }

  /**
   * This method retrieves the color values from the form.
   *
   * @returns An object containing color values.
   */
  getColors() {
    const colors = {
      titleBackgroundColor: (
        document.getElementById('titleBackgroundColor') as HTMLInputElement
      ).value,
      headerColor: (document.getElementById('headerColor') as HTMLInputElement)
        .value,
      titleColor: (document.getElementById('titleColor') as HTMLInputElement)
        .value,
      containerColor: (
        document.getElementById('containerColor') as HTMLInputElement
      ).value,
      anchorColor: (document.getElementById('anchorColor') as HTMLInputElement)
        .value,
      footerColor: (document.getElementById('footerColor') as HTMLInputElement)
        .value,
      textColor: (document.getElementById('textColor') as HTMLInputElement)
        .value,
      dividerColor: (
        document.getElementById('dividerColor') as HTMLInputElement
      ).value,
    };
    return colors;
  }
}
