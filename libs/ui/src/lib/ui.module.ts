import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from './avatar/avatar.module';
import { ButtonModule } from './button/button.module';
import { CheckboxModule } from './checkbox/checkbox.module';
import { FlyoutMenuModule } from './flyout-menu/flyout-menu.module';
import { IconModule } from './icon/icon.module';
import { SelectModule } from './select/select.module';
import { TooltipDirective } from './tooltip/tooltip.directive';

/**
 * UI Library Module
 */
@NgModule({
  imports: [CommonModule],
  exports: [
    AvatarModule,
    ButtonModule,
    CheckboxModule,
    FlyoutMenuModule,
    IconModule,
    SelectModule,
  ],
  declarations: [
    TooltipDirective
  ],
})
export class UiModule {}
