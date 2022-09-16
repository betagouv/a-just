import { isFirstDayOfMonth } from 'date-fns';
import { sortBy, sumBy } from 'lodash';
import { filterActivitiesByDateAndContentieuxId } from './activities';
import {
  checkIfDateIsNotToday,
  decimalToStringDate,
  generalizeTimeZone,
  getRangeOfMonthsAsObject,
  getShortMonthString,
  isSameMonthAndYear,
  month,
  nbOfDays,
  stringToDecimalDate,
  workingDay,
} from './date';
import { fixDecimal } from './number';
import config from 'config';
import { getEtpByDateAndPersonSimu } from './human-resource';

export const environment = {
  nbDaysByMagistrat: config.nbDaysByMagistrat,
  nbDaysByMagistratPerMonth: config.nbDaysByMagistrat / 12,
  nbHoursPerDay: config.nbHoursPerDay,
};

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

export async function getSituation(
  referentielId,
  hr,
  allActivities,
  categories,
  dateStart = undefined,
  dateStop = undefined
) {
  const nbMonthHistory = 12;
  const { activities, lastActivities, deltaOfMonths, startDateCs, endDateCs } =
    await getCSActivities(
      referentielId,
      allActivities,
      'InOutStock',
      month(new Date(), -nbMonthHistory),
      month(new Date())
    );

  let totalIn = Math.floor(sumBy(activities, 'entrees') / nbMonthHistory);

  let totalOut = Math.floor(sumBy(activities, 'sorties') / nbMonthHistory);
  let lastStock = sumBy(lastActivities, 'stock');
  let realTimePerCase = undefined;
  let DTES = undefined;
  let Coverage = undefined;
  let etpAffectedAtStartDate = undefined;
  let etpAffectedToday = undefined;
  let etpMagToCompute = undefined;
  let etpFonToCompute = undefined;
  let etpContToCompute = undefined;
  let endSituation = undefined;
  let etpAffectedDeltaToCompute = undefined;
  let etpMagFuturToCompute = undefined;
  let etpFonFuturToCompute = undefined;
  let etpContFuturToCompute = undefined;
  let etpMagUntilStartDate = undefined;
  let etpFonUntilStartDate = undefined;
  let etpContUntilStartDate = undefined;

  if (activities.length === 0) return emptySituation;
  else {
    // Compute etpAffected & etpMag today (on specific date) to display & output
    etpAffectedToday = await getHRPositions(hr, referentielId, categories);
    let { etpMag, etpFon, etpCont } = getEtpByCategory(etpAffectedToday);

    // Compute etpAffected of the 12 last months starting at the last month available in db to compute realTimePerCase
    let etpAffectedLast12MonthsToCompute = await getHRPositions(
      hr,
      referentielId,
      categories,
      new Date(startDateCs),
      true,
      new Date(endDateCs)
    );

    ({ etpMagToCompute, etpFonToCompute, etpContToCompute } = getEtpByCategory(
      etpAffectedLast12MonthsToCompute,
      'ToCompute'
    ));

    // Compute realTimePerCase to display using the etpAffected 12 last months available
    realTimePerCase = computeRealTimePerCase(totalOut, etpMagToCompute);

    // Compute totalOut with etp today (specific date) to display
    totalOut = computeTotalOut(realTimePerCase, etpMag);

    // Projection of etpAffected between the last month available and today to compute stock
    let etpAffectedDeltaToCompute = await getHRPositions(
      hr,
      referentielId,
      categories,
      new Date(endDateCs),
      true,
      new Date()
    );

    ({ etpMagFuturToCompute, etpFonFuturToCompute, etpContFuturToCompute } = getEtpByCategory(
      etpAffectedDeltaToCompute,
      'FuturToCompute'
    ));

    const countOfCalandarDays = nbOfDays(month(endDateCs, 0), month(new Date(), 0));

    // Compute stock projection until today
    lastStock = computeLastStock(
      lastStock,
      countOfCalandarDays,
      etpMagFuturToCompute,
      realTimePerCase,
      totalIn
    );

    // Compute realCoverage & realDTESInMonths using last available stock
    Coverage = computeCoverage(totalOut, totalIn);
    DTES = computeDTES(lastStock, totalOut);

    if (checkIfDateIsNotToday(dateStart)) {
      const nbDayCalendar = nbOfDays(new Date(), new Date(dateStart));

      // Compute etpAffected & etpMag at dateStart (specific date) to display
      etpAffectedAtStartDate = await getHRPositions(
        hr,
        referentielId,
        categories,
        new Date(dateStart)
      );

      ({ etpMag, etpFon, etpCont } = getEtpByCategory(etpAffectedAtStartDate));

      // Compute totalOut with etp at dateStart (specific date) to display
      totalOut = computeTotalOut(realTimePerCase, etpMag);

      // Projection of etpAffected between the last month available and dateStart to compute stock
      etpAffectedDeltaToCompute = await getHRPositions(
        hr,
        referentielId,
        categories,
        new Date(),
        true,
        new Date(dateStart)
      );

      ({ etpMagUntilStartDate, etpFonUntilStartDate, etpContUntilStartDate } = getEtpByCategory(
        etpAffectedDeltaToCompute,
        'UntilStartDate'
      ));

      // Compute stock, coverage, dtes projection until dateStart
      lastStock = computeLastStock(
        lastStock,
        nbDayCalendar,
        etpMagUntilStartDate,
        realTimePerCase,
        totalIn
      );

      Coverage = computeCoverage(totalOut, totalIn);
      DTES = computeDTES(lastStock, totalOut);
    }
    if (dateStop) {
      const nbDayCalendarProjected = nbOfDays(new Date(dateStart), new Date(dateStop));

      // Compute projected etp at stop date (specific date) to display
      const projectedEtpAffected = await getHRPositions(hr, referentielId, categories, dateStop);

      let { etpMagProjected, etpFonProjected, etpContProjected } = getEtpByCategory(
        projectedEtpAffected,
        'Projected'
      );

      // Compute projected out flow with projected etp at stop date (specific date)
      const projectedTotalOut = computeTotalOut(realTimePerCase, etpMagProjected);

      // Projection of etpAffected between start and stop date to compute stock
      let { etpAffectedStartToEndToCompute, monthlyReport } = await getHRPositions(
        hr,
        referentielId,
        categories,
        dateStart,
        true,
        dateStop,
        true
      );

      let { etpMagStartToEndToCompute, etpFonStartToEndToCompute, etpContStartToEndToCompute } =
        getEtpByCategory(etpAffectedStartToEndToCompute, 'StartToEndToCompute');

      // Compute projectedStock with etp at datestop
      const projectedLastStock = computeLastStock(
        lastStock,
        nbDayCalendarProjected,
        etpMagStartToEndToCompute,
        realTimePerCase,
        totalIn
      );
      const projectedCoverage = computeCoverage(projectedTotalOut, totalIn);
      const projectedDTES = computeDTES(projectedLastStock, projectedTotalOut);

      endSituation = {
        totalIn,
        totalOut: projectedTotalOut,
        lastStock: projectedLastStock,
        realCoverage: projectedCoverage,
        realDTESInMonths: projectedDTES,
        realTimePerCase,
        etpMag: etpMagProjected,
        etpAffected: etpAffectedStartToEndToCompute,
        etpFon: etpFonStartToEndToCompute,
        etpCont: etpContStartToEndToCompute,
        calculateCoverage: null,
        calculateDTESInMonths: null,
        calculateTimePerCase: null,
        nbMonthHistory,
        etpToCompute: etpMagStartToEndToCompute,
        monthlyReport: monthlyReport,
      };
    }

    const tmpList = {
      etpMagFuturToCompute,
      countOfCalandarDays,
      etpAffectedDeltaToCompute,
      etpMagToCompute,
      etpAffectedToday,
      activities,
      deltaOfMonths,
    };

    return {
      //...tmpList,
      endSituation,
      totalIn,
      totalOut,
      lastStock,
      realCoverage: Coverage,
      realDTESInMonths: DTES,
      realTimePerCase,
      etpMag,
      etpFon,
      etpCont,
      etpAffected: etpAffectedAtStartDate || etpAffectedToday,
      etpToCompute: etpMagToCompute,
    };
  }
}

function computeCoverage(totalOut, totalIn) {
  return fixDecimal(totalOut / totalIn, 100);
}

function computeDTES(lastStock, totalOut) {
  return lastStock !== null && totalOut !== null ? fixDecimal(lastStock / totalOut, 100) : null;
}

function computeLastStock(lastStock, countOfCalandarDays, futurEtp, realTimePerCase, totalIn) {
  console.log({
    lastStock,
    countOfCalandarDays,
    futurEtp,
    realTimePerCase,
    totalIn,
    calculaterOut: Math.floor(
      (countOfCalandarDays / (365 / 12)) *
        environment.nbDaysByMagistratPerMonth *
        ((futurEtp * environment.nbHoursPerDay) / realTimePerCase)
    ),
    calculatedIn: Math.floor((countOfCalandarDays / (365 / 12)) * totalIn),
    stockUsed: Math.floor(lastStock),
  });
  return (
    Math.floor(lastStock) -
    Math.floor(
      (countOfCalandarDays / (365 / 12)) *
        environment.nbDaysByMagistratPerMonth *
        ((futurEtp * environment.nbHoursPerDay) / realTimePerCase)
    ) +
    Math.floor((countOfCalandarDays / (365 / 12)) * totalIn)
  );
}

function computeTotalOut(realTimePerCase, etp) {
  return Math.floor(
    (etp * environment.nbHoursPerDay * (environment.nbDaysByMagistrat / 12)) / realTimePerCase
  );
}

function computeRealTimePerCase(totalOut, etp) {
  let realTimeCorrectValue = fixDecimal(
    ((environment.nbDaysByMagistrat / 12) * environment.nbHoursPerDay) / (totalOut / etp),
    100
  );
  let realTimeCorrectvalueNotRounded =
    ((environment.nbDaysByMagistrat / 12) * environment.nbHoursPerDay) / (totalOut / etp);
  let realTimeDisplayed = decimalToStringDate(realTimeCorrectValue);
  let realTimeToUse = stringToDecimalDate(realTimeDisplayed);

  return realTimeToUse;
}

export function getEtpByCategory(etpAffected, sufix = '') {
  let etpMag = etpAffected.length >= 0 ? etpAffected[0].totalEtp : 0;
  let etpCont = etpAffected.length >= 0 ? etpAffected[1].totalEtp : 0;
  let etpFon = etpAffected.length >= 0 ? etpAffected[2].totalEtp : 0;

  return { ['etpMag' + sufix]: etpMag, ['etpFon' + sufix]: etpFon, ['etpCont' + sufix]: etpCont };
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

  let deltaOfMonths = 0;
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
  const endDateCs = generalizeTimeZone(month(dateStop, deltaOfMonths, 'lastday'));

  if (deltaOfMonths !== -12 && deltaOfMonths <= 0) {
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

export function appearOneTimeAtLeast(situations, referentielId) {
  return situations.some((s) => {
    const activities = s.activities || [];
    return activities.some((a) => a.contentieux.id === referentielId);
  });
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

  emptyList = { ...getRangeOfMonthsAsObject(date, dateStop, true) };

  Object.keys(emptyList).map((x) => {
    emptyList[x] = {
      ...{
        etpt: 0,
      },
    };
  });

  categories.map((c) => {
    hrCategories[c.label] = hrCategories[c.label] || {
      totalEtp: 0,
      list: [],
      rank: c.rank,
    };
    hrCategoriesMonthly[c.label] = {
      ...JSON.parse(JSON.stringify(emptyList)),
    };
  });

  for (let i = 0; i < hr.length; i++) {
    let etptAll = [];
    let monthlyList = null;
    const situations = hr[i].situations || [];

    if (onPeriod === true && appearOneTimeAtLeast(situations, referentielId)) {
      ({ etptAll, monthlyList } = {
        ...(await getHRVentilationOnPeriod(
          hr[i],
          referentielId,
          categories,
          date instanceof Date ? date : undefined,
          dateStop instanceof Date ? dateStop : undefined
        )),
      });
    } else if (appearOneTimeAtLeast(situations, referentielId)) {
      etptAll = await getHRVentilation(
        hr[i],
        referentielId,
        categories,
        date instanceof Date ? date : undefined
      );
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
      totalEtp: fixDecimal(value.totalEtp || 0, 100),
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

  if (monthlyReport) {
    return {
      etpAffectedStartToEndToCompute: sortBy(list, 'rank'),
      monthlyReport: listMonthly,
    };
  } else return sortBy(list, 'rank');
}

export async function getHRVentilationOnPeriod(
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
      const { etp, situation } = await getEtpByDateAndPersonSimu(referentielId, now, hr);

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
  const { etp, situation } = await getEtpByDateAndPersonSimu(referentielId, now, hr);

  if (etp !== null && etp !== 0) {
    let listContentieux = situation ? situation.activities.map((c) => c.contentieux) : null;
    if (listContentieux !== [] && listContentieux !== null) {
      listContentieux = listContentieux.filter((contentieux) => contentieux.id === referentielId);
    }
  }

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

export function execSimulation(params, simulation, dateStart, dateStop) {
  params.toDisplay.map((x) => {
    if (params.beginSituation !== null)
      //@ts-ignore
      simulation[x] = params.beginSituation[x];
  });

  if (
    params.lockedParams.param1.label !== '' &&
    simulation[params.lockedParams.param1.label] !== undefined
  )
    //@ts-ignore
    simulation[params.lockedParams.param1.label] =
      params.lockedParams.param1.label === 'realCoverage'
        ? parseFloat(params.lockedParams.param1.value) / 100
        : parseFloat(params.lockedParams.param1.value);
  if (
    params.lockedParams.param2.label !== '' &&
    simulation[params.lockedParams.param2.label] !== undefined
  )
    //@ts-ignore
    simulation[params.lockedParams.param2.label] =
      params.lockedParams.param2.label === 'realCoverage'
        ? parseFloat(params.lockedParams.param2.value) / 100
        : parseFloat(params.lockedParams.param2.value);

  if (params.modifiedParams.param1.input !== 0)
    //@ts-ignore
    simulation[params.modifiedParams.param1.label] =
      params.modifiedParams.param1.label === 'realCoverage'
        ? parseFloat(params.modifiedParams.param1.value) / 100
        : parseFloat(params.modifiedParams.param1.value);

  if (params.modifiedParams.param2.input !== 0)
    //@ts-ignore
    simulation[params.modifiedParams.param2.label] =
      params.modifiedParams.param2.label === 'realCoverage'
        ? parseFloat(params.modifiedParams.param2.value) / 100
        : parseFloat(params.modifiedParams.param2.value);

  do {
    params.toCalculate.map((x) => {
      if (x === 'totalIn') {
        if (simulation.totalOut && (simulation.lastStock || simulation.lastStock === 0)) {
          simulation.totalIn = Math.floor(
            (Math.floor(simulation.lastStock) - Math.floor(params.beginSituation.lastStock)) /
              (nbOfDays(dateStart, dateStop) / (365 / 12)) +
              Math.floor(simulation.totalOut)
          );
        } else if (simulation.totalOut && simulation.realCoverage) {
          simulation.totalIn = Math.floor(
            Math.floor(simulation.totalOut) / simulation.realCoverage
          );
        }
      }
      if (x === 'totalOut') {
        if (simulation.etpMag && simulation.realTimePerCase) {
          simulation.totalOut = Math.floor(
            Math.floor(simulation.etpMag * 8 * 17.3333) / simulation.realTimePerCase
          );
        } else if (simulation.totalIn && (simulation.lastStock || simulation.lastStock === 0)) {
          simulation.totalOut = Math.floor(
            Math.floor(
              Math.floor(params.beginSituation.lastStock) - Math.floor(simulation.lastStock)
            ) /
              (nbOfDays(dateStart, dateStop) / (365 / 12)) +
              simulation.totalIn
          );
        } else if (
          simulation.lastStock &&
          (simulation.realDTESInMonths || simulation.realDTESInMonths === 0)
        ) {
          simulation.totalOut = Math.floor(simulation.lastStock / simulation.realDTESInMonths);
        } else if (simulation.realCoverage && simulation.totalIn) {
          simulation.totalOut = Math.floor(simulation.realCoverage * simulation.totalIn);
        } else if (
          (simulation.realDTESInMonths || simulation.realDTESInMonths === 0) &&
          simulation.totalIn
        ) {
          simulation.totalOut = Math.floor(
            (Math.floor(params.beginSituation.lastStock) +
              simulation.totalIn * (nbOfDays(dateStart, dateStop) / (365 / 12))) /
              (simulation.realDTESInMonths + nbOfDays(dateStart, dateStop) / (365 / 12))
          );
        }
      }
      if (x === 'lastStock') {
        if (simulation.realDTESInMonths === 0) {
          simulation.lastStock = 0;
        } else if (simulation.totalIn && simulation.totalOut) {
          simulation.lastStock = Math.floor(
            Math.floor(
              Math.floor(params.beginSituation.lastStock) +
                Math.floor(simulation.totalIn) * (nbOfDays(dateStart, dateStop) / (365 / 12)) -
                Math.floor(simulation.totalOut) * (nbOfDays(dateStart, dateStop) / (365 / 12))
            )
          );
        } else if (
          (simulation.realDTESInMonths || simulation.realDTESInMonths === 0) &&
          simulation.totalOut
        ) {
          simulation.lastStock = Math.floor(
            simulation.realDTESInMonths * Math.floor(simulation.totalOut)
          );
        }
        if (simulation.lastStock && simulation.lastStock < 0) {
          simulation.lastStock = 0;
        }
      }
      if (x === 'realCoverage') {
        if (simulation.totalOut && simulation.totalIn) {
          simulation.realCoverage =
            (simulation.totalOut || params.endSituation.totalOut) /
            (simulation.totalIn || params.endSituation.totalIn);
        }
      }
      if (x === 'realDTESInMonths') {
        simulation.realDTESInMonths =
          Math.round(
            (Math.floor(simulation.lastStock || 0) /
              Math.floor(simulation.totalOut || params.endSituation.totalOut)) *
              100
          ) / 100;
      }

      if (x === 'realTimePerCase') {
        simulation.realTimePerCase =
          Math.round(
            ((17.333 * 8 * (simulation.etpMag || params.beginSituation.etpMag)) /
              Math.floor(simulation.totalOut || params.endSituation.totalOut)) *
              100
          ) / 100;
      }

      if (x === 'etpMag') {
        simulation.etpMag =
          Math.round(
            (((simulation.realTimePerCase || params.endSituation.realTimePerCase) *
              Math.floor(simulation.totalOut || params.endSituation.totalOut)) /
              (17.333 * 8)) *
              100
          ) / 100;
      }
    });
  } while (
    !(
      simulation.totalIn !== null &&
      simulation.totalOut !== null &&
      simulation.lastStock !== null &&
      simulation.etpMag !== null &&
      simulation.realTimePerCase !== null &&
      simulation.realDTESInMonths !== null &&
      simulation.realCoverage !== null
    )
  );
  return simulation;
}
