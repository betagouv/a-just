import { sortBy, sumBy } from 'lodash';
import { getEtpByDateAndPerson } from '../constants/human-resource';
import { filterActivitiesByDateAndContentieuxId } from './activities';
import { getRangeOfMonthsAsObject, getShortMonthString, isSameMonthAndYear, month } from './date';
import { fixDecimal } from './number';

const emptySituation = {
  totalIn: null,
  totalOut: null,
  lastStock: null,
  realCoverage: null,
  realDTESInMonths: null,
  realTimePerCase: null,
  etpMag: null,
  etpFon: null,
  etpCont: null,
  etpAffected: null,
  etpToCompute: null,
};

export async function getSituation(referentielId, hr, allActivities, categories) {
  const nbMonthHistory = 12;
  const { activities, lastActivities, deltaOfMonths, startDateCs, endDateCs } =
    await getCSActivities(
      referentielId,
      allActivities,
      'InOutStock',
      month(new Date(), -nbMonthHistory),
      month(new Date(), -1, 'lastday')
    );

  let totalIn = Math.floor(sumBy(activities, 'entrees') / nbMonthHistory);
  let totalOut = Math.floor(sumBy(activities, 'sorties') / nbMonthHistory);
  let lastStock = sumBy(lastActivities, 'stock');

  if (activities.length === 0) return emptySituation;
  else {
    let etpAffected = await getHRPositions(hr, referentielId, categories);
    return { etpAffected, activities, deltaOfMonths, totalIn, totalOut, lastStock };
  }
  return {
    totalIn,
    totalOut,
    lastStock,
    activities,
    lastActivities,
    deltaOfMonths,
    startDateCs,
    endDateCs,
  };
}

/**
 * Get the Current Situations Activities of the last 12 months available
 * @param {*} referentielId
 * @param {*} allActivities
 * @param {*} filter
 * @param {*} dateStart
 * @param {*} dateStop
 * @returns
 */
export async function getCSActivities(referentielId, allActivities, filter, dateStart, dateStop) {
  const activities = sortBy(
    allActivities.filter((activity) => activity.contentieux.id === referentielId),
    'periode'
  ).reverse();

  let deltaOfMonths = 1;
  let activivitiesFiltered = [];
  let lastActivities = [];

  if (filter === 'InOutStock') {
    do {
      deltaOfMonths--;
      lastActivities = activities.filter((a) =>
        isSameMonthAndYear(a.periode, month(dateStop, deltaOfMonths))
      );
    } while (hasInOutOrStock(lastActivities) === false && deltaOfMonths >= -12);
  }
  const startDateCs = month(dateStart, deltaOfMonths);
  const endDateCs = month(dateStop, deltaOfMonths);

  if (deltaOfMonths !== -12 && deltaOfMonths !== 0) {
    activivitiesFiltered = await filterActivitiesByDateAndContentieuxId(
      activities,
      referentielId,
      startDateCs,
      endDateCs
    );
  }

  return {
    activities: activivitiesFiltered.reverse(),
    lastActivities,
    deltaOfMonths,
    startDateCs,
    endDateCs,
  };
}

export function hasInOutOrStock(activities) {
  let hasIn = false;
  let hasOut = false;
  let hasStock = false;

  if (activities.length !== 0)
    activities.map((activity) => {
      if (activity.entrees && activity.entrees !== 0) hasIn = true;
      if (activity.sorties && activity.sorties !== 0) hasOut = true;
      if (activity.stock && activity.stock !== 0) hasStock = true;
    });

  return hasIn && hasOut && hasStock;
}

export async function getHRPositions(
  hr,
  referentielId,
  categories,
  date = undefined,
  onPeriod = false,
  dateStop = undefined,
  monthlyReport = false
) {
  const hrCategories = {};
  let hrCategoriesMonthly = new Object({});
  let emptyList = new Object({});

  if (monthlyReport) {
    emptyList = { ...getRangeOfMonthsAsObject(date, dateStop, true) };

    Object.keys(emptyList).map((x) => {
      emptyList[x] = {
        ...{
          etpt: 0,
        },
      };
    });
  }

  categories.map((c) => {
    hrCategories[c.label] = hrCategories[c.label] || {
      totalEtp: 0,
      list: [],
      rank: c.rank,
    };

    if (monthlyReport) {
      hrCategoriesMonthly[c.label] = {
        ...JSON.parse(JSON.stringify(emptyList)),
      };
    }
  });

  for (let i = 0; i < hr.length; i++) {
    let etptAll,
      monthlyList = null;
    if (onPeriod === true) {
      ({ etptAll, monthlyList } = {
        ...getHRVentilationOnPeriod(
          hr[i],
          referentielId,
          categories,
          date instanceof Date ? date : undefined,
          dateStop instanceof Date ? dateStop : undefined
        ),
      });
    } else {
      etptAll = await getHRVentilation(
        hr[i],
        referentielId,
        categories,
        date instanceof Date ? date : undefined
      );
      console.log(etptAll);
    }

    Object.values(etptAll).map((c) => {
      if (c.etpt) {
        hrCategories[c.label].list.push(hr[i]);
        hrCategories[c.label].totalEtp += c.etpt;
      }

      if (onPeriod === true && dateStop) {
        Object.keys(monthlyList).map((month) => {
          if (c.label === monthlyList[month][c.id].name)
            hrCategoriesMonthly[c.label][month].etpt += monthlyList[month][c.id].etpt;
        });
      }
    });
  }

  const list = [];
  const listMonthly = [];
  for (const [key, value] of Object.entries(hrCategories)) {
    list.push({
      name: key,
      // @ts-ignore
      totalEtp: fixDecimal(value.totalEtp || 0),
      // @ts-ignore
      rank: value.rank,
    });

    if (monthlyReport) {
      let tmpObj = [];

      Object.keys(hrCategoriesMonthly[key]).map((x) => {
        hrCategoriesMonthly[key][x].etpt = fixDecimal(hrCategoriesMonthly[key][x].etpt || 0);

        tmpObj.push({
          ...{
            name: x,
            // @ts-ignore
            etpt: fixDecimal(hrCategoriesMonthly[key][x].etpt || 0),
          },
        });
      });

      listMonthly.push({
        name: key,
        // @ts-ignore
        values: { ...tmpObj },
      });
    }
  }

  console.log('laliste', list);
  if (monthlyReport) {
    return {
      fururEtpAffectedToCompute: sortBy(list, 'rank'),
      monthlyReport: listMonthly,
    };
  } else return sortBy(list, 'rank');
}

export function getHRVentilationOnPeriod(
  hr,
  referentielId,
  categories,
  dateStart = undefined,
  dateStop = undefined
) {
  const list = {};
  let monthlyList = {};

  if (dateStart && dateStop) {
    monthlyList = {
      ...getRangeOfMonthsAsObject(dateStart, dateStop, true),
    };
  }

  categories.map((c) => {
    list[c.id] = {
      etpt: 0,
      ...c,
    };

    Object.keys(monthlyList).map((x) => {
      monthlyList[x][c.id] = {
        name: c.label,
        etpt: 0,
        nbOfDays: 0,
      };
    });
  });

  const now = dateStart instanceof Date ? new Date(dateStart) : new Date();
  const stop = dateStop instanceof Date ? new Date(dateStop) : new Date();

  let nbDay = 0;
  let monthDaysCounter = 0;
  do {
    if (isFirstDayOfMonth(now)) monthDaysCounter = 0;

    if (workingDay(now)) {
      // only working day
      nbDay++;
      monthDaysCounter++;
      const { etp, situation } = getEtpByDateAndPerson(referentielId, now, hr);

      if (etp !== null) {
        // @ts-ignore
        list[situation.category.id].etpt += etp;

        const str = getShortMonthString(now) + now.getFullYear().toString().slice(-2);

        // @ts-ignore
        monthlyList[str][situation.category.id].etpt += etp;
        // @ts-ignore
        monthlyList[str][situation.category.id].nbOfDays = monthDaysCounter;
        // @ts-ignore
      }
    }
    now.setDate(now.getDate() + 1);
  } while (now.getTime() <= stop.getTime());

  // format render
  for (const property in list) {
    list[property].etpt = list[property].etpt / nbDay;
    Object.keys(monthlyList).map((x) => {
      if (monthlyList[x][property].nbOfDays !== 0)
        monthlyList[x][property].etpt =
          monthlyList[x][property].etpt / monthlyList[x][property].nbOfDays;
    });
  }

  return { etptAll: list, monthlyList: { ...monthlyList } };
}

export async function getHRVentilation(hr, referentielId, categories, date) {
  const list = {};
  categories.map((c) => {
    list[c.id] = {
      etpt: 0,
      ...c,
    };
  });

  const now = date ? date : new Date();
  const { etp, situation } = await getEtpByDateAndPerson(referentielId, now, hr);
  console.log('l ETP', etp, situation);
  if (etp !== null) {
    // @ts-ignore
    list[situation.category.id].etpt += etp;
  }

  // format render
  for (const property in list) {
    list[property].etpt = list[property].etpt / 1;
  }

  return list;
}
