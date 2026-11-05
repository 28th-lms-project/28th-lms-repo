const host = "http://localhost:8080";

export const searchTest = async (subjectId) => {
  try {
    const response = await fetch(`${host}/admin/system/tests/${subjectId}`);
    if (!response.ok) {
      throw Error("잘못된 요청입니다.");
    }

    const responseJson = await response.json();
    return responseJson;
  } catch (e) {
    throw Error("잘못된 요청입니다.", e);
  }
};

export const deleteTestQuestion = async (questionId) => {
  try {
    const response = await fetch(`${host}/admin/system/test/${questionId}`, {
      method: "delete",
    });
    if (!response.ok) {
      throw Error("잘못된 요청입니다.");
    }
    return await response.text();
  } catch (e) {
    throw Error("잘못된 요청입니다.", e);
  }
};
