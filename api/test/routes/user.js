import { instanceAxios } from '../utils/axios'

export const onLoginAdminApi = async ({ email, password }) => {
  return await instanceAxios
    .post('/auths/login-admin', {
      email,
      password,
    })
    .then((res) => {
      return res
    })
    .catch((err) => {
      return err.response
    })
}

export const onLoginApi = async ({ email, password }) => {
  return await instanceAxios
    .post('/auths/login', {
      email,
      password,
    })
    .then((res) => {
      return res
    })
    .catch((err) => {
      return err.response
    })
}

export const onSignUpApi = async ({ email, password, firstName, lastName, fonction }) => {
  return await instanceAxios
    .post('/users/create-account', {
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
      fonction: fonction,
    })
    .then((res) => {
      return res
    })
    .catch((err) => {
      return err.response
    })
}

export const onForgotPasswordApi = async ({ email }) => {
  return await instanceAxios
    .post('/users/forgot-password', {
      email,
    })
    .then((res) => {
      return res
    })
    .catch((err) => {
      return err.response
    })
}

export const onGetMyInfosApi = async ({ userToken }) => {
  return await instanceAxios
    .get('/users/me', {
      headers: {
        authorization: userToken,
      },
    })
    .then((res) => {
      return res
    })
}

export const onGetUserDataApi = async ({ userToken }) => {
  return await instanceAxios
    .get('/users/get-user-datas', {
      headers: {
        authorization: userToken,
      },
    })
    .then((res) => {
      return res
    })
}

export const onGetUserListApi = async ({ userToken }) => {
  return await instanceAxios
    .get('/users/get-all', {
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

export const onLogoutApi = async ({ userToken }) => {
  return await instanceAxios
    .get('/auths/logout', {
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

export const onRemoveAccountApi = async ({ userId, userToken }) => {
  return await instanceAxios
    .delete(`/users/remove-account-test/${userId}`, {
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

export const onUpdateAccountApi = async ({ userToken, userId, accessIds, ventilations }) => {
  return await instanceAxios
    .post(
      '/users/update-account',
      {
        userId: userId,
        access: accessIds,
        ventilations: ventilations,
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
