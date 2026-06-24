import { instanceAxios } from '../utils/axios'

export const onGetFeedbackStatusApi = async ({ userToken }) => {
  return await instanceAxios
    .get('/feedback/status', {
      headers: {
        authorization: userToken,
      },
    })
    .then((res) => res)
    .catch((err) => err.response)
}

export const onSubmitFeedbackApi = async ({ userToken, rating, comment, page }) => {
  return await instanceAxios
    .post(
      '/feedback/submit',
      {
        rating,
        comment,
        page,
      },
      {
        headers: {
          authorization: userToken,
        },
      }
    )
    .then((res) => res)
    .catch((err) => err.response)
}

export const onGetFeedbackAllApi = async ({ userToken }) => {
  return await instanceAxios
    .get('/feedback/get-all', {
      headers: {
        authorization: userToken,
      },
    })
    .then((res) => res)
    .catch((err) => err.response)
}

export const onGetFeedbackStatsApi = async ({ userToken }) => {
  return await instanceAxios
    .get('/feedback/stats', {
      headers: {
        authorization: userToken,
      },
    })
    .then((res) => res)
    .catch((err) => err.response)
}
