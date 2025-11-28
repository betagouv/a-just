import axios from 'axios'
import config from 'config'
import { instanceAxios } from "../utils/axios";

export const onSaveCle =  async (backupId, categoryId, value, userToken) => {
  return await instanceAxios.put(`/juridictions-details/update-cle`, {
    juridictionId: backupId,
    categoryId,
    value,
  }, {
    headers: {
      Authorization: userToken,
    },
    withCredentials: true,
  })
}

export const onGetAllCle =  async (backupId, userToken) => {
  return await instanceAxios.post(`/juridictions-details/get-cle`, {
    juridictionId: backupId,
  }, {
    headers: {
      Authorization: userToken,
    },
    withCredentials: true,
  })
}
