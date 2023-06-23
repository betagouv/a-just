import { instanceAxios } from '../utils/axios'

export const onFilterListApi = async ({ userToken, backupId, contentieuxIds }) => {
  console.log('userToken:', userToken)
  console.log('backupdID: ', backupId)
  return await instanceAxios
    .post(
      '/human-resources/filter-list',
      {
        backupId: backupId,
        categoriesIds: [1, 2, 3],
        contentieuxIds: contentieuxIds,
        date: new Date(),
        extractor: false,
      },
      {
        headers: {
          Authorization: userToken,
        },
      }
    )
    .then((res) => {
      return res.data.data
    })
    .catch((err) => {
      return err.response
    })
}
