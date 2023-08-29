import { instanceAxios } from "../../../utils/axios";

export const onGetIelstListApi = async () => {
  return await instanceAxios.get("/juridictions/get-all-ielst").then((res) => {
    return res.data.data ? res.data.data : null;
  });
};
