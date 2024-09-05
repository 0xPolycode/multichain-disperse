import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-token-icon',
  templateUrl: './token-icon.component.html',
  styleUrl: './token-icon.component.css'
})
export class TokenIconComponent {

  @Input() token!: string

}
