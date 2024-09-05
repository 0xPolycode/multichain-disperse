// app.component.ts
import { Component, OnInit } from '@angular/core';
import {
  Address,
  batchTx,
  buildItx,
  buildTokenMapping,
  deployment,
  getTokenAddressForChainId,
  initKlaster,
  klasterNodeHost,
  loadBicoV2Account,
  mcUSDC,
  mcUSDT,
  rawTx,
  singleTx,
  UnifiedBalanceResult,
} from 'klaster-sdk';
import {
  Chain,
  createWalletClient,
  custom,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  parseUnits,
} from 'viem';
import { BlockchainService } from './blockchain.service';
import {
  arbitrum,
  avalanche,
  base,
  optimism,
  polygon,
  scroll,
} from 'viem/chains';
import { IconName, icons } from './icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom, map, of, switchMap } from 'rxjs';
import { AcrossService } from './across.service';

interface Recipient {
  address: Address | null;
  chain: Chain;
  amount: number | null;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  dropdowns: { [key: string]: boolean } = {};
  sourceChain: Chain = base;

  stringIcons = icons;

  totalAmount: number = 0;
  recipients: Recipient[] = [];

  icons: Record<IconName, SafeHtml> = {} as Record<IconName, SafeHtml>;

  supportedChains = [optimism, arbitrum, polygon, base, scroll, avalanche];
  supportedTokens = [
    {
      symbol: 'USDC',
      mapping: mcUSDC,
    },
    {
      symbol: 'USDT',
      mapping: mcUSDT,
    },
  ];
  selectedToken = this.supportedTokens[0].symbol;

  ngOnInit() {
    // Sanitize all icons
    (Object.keys(this.stringIcons) as IconName[]).forEach((key) => {
      this.icons[key] = this.sanitizer.bypassSecurityTrustHtml(
        this.stringIcons[key]
      );
    });
  }

  address$ = this.blockchainService.address$;
  account$ = this.blockchainService.account$.pipe(
    map((x) => x?.getAddress(optimism.id))
  );

  usdcBalance$ = this.address$.pipe(
    switchMap((address) =>
      address !== null
        ? this.blockchainService.getUnifiedBalance(
            this.blockchainService.mcUSDC,
            address
          )
        : of(null)
    )
  );

  usdtBalance$ = this.address$.pipe(
    switchMap((address) =>
      address !== null
        ? this.blockchainService.getUnifiedBalance(mcUSDT, address)
        : of(null)
    )
  );

  constructor(
    private blockchainService: BlockchainService,
    private sanitizer: DomSanitizer,
    private acrossService: AcrossService
  ) {}

  addRecipient() {
    this.recipients.push({
      address: null,
      chain: this.sourceChain,
      amount: null,
    });
  }

  removeRecipient(index: number) {
    this.recipients.splice(index, 1);
  }

  exportToJson() {
    const data = {
      sourceChain: this.sourceChain,
      token: this.selectedToken,
      totalAmount: this.totalAmount,
      recipients: this.recipients,
    };
    console.log('Exporting to JSON', data);
    // Here you would implement the actual export logic
  }

  importFromJson() {
    console.log('Importing from JSON');
    // Here you would implement the actual import logic
  }

  calculateTotal() {
    return this.recipients
      .map((recipient) => recipient.amount)
      .filter((amount) => amount !== null)
      .map((amount) => parseFloat(amount!.toString()))
      .reduce((acc, amount) => acc + amount, 0)
      .toFixed(2);
  }

  calculateTotalAmount() {
    const amount = this.recipients
      .map((recipient) => recipient.amount)
      .filter((amount) => amount !== null)
      .map((amount) => parseFloat(amount!.toString()))
      .reduce((acc, amount) => acc + amount, 0);
    return parseUnits(amount.toString(), 6);
  }

  getUnifiedBalances() {}

  toggleDropdown(key: string) {
    this.dropdowns[key] = !this.dropdowns[key];
  }

  closeDropdown(key: string) {
    this.dropdowns[key] = false;
  }

  selectChain(chain: Chain) {
    this.sourceChain = chain;
    this.closeDropdown('sourceChain');
  }

  selectToken(token: string) {
    this.selectedToken = token;
    this.closeDropdown('selectedToken');
  }

  selectRecipientChain(index: number, chain: Chain) {
    this.recipients[index].chain = chain;
    this.closeDropdown('chain' + index);
  }

  isDispersing = false;
  async disperse() {
    this.isDispersing = true;
    const klaster = this.blockchainService.klaster;
    if (!klaster) {
      alert('Klaster not initialized');
      this.isDispersing = false;
      return;
    }

    const usdcBalance = await firstValueFrom(this.usdcBalance$);
    if (!usdcBalance) {
      alert(`Can't fetch balance for USDC`);
      this.isDispersing = false;
      return;
    }
    const balanceSourceChain = this.getBalanceForChainAmount(
      this.sourceChain.id,
      usdcBalance
    );
    const total = this.calculateTotalAmount();
    if (balanceSourceChain < total) {
      alert(`Not enough ${this.selectedToken} on ${this.sourceChain.name}. 
        Required: ${this.calculateTotal()}, available: ${this.getBalanceForChain(
        this.sourceChain.id,
        usdcBalance
      )}`);
      this.isDispersing = false;
      return;
    }
    const txs = await Promise.all(
      this.recipients.map(async (recipient) => {
        const dest = getTokenAddressForChainId(
          this.blockchainService.mcUSDC,
          recipient.chain.id
        );

        const sourceToken = getTokenAddressForChainId(
          this.blockchainService.mcUSDC,
          this.sourceChain.id
        );

        if (!dest || !sourceToken || !recipient.amount) {
          console.error(`Can't fetch token 
            for chain ${recipient.chain.id}`);
          this.isDispersing = false;
          throw Error('Error');
        }

        const bridingTxs = await this.acrossService.acrossBridgePlugin({
          account: klaster.account,
          amount: parseUnits(recipient.amount.toString(), 6),
          destinationChainId: recipient.chain.id,
          destinationToken: dest,
          sourceChainId: this.sourceChain.id,
          sourceToken: sourceToken,
        });

        const sendTx = rawTx({
          to: dest,
          gasLimit: 100000n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'transfer',
            args: [recipient.address!, bridingTxs.receivedOnDestination!],
          }),
        });

        this.isDispersing = false;
        return {
          bridge: bridingTxs.txBatch,
          send: singleTx(recipient.chain.id, sendTx),
        };
      })
    );

    const iTx = buildItx({
      steps: txs.map((x) => x.bridge).concat(txs.map((x) => x.send)),
      feeTx: klaster.encodePaymentFee(this.sourceChain.id, 'USDC'),
    });

    const address = this.blockchainService.addressSub.value;
    if (!address) {
      return;
    }

    const quote = await klaster.autoExecute(iTx, async (hash) => {
      return await this.blockchainService.client.signMessage({
        message: {
          raw: hash,
        },
        account: address,
      });
    });

    alert(quote.itxHash);
  }

  getBalanceForChain(chainId: number, balance: UnifiedBalanceResult) {
    const balanceOnChain = balance.breakdown.find(
      (x) => x.chainId === chainId
    )?.amount;
    if (!balanceOnChain) {
      return '0.00';
    }
    return formatUnits(balanceOnChain, 6);
  }

  getBalanceForChainAmount(chainId: number, balance: UnifiedBalanceResult) {
    const balanceOnChain = balance.breakdown.find(
      (x) => x.chainId === chainId
    )?.amount;
    if (!balanceOnChain) {
      return 0n;
    }
    return balanceOnChain;
  }

  isConnecting = false;
  async connect() {
    this.isConnecting = true;
    await this.blockchainService.connect();
    this.isConnecting = false;
  }
}
