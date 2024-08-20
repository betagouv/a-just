import { instanceAxios } from '../utils/axios'

export const onGetAllContentieuxReferentiels = async ({ userToken, jirs = false }) => {
  console.log('\n\n\nhere')
  return await instanceAxios
    .post(
      '/contentieux-referentiels/get-referentiels',
      {
        isJirs: jirs,
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
