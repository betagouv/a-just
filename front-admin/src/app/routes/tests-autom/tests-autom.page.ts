import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';

@Component({
  standalone: true,
  imports: [CommonModule, WrapperComponent],
  templateUrl: './tests-autom.page.html',
  styleUrls: ['./tests-autom.page.scss'],
})
export class TestsAutomPage {}
