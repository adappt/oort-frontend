import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreviewToolbarComponent } from './preview-toolbar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { SafeButtonModule } from '@safe/builder';

@NgModule({
  declarations: [PreviewToolbarComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDividerModule,
    SafeButtonModule
  ],
  exports: [PreviewToolbarComponent]
})
export class PreviewToolbarModule { }
