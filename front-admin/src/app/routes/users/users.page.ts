import { Component, OnDestroy, OnInit } from '@angular/core';
import { MainClass } from 'src/app/libs/main-class';

@Component({
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage extends MainClass implements OnInit, OnDestroy {
  constructor() {
    super();
  }

  ngOnInit() {}

  ngOnDestroy() {}
}
