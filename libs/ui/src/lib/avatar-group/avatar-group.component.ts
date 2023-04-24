import {
  Component,
  Input,
  AfterViewInit,
  Renderer2,
  ElementRef,
  QueryList,
  ContentChildren,
  AfterContentInit,
} from '@angular/core';
import { AvatarGroupStack } from './enums/avatar-group-stack.enum';
import { AvatarComponent } from '../avatar/avatar.component';
import { AvatarSize } from '../avatar/enums/avatar-size.enum';
import { AvatarShape } from '../avatar/enums/avatar-shape.enum';

@Component({
  selector: 'ui-avatar-group',
  templateUrl: './avatar-group.component.html',
  styleUrls: ['./avatar-group.component.scss'],
})
export class AvatarGroupComponent implements AfterViewInit, AfterContentInit {
  @Input() size: AvatarSize | string = AvatarSize.MEDIUM;
  @Input() shape: AvatarShape | string = AvatarShape.CIRCLE;
  @Input() stack: AvatarGroupStack | string = AvatarGroupStack.TOP;
  @Input() limit = 5;

  @ContentChildren(AvatarComponent) avatars!: QueryList<AvatarComponent>;

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  avatarGroupStack = AvatarGroupStack;

  ngAfterViewInit(): void {
    if (this.stack === AvatarGroupStack.TOP) {
      const avatars = this.el.nativeElement.querySelectorAll('ui-avatar');
      const total_avatars = avatars.length;
      Array.from(avatars).forEach((avatar: any, index: number) => {
        this.renderer.setStyle(avatar, 'z-index', `${total_avatars - index}`);
      });
    }
    console.log(this.avatars);
    // this.avatars.
    // for (const avatar of this.avatars) {
    //   avatar.
    // }
  }

  ngAfterContentInit(): void {
    console.log(this.avatars);
  }
}
