import { Component, Input } from '@angular/core';
import { arbitrum, avalanche, base, optimism, polygon, scroll } from 'viem/chains';

@Component({
  selector: 'app-chain-icon',
  templateUrl: './chain-icon.component.html',
  styleUrl: './chain-icon.component.css'
})
export class ChainIconComponent {

  @Input() chainId!: number

  getSymbol() {
    switch(this.chainId) {
      case optimism.id: return 'op';
      case base.id: return 'base';
      case polygon.id: return 'polygon';
      case avalanche.id: return 'avax';
      case arbitrum.id: return 'arb';
      case scroll.id: return 'scroll'
    }
    return ''
  }

}
