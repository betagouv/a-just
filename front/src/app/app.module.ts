import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { AppRoutingModule } from './routes/app-routing.module'
import { AppComponent } from './app.component'
import { HttpClientModule } from '@angular/common/http'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AlertComponent } from './components/alert/alert.component'
import { PopupModule } from './components/popup/popup.module'
import { PipesModule } from './pipes/pipes.module'
import { ReaffectatorModule } from './routes/reaffectator/reaffectator.module'
import { SimulatorModule } from './routes/simulator/simulator.module';
import { AverageEtpDisplayerModule } from './routes/average-etp/average-etp-displayer/average-etp-displayer.module'
import { BigLoaderModule } from './components/big-loader/big-loader.module'

/**
 * Module principal du projet
 */
@NgModule({
  declarations: [AppComponent, AlertComponent],
  imports: [
    BigLoaderModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    PipesModule,
    PopupModule,
    ReaffectatorModule,
    SimulatorModule,
    AverageEtpDisplayerModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
