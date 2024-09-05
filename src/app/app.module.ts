// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { HeroIconComponent } from './hero-icon/hero-icon.component';
import { IconService } from './icon.service';
import { ChainIconComponent } from './chain-icon/chain-icon.component';
import { TokenIconComponent } from './token-icon/token-icon.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent, HeroIconComponent, ChainIconComponent, TokenIconComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [IconService],
  bootstrap: [AppComponent]
})
export class AppModule { }