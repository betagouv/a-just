import { NgModule } from '@angular/core'
import { TextEditorModule } from 'src/app/components/text-editor/text-editor.module';
import { CommonModule } from '@angular/common';
import { PassedCommentComponent } from './passed-comment.component';


@NgModule({
  declarations: [PassedCommentComponent],
  imports: [TextEditorModule, CommonModule],
  exports: [PassedCommentComponent],
})
export class PassedCommentModule { }
