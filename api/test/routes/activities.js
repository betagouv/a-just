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
