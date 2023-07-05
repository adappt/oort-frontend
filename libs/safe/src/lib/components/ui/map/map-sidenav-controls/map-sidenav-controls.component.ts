import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule, DividerModule } from '@oort-front/ui';
import { SafeLayoutService } from '../../../../services/layout/layout.service';
import { SidenavControlsMenuComponent } from './sidenav-controls-menu/sidenav-controls-menu.component';
import { MapComponent } from '../map.component';

/**
 * Map layers component
 */
@Component({
  selector: 'safe-map-sidenav-controls',
  standalone: true,
  imports: [ButtonModule, CommonModule, DividerModule, TranslateModule],
  templateUrl: './map-sidenav-controls.component.html',
  styleUrls: ['./map-sidenav-controls.component.scss'],
})
export class MapSidenavControlsComponent {
  private layersTree!: L.Control.Layers.TreeObject[];
  private basemaps!: L.Control.Layers.TreeObject[];
  private mapComponent!: MapComponent;

  /**
   * Map layers component
   *
   * @param layoutService shared layout service
   */
  constructor(private layoutService: SafeLayoutService) {}

  /** Opens the layers menu */
  openLayersMenu() {
    this.openSidenavMenu(true, false);
  }

  /** Opens the bookmarks menu */
  openBookmarksMenu() {
    this.openSidenavMenu(false, true);
  }

  /**
   * Opens the sidenav menu
   *
   * @param layersMenuExpanded true if we start with the layers expanded
   * @param bookmarksMenuExpanded true if we start with the bookmarks expanded
   */
  openSidenavMenu(layersMenuExpanded: boolean, bookmarksMenuExpanded: boolean) {
    this.layoutService.setRightSidenav({
      component: SidenavControlsMenuComponent,
      inputs: {
        layersMenuExpanded: layersMenuExpanded,
        bookmarksMenuExpanded: bookmarksMenuExpanded,
        layersTree: this.layersTree,
        basemaps: this.basemaps,
        mapComponent: this.mapComponent,
      },
    });
  }
}
