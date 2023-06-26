import { instanceAxios } from '../utils/axios'

export const onGetSituationApi = async ({ userToken, backupId, categoryId, functionIds, referentielId }) => {
  return await instanceAxios
    .post(
      '/simulator/get-situation',
      {
        backupId,
        categoryId,
        functionIds,
        referentielId,
      },
      {
        headers: {
          authorization: userToken,
        },
      }
    )
    .then((res) => {
      return res
    })
    .catch((err) => {
      return err.response
    })
}

export const onGetMonthActivityApi = async ({ userToken, hrBackupId, date }) => {
  return await instanceAxios
    .post(
      '/activities/get-by-month',
      {
        hrBackupId: hrBackupId,
        date,
      },
      {
        headers: {
          authorization: userToken,
        },
      }
    )
    .then((res) => {
      return res
    })
    .catch((err) => {
      return err.response
    })
}
