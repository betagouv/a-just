import { instanceAxios } from '../utils/axios'

export const onUpdateHrApi = async ({ userToken, hr, backupId }) => {
  return await instanceAxios
    .post(
      '/human-resources/update-hr',
      {
        backupId: backupId,
        hr: hr,
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
      console.log('ERROR HR:', err.response.data)
      return err.response
    })
}

export const onRemoveSituationApi = async ({ userToken, id }) => {
  return await instanceAxios
    .delete(`/human-resources/remove-situation-test/${id}`, {
      headers: {
        authorization: userToken,
      },
    })
    .then((res) => {
      return res
    })
    .catch((err) => {
      return err.response
    })
}

export const onRemoveHrApi = async ({ userToken, hrId }) => {
  return await instanceAxios
    .delete(`/human-resources/remove-hr-test/${hrId}`, {
      headers: {
        authorization: userToken,
      },
    })
    .then((res) => {
      return res
    })
    .catch((err) => {
      return err.response
    })
}

export const onGetBackupListHrApi = async ({ userToken }) => {
  return await instanceAxios
    .get('/human-resources/get-backup-list', {
      headers: {
        authorization: userToken,
      },
    })
    .then((res) => {
      return res
    })
    .catch((err) => {
      return err.response
    })
}
