import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { basicEtptData } from 'src/app/constants/etpt-calculation';
import { CalculatriceInterface } from 'src/app/interfaces/calculatrice';

const periodicDataMagistrat = {
  jour:208,
  semaine:41.6,
  mois:12,
  an:1
}
const periodicDataFonctionnaire = {
  jour:229.57 ,
  semaine:45.91 ,
  mois:12,
  an:1
}

@Injectable({
  providedIn: 'root'
})
export class CalculatriceService {
  dataCalculatrice: BehaviorSubject<CalculatriceInterface>= new BehaviorSubject<CalculatriceInterface>({ 
    vacation : { value : null, option:'semaine',unit: null},
    volume : { value : null, option:'semaine'},
    selectedTab : 'vacation'
  });
  constructor() {}

  computeEtptForumla1(category:string){
    if (category === 'mag') {
      // DISSOCIER LES DIFFERENTES POSSIBILITES POUR JOUR SEMAINE AN
      const option = this.dataCalculatrice.value.vacation.option
      const x = ((Number(this.dataCalculatrice.value.vacation.unit)||0)/basicEtptData.nbHoursPerDayAndMagistrat)*(Number(this.dataCalculatrice.value.vacation.unit)||0)*periodicDataMagistrat['semaine']/basicEtptData.nbDaysByMagistrat
    } else if (category ==='fonc') {
      const x = ((Number(this.dataCalculatrice.value.vacation.unit)||0)/basicEtptData.nbHoursPerDayAndFonctionnaire)*(Number(this.dataCalculatrice.value.vacation.unit)||0)*periodicDataFonctionnaire['semaine']/basicEtptData.nbDaysByMagistrat
    }
    
  }
}
