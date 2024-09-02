import { instanceAxios } from '../utils/axios'

export const onGetLastMonthApi = async ({ userToken, hrBackupId }) => {
  return await instanceAxios
    .post(
      '/activities/get-last-month',
      {
        hrBackupId: hrBackupId,
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

export const onGetDataByMonthApi = async ({ userToken, hrBackupId, date }) => {
  return await instanceAxios
  .post(
    '/activities/get-by-month',
    {
      date: date,
      hrBackupId: hrBackupId,
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
