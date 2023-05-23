import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { JuridictionsInstalledPage } from './juridictions-installed.page'
import { JuridictionsInstalledPageModule } from './juridictions-installed.routing'

@NgModule({
  declarations: [JuridictionsInstalledPage],
  imports: [
    JuridictionsInstalledPageModule,
    RouterModule,
  ],
})
export class JuridictionsInstalledModule {}
