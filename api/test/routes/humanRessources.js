import { instanceAxios } from '../utils/axios'

export const onFilterListApi = async ({ userToken, backupId }) => {
  console.log('userToken:', userToken)
  console.log('backupdID: ', backupId)
  return await instanceAxios
    .post(
      'human-resources/filter-list',
      {
        backupId: backupId,
        date: new Date(),
        categoriesIds: [1, 2, 3],
        extractor: false,
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
      console.log('------ Error:', err)

      return err.response
    })
}
