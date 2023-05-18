import { instanceAxios } from '../utils/axios'

export const onFilterListApi = async ({ userToken, backupId }) => {
  return await instanceAxios
    .post(
      '/human-resources/filter-list',
      {
        backupId: backupId,
        date: new Date(),
        categoriesIds: [1, 2, 3],
        contentieuxIds: null,
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
