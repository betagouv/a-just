import { instanceAxios } from '../utils/axios'

export const onGetAllActivatedTjApi = async () => {
  return await instanceAxios
    .get('/juridictions/get-all-visibles')
    .then((res) => {
      return res
    })
    .catch((err) => {
      return err
    })
}

export const onGetContentiousApi = async ({ userToken, backupId }) => {
  return await instanceAxios
    .post(
      '/contentieux-options/get-all',
      {
        backupId: null,
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
