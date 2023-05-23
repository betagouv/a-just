import { instanceAxios } from '../utils/axios'

export const onFilterList = async ({ userToken, backupId, dateStart, dateStop, contentieuxIds, optionBackupId, categorySelected, selectedFonctionsIds }) => {
  return await instanceAxios
    .post(
      '/calculator/filter-list',
      {
        backupId: backupId,
        dateStart,
        dateStop,
        contentieuxIds,
        optionBackupId: optionBackupId,
        categorySelected,
        selectedFonctionsIds: selectedFonctionsIds,
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
