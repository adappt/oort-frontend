import { Meta, StoryFn, moduleMetadata } from '@storybook/angular';
import { FixedWrapperComponent } from './fixed-wrapper.component';
import { CommonModule } from '@angular/common';

export default {
  title: 'Components/Fixed Wrapper',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  component: FixedWrapperComponent,
} as Meta<FixedWrapperComponent>;

/**
 * Template expansion panel group
 *
 * @returns ExpansionPanelComponent
 */
const Template: StoryFn<FixedWrapperComponent> = () => {
  return {
    component: FixedWrapperComponent,
    template: `
    <ng-template #fixedWrapperActions>
    <div
      class="z-[1] sticky bottom-0 right-0 py-2 px-4 bg-white w-full shadow-lg transition-shadow duration-300 shadow-slate-700 border-t border-gray-300"
    >
      <div class="flex w-full justify-end">
        <!-- Inject actions -->
        <ng-content></ng-content>
      </div>
    </div>
  </ng-template>
    `,
  };
};

/** Primary checkbox */
export const Primary = Template.bind({});
