import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppRoutingModule } from './routes/app-routing.module'
import { AppComponent } from './app.component'
import { HttpClientModule } from '@angular/common/http'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AlertComponent } from './components/alert/alert.component'
import { PopupModule } from './components/popup/popup.module'
import { PipesModule } from './pipes/pipes.module'

/**
 * Module principal du projet
 */

@NgModule({
  declarations: [AppComponent, AlertComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    PipesModule,
    PopupModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
