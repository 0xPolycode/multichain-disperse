import { Injectable } from "@angular/core";
import { AccountInitData, Address, BiconomyV2AccountInitData, buildMultichainReadonlyClient, buildTokenMapping, 
  deployment, 
  initKlaster, klasterNodeHost, KlasterSDK, loadBicoV2Account, 
  MultichainAccount, 
  MultichainTokenMapping} from "klaster-sdk";
import { BehaviorSubject } from "rxjs";
import { createWalletClient, custom } from "viem";
import { arbitrum, avalanche, base, optimism, polygon, scroll } from 'viem/chains'



@Injectable({
  providedIn: 'root'
})
export class BlockchainService {

  klaster?: KlasterSDK<BiconomyV2AccountInitData>
  client = createWalletClient({
    transport: custom((window as any).ethereum)
  })

  mClient = buildMultichainReadonlyClient(
    [optimism, base, arbitrum, polygon, scroll, avalanche].map(chain => {
      return {
        chainId: chain.id,
        rpcUrl: chain.rpcUrls.default.http[0]
      }
    })
  )

  addressSub = new BehaviorSubject<Address | null>(null)
  address$ = this.addressSub.asObservable()

  private accountSub = new BehaviorSubject<MultichainAccount | null>(null)
  account$ = this.accountSub.asObservable()

  constructor() {
  }

  async connect() {
    const request = await this.client.requestAddresses()
    await this.initKlaster()
  }

  async initKlaster() {

    const [address] = await this.client.getAddresses()

    this.klaster = await initKlaster({
      accountInitData: loadBicoV2Account({
        owner: address
      }),
      nodeUrl: klasterNodeHost.default
    })

    this.addressSub.next(address)
    this.accountSub.next(this.klaster.account)

  }

  mcUSDC = buildTokenMapping([
    deployment(optimism.id, '0x0b2c639c533813f4aa9d7837caf62653d097ff85'),
    deployment(base.id, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
    deployment(avalanche.id, '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'),
    deployment(polygon.id, '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359'),
    deployment(arbitrum.id, '0xaf88d065e77c8cC2239327C5EDb3A432268e5831')
  ])

  async getUnifiedBalance(token: MultichainTokenMapping, address?: Address) {

    if(!address) { console.log('Address is null'); return }

    const acc = this.addressSub.value!
    const fakeData = new BiconomyV2AccountInitData({
      owner: acc
    })
    
    return this.mClient.getUnifiedErc20Balance({
      account: this.klaster!.account,
      tokenMapping: token
    })
  }

}