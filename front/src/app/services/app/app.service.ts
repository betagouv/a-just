import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { AlertInterface } from 'src/app/interfaces/alert'

@Injectable({
  providedIn: 'root',
})
export class AppService {
  alert: BehaviorSubject<AlertInterface | null> = new BehaviorSubject<AlertInterface | null>(
    null
  )
}
