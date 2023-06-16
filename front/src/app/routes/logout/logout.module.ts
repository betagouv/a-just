import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LogoutPage } from './logout.page';
import { LogoutPageModule } from './logout.routing';

@NgModule({
	declarations: [ LogoutPage ],
	imports: [ LogoutPageModule, RouterModule ]
})
export class LogoutModule {}
