import { sortBy, sumBy } from 'lodash';
import { isSameMonthAndYear, month, workingDay } from '../utils/date';
import { fixDecimal } from '../utils/number';
import config from 'config';
import { getEtpByDateAndPerson } from './human-resource';

export const emptyCalulatorValues = (referentiels) => {
  const list = [];
  for (let i = 0; i < referentiels.length; i++) {
    const childrens = (referentiels[i].childrens || []).map((c) => {
      const cont = { ...c, parent: referentiels[i] };

      return {
        totalIn: null,
        totalOut: null,
        lastStock: null,
        etpMag: null,
        etpFon: null,
        etpCont: null,
        realCoverage: null,
        realDTESInMonths: null,
        realTimePerCase: null,
        calculateCoverage: null,
        calculateDTESInMonths: null,
        calculateTimePerCase: null,
        calculateOut: null,
        etpAffected: [],
        childrens: [],
        contentieux: cont,
        nbMonth: 0,
      };
    });

    list.push({
      totalIn: null,
      totalOut: null,
      lastStock: null,
      etpMag: null,
      etpFon: null,
      etpCont: null,
      realCoverage: null,
      realDTESInMonths: null,
      realTimePerCase: null,
      calculateCoverage: null,
      calculateDTESInMonths: null,
      calculateTimePerCase: null,
      calculateOut: null,
      etpAffected: [],
      childrens,
      contentieux: referentiels[i],
      nbMonth: 0,
    });
  }

  return list;
};

export const syncCalculatorDatas = (
  list,
  nbMonth,
  activities,
  dateStart,
  dateStop,
  hr,
  categories,
  optionsBackups
) => {
  for (let i = 0; i < list.length; i++) {
    const childrens = (list[i].childrens || []).map((c) => ({
      ...c,
      nbMonth,
      ...getActivityValues(
        dateStart,
        dateStop,
        activities,
        c.contentieux.id,
        nbMonth,
        hr,
        categories,
        optionsBackups
      ),
    }));

    list[i] = {
      ...list[i],
      ...getActivityValues(
        dateStart,
        dateStop,
        activities,
        list[i].contentieux.id,
        nbMonth,
        hr,
        categories,
        optionsBackups
      ),
      childrens,
      nbMonth,
    };
  }

  return list;
};

const getActivityValues = (
  dateStart,
  dateStop,
  activities,
  referentielId,
  nbMonth,
  hr,
  categories,
  optionsBackups
) => {
  activities = sortBy(
    activities.filter(
      (a) =>
        a.contentieux.id === referentielId &&
        month(a.periode).getTime() >= month(dateStart).getTime() &&
        month(a.periode).getTime() <= month(dateStop).getTime()
    ),
    'periode'
  );
  const totalIn = Math.floor(sumBy(activities, 'entrees') / nbMonth);
  const totalOut = Math.floor(sumBy(activities, 'sorties') / nbMonth);
  let lastStock = null;
  if (activities.length) {
    const lastActivities = activities[activities.length - 1];
    if (lastActivities.stock !== null && isSameMonthAndYear(lastActivities.periode, dateStop)) {
      lastStock = lastActivities.stock;
    }
  }

  const realCoverage = fixDecimal(totalOut / totalIn);
  const realDTESInMonths = lastStock !== null ? fixDecimal(lastStock / totalOut) : null;

  const etpAffected = getHRPositions(hr, categories, referentielId, dateStart, dateStop);
  const etpMag = etpAffected.length > 0 ? fixDecimal(etpAffected[0].totalEtp, 1000) : 0;
  const etpFon = etpAffected.length > 1 ? fixDecimal(etpAffected[1].totalEtp, 1000) : 0;
  const etpCont = etpAffected.length > 2 ? fixDecimal(etpAffected[2].totalEtp, 1000) : 0;

  // Temps moyens par dossier observé = (nb heures travaillées par mois) / (sorties moyennes par mois / etpt sur la periode)
  const realTimePerCase = fixDecimal(
    ((config.nbDaysByMagistrat / 12) * config.nbHoursPerDay) / (totalOut / etpMag)
  );

  return {
    ...calculateActivities(referentielId, totalIn, lastStock, etpMag, optionsBackups),
    totalIn,
    totalOut,
    lastStock,
    realCoverage,
    realDTESInMonths,
    realTimePerCase,
    etpMag,
    etpFon,
    etpCont,
    etpAffected,
  };
};

const getHRPositions = (hr, categories, referentielId, dateStart, dateStop) => {
  const hrCategories = {};

  categories.map((c) => {
    hrCategories[c.label] = hrCategories[c.label] || {
      totalEtp: 0,
      list: [],
      rank: c.rank,
    };
  });

  for (let i = 0; i < hr.length; i++) {
    const etptAll = getHRVentilation(hr[i], referentielId, categories, dateStart, dateStop);
    Object.values(etptAll).map((c) => {
      if (c.etpt) {
        hrCategories[c.label].list.push(hr[i]);
        hrCategories[c.label].totalEtp += fixDecimal(c.etpt, 1000);
      }
    });
  }

  const list = [];
  for (const [key, value] of Object.entries(hrCategories)) {
    list.push({
      name: key,
      // @ts-ignore
      totalEtp: value.totalEtp,
      // @ts-ignore
      rank: value.rank,
    });
  }

  return sortBy(list, 'rank');
};

export const getHRVentilation = (hr, referentielId, categories, dateStart, dateStop) => {
  const list = {};
  categories.map((c) => {
    list[c.id] = {
      etpt: 0,
      ...c,
    };
  });

  const now = new Date(dateStart);
  let nbDay = 0;
  do {
    // only working day
    if (workingDay(now)) {
      nbDay++;
      const { etp, situation } = getEtpByDateAndPerson(referentielId, now, hr);

      if (etp !== null) {
        // @ts-ignore
        list[situation.category.id].etpt += etp;
      }
    }
    now.setDate(now.getDate() + 1);
  } while (now.getTime() <= dateStop.getTime());

  // format render
  for (const property in list) {
    list[property].etpt = list[property].etpt / nbDay;
  }

  return list;
};

const calculateActivities = (referentielId, totalIn, lastStock, etpAffected, optionsBackups) => {
  let calculateTimePerCase = null;
  let calculateOut = null;
  let calculateCoverage = null;
  let calculateDTESInMonths = null;

  const findIndexOption = optionsBackups.findIndex((o) => o.contentieux.id === referentielId);

  if (findIndexOption !== -1) {
    calculateTimePerCase = optionsBackups[findIndexOption].averageProcessingTime;
  }

  if (calculateTimePerCase) {
    calculateOut = Math.floor(
      (((etpAffected * config.nbHoursPerDay) / calculateTimePerCase) * config.nbDaysByMagistrat) /
        12
    );
    calculateCoverage = fixDecimal(calculateOut / (totalIn || 0));
    calculateDTESInMonths = lastStock === null ? null : fixDecimal(lastStock / calculateOut);
  } else {
    calculateOut = null;
    calculateCoverage = null;
    calculateDTESInMonths = null;
  }

  return {
    calculateTimePerCase,
    calculateOut,
    calculateCoverage,
    calculateDTESInMonths,
  };
};
