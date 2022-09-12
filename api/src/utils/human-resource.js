import { minBy, sumBy } from 'lodash';
import { today } from '../utils/date';

export function getEtpByDateAndPerson(referentielId, date, hr) {
  const { currentSituation /*, nextSituation*/ } = findSituation(hr, date);
  const situation = currentSituation;

  if (situation && situation.category && situation.category.id) {
    const activitiesFiltred = (situation.activities || []).filter(
      (a) => a.contentieux && a.contentieux.id === referentielId
    );
    const indispoFiltred = findAllIndisponibilities(hr, date);
    let reelEtp = situation.etp - sumBy(indispoFiltred, 'percent') / 100;
    if (reelEtp < 0) {
      reelEtp = 0;
    }

    //const nextIndispoDate = getNextIndisponiblitiesDate(hr, date)
    let nextDeltaDate = null;
    /*if(nextSituation) {
      nextDeltaDate = today(nextSituation.dateStart)
    }
    if(nextIndispoDate && (!nextDeltaDate || nextIndispoDate.getTime() < nextDeltaDate.getTime())) {
      nextDeltaDate = nextIndispoDate
    }*/

    return {
      etp: (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100,
      situation,
      indispoFiltred,
      nextDeltaDate, // find the next date with have changes
    };
  }

  return {
    etp: null,
    situation: null,
    indispoFiltred: [],
    nextDeltaDate: null,
  };
}

export async function getEtpByDateAndPersonSimu(referentielId, date, hr) {
  const { currentSituation: situation, nextSituation } = findSituation(hr, date);

  if (situation && situation.category && situation.category.id) {
    const activitiesFiltred = (situation.activities || []).filter(
      (a) => a.contentieux && a.contentieux.id === referentielId
    );

    const indispoFiltred = findAllIndisponibilities(hr, date);
    let reelEtp = situation.etp - sumBy(indispoFiltred, 'percent') / 100;
    if (reelEtp < 0) {
      reelEtp = 0;
    }

    const nextIndispoDate = getNextIndisponiblitiesDate(hr, date);
    let nextDeltaDate = null;
    if (nextSituation) {
      nextDeltaDate = today(nextSituation.dateStart);
    }
    if (
      nextIndispoDate &&
      (!nextDeltaDate || nextIndispoDate.getTime() < nextDeltaDate.getTime())
    ) {
      nextDeltaDate = nextIndispoDate;
    }

    return {
      etp: (reelEtp * sumBy(activitiesFiltred, 'percent')) / 100,
      situation,
      indispoFiltred,
      nextDeltaDate, // find the next date with have changes
    };
  }

  return {
    etp: null,
    situation: null,
    indispoFiltred: [],
    nextDeltaDate: null,
  };
}

export const getNextIndisponiblitiesDate = (hr, dateSelected) => {
  dateSelected = today(dateSelected).getTime();
  const indispos = hr.indisponibilities || [];
  let listAllDates = indispos
    .filter((i) => i.dateStartTimesTamps)
    .map((i) => i.dateStartTimesTamps);
  listAllDates = listAllDates.concat(
    indispos.filter((i) => i.dateStopTimesTamps).map((i) => i.dateStopTimesTamps)
  );

  listAllDates = listAllDates.filter((date) => date > dateSelected);

  const min = minBy(listAllDates);
  return min ? new Date(min) : null;
};

export const findSituation = (hr, date) => {
  if (date) {
    date = today(date);
  }

  if (hr && hr.dateEnd && date) {
    // control de date when the person goone
    const dateEnd = today(hr.dateEnd);
    if (dateEnd.getTime() < date.getTime()) {
      return {
        id: 0,
        etp: 0,
        category: null,
        fonction: null,
        dateStart: dateEnd,
        activities: [],
      };
    }
  }
  let situations = findAllSituations(hr, date);
  return {
    currentSituation: situations.length ? situations[0] : null,
    nextSituation: null,
  };
  /*let situations = findAllFuturSituations(hr, date)
  return {
    currentSituation: situations.length ? situations[situations.length - 1] : null,
    nextSituation: situations.length > 1 ? situations[situations.length - 2] : null,
  }*/
};

export const findAllFuturSituations = (hr, date) => {
  date = today(date);
  let situations = hr && hr.situations && hr.situations.length ? hr.situations : [];

  if (date) {
    const getTime = date.getTime();
    const findedSituations = situations.filter((hra) => {
      return hra.dateStartTimesTamps >= getTime;
    });

    if (situations.length !== findedSituations.length) {
      if (
        findedSituations.length &&
        today(findedSituations[0].dateStart).getTime() !== date.getTime()
      ) {
        situations = findedSituations.slice(0);
      } else {
        situations = situations.slice(0, findedSituations.length + 1);
      }
    }
  }

  return situations;
};

export const findAllSituations = (hr, date) => {
  let situations = hr && hr.situations && hr.situations.length ? hr.situations : [];

  if (date) {
    situations = situations.filter((hra) => {
      const dateStart = today(hra.dateStart);
      return dateStart.getTime() <= date.getTime();
    });
  }

  return situations;
};

const findAllIndisponibilities = (hr, date) => {
  let indisponibilities =
    hr && hr.indisponibilities && hr.indisponibilities.length ? hr.indisponibilities : [];
  //if (indisponibilities.length > 0) console.log('here 1', date, indisponibilities);
  if (date instanceof Date) {
    date = today(date);
    indisponibilities = indisponibilities.filter((hra) => {
      const dateStart = today(hra.dateStart);
      if (date && dateStart.getTime() <= date.getTime()) {
        if (hra.dateStop) {
          const dateStop = today(hra.dateStop);
          if (dateStop.getTime() >= date.getTime()) {
            return true;
          }
        } else {
          // return true if they are no end date
          return true;
        }
      }

      return false;
    });
  }
  //if (indisponibilities.length > 0) console.log('here 2', indisponibilities);

  return indisponibilities;
};
