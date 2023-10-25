import { instanceAxios } from '../utils/axios'

export const onFilterListCalculatorApi = async ({
  userToken,
  backupId,
  dateStart,
  dateStop,
  contentieuxIds,
  optionBackupId,
  categorySelected,
  selectedFonctionsIds,
}) => {
  return await instanceAxios
    .post(
      '/calculator/filter-list',
      {
        backupId,
        categorySelected,
        contentieuxIds,
        dateStart,
        dateStop,
        optionBackupId,
        selectedFonctionsIds,
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
