import { instanceAxios } from '../utils/axios'

export const onGetContentiousApi = async ({ userToken, backupId }) => {
  console.log('userToken:', userToken)
  console.log('backupId:', backupId)

  return await instanceAxios
    .post(
      'contentieux-options/get-all',
      {
        backupId: backupId,
        juridictionId: backupId,
      },
      {
        headers: {
          Authorization: userToken,
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
