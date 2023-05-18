import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserListComponent } from './user-list.component';
import { TranslateModule } from '@ngx-translate/core';
import { SafeSkeletonTableModule } from '../../../../components/skeleton/skeleton-table/skeleton-table.module';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { SafeEmptyModule } from '../../../../components/ui/empty/empty.module';
import { MenuModule, UiModule } from '@oort-front/ui';
import { MatIconModule } from '@angular/material/icon';
import { SafeButtonModule } from '../../../../components/ui/button/button.module';
import { CheckboxModule } from '@oort-front/ui';

/**
 * Users list module.
 */
@NgModule({
  declarations: [UserListComponent],
  imports: [
    CommonModule,
    TranslateModule,
    SafeSkeletonTableModule,
    MatPaginatorModule,
    SafeEmptyModule,
    MenuModule,
    MatIconModule,
    SafeButtonModule,
    CheckboxModule,
    UiModule,
  ],
  exports: [UserListComponent],
})
export class UserListModule {}
