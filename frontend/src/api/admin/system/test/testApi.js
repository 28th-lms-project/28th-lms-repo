const host = "http://localhost:8080";

export const searchTest = async () => {
  try {
    const response = await fetch(`${host}/admin/system/test`);
    if (!response.ok) {
      throw Error("잘못된 요청입니다.");
    }

    const responseJson = await response.json();
    return responseJson;
  } catch (e) {
    throw Error("잘못된 요청입니다.", e);
  }
};
