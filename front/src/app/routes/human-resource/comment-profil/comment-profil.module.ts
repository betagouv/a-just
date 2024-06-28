import { NgModule } from '@angular/core'
import { CommentProfilComponent } from './comment-profil.component';
import { TextEditorModule } from 'src/app/components/text-editor/text-editor.module';
import { CommonModule } from '@angular/common';
import { PassedCommentModule } from './passed-comment/passed-comment.module';
import { MaterialModule } from 'src/app/libs/material.module';

@NgModule({
  declarations: [CommentProfilComponent],
  imports: [TextEditorModule, CommonModule, PassedCommentModule, MaterialModule],
  exports: [CommentProfilComponent],
})
export class CommentProfilModule { }
