import { moduleMetadata, Story, Meta } from '@storybook/angular';
import { SliderComponent } from './slider.component';
import { FormsModule } from '@angular/forms';
import { SliderModule } from '@progress/kendo-angular-inputs';

export default {
  title: 'SliderComponent',
  component: SliderComponent,
  decorators: [
    moduleMetadata({
      imports: [FormsModule, SliderModule],
    }),
  ],
} as Meta<SliderComponent>;

const Template: Story<SliderComponent> = (args: SliderComponent) => ({
  props: args,
  template:
    '<ui-slider [(ngModel)]="external" [minValue]="minValue" [maxValue]="maxValue" name="externalVal" #validations="ngModel"></ui-slider> external: {{external}}',
});

export const Primary = Template.bind({});
Primary.args = {
  minValue: 1,
  maxValue: 14,
};
