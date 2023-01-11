import { NgModule } from '@angular/core';
import { UcFirstPipe } from './uc-first/uc-first.pipes';
import { SanitizeStylePipe } from './sanitize-style/sanitize-style.pipe';
import { SanitizeHtmlPipe } from './sanitize-html/sanitize-html.pipe';
import { SanitizeUrlPipe } from './sanitize-url/sanitize-url.pipe';
import { SanitizeResourceUrlPipe } from './sanitize-resource-url/sanitize-resource-url.pipe';

/**
 * Liste des pipes 
 */
const list = [ UcFirstPipe, SanitizeStylePipe, SanitizeHtmlPipe, SanitizeUrlPipe, SanitizeResourceUrlPipe ];

/**
 * Module d'export des pipes
 */
@NgModule({
	declarations: [ ...list ],
	exports: list
})
export class PipesModule {}
