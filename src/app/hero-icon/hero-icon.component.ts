// hero-icon.component.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconService } from '../icon.service';

@Component({
  selector: 'hero-icon',
  template: '<span [innerHTML]="icon"></span>'
})
export class HeroIconComponent implements OnChanges {
  @Input() name!: string;
  @Input() class: string = 'w-6 h-6';

  icon!: SafeHtml;

  constructor(private iconService: IconService, private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['name']) {
      const svgContent = this.iconService.getIcon(this.name);
      const svgWithClass = svgContent.replace('<svg', `<svg class="${this.class}"`);
      this.icon = this.sanitizer.bypassSecurityTrustHtml(svgWithClass);
    }
  }
}