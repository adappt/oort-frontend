import { Component, ViewChild } from '@angular/core';

/**
 * create-datasetpage component.
 */

@Component({
  selector: 'app-create-dataset',
  templateUrl: './create-dataset.component.html',
  styleUrls: ['./create-dataset.component.scss'],
})
export class CreateDatasetComponent {

  tabIndex="filter";

  changeTab(tabIndex:any){
    this.tabIndex=tabIndex;
  }
  
}
