import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { AppRoutingModule } from './routes/app-routing.module'
import { AppComponent } from './app.component'
import { HttpClientModule } from '@angular/common/http'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AlertComponent } from './components/alert/alert.component'
import { PopupModule } from './components/popup/popup.module'
import { PipesModule } from './pipes/pipes.module'
import { MaterialModule } from './libs/material.module'
import { ReaffectatorModule } from './routes/reaffectator/reaffectator.module'

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
    ReaffectatorModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
