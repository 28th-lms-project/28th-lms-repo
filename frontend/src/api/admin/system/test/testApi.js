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

export const searchTestQuestion = async (questionId) => {
  try {
    const response = await fetch(`${host}/admin/system/test/${questionId}`);

    if (!response.ok) {
      throw Error("잘못된 요청입니다.");
    }
    const responseJson = await response.json();
    return responseJson;
  } catch (e) {
    throw Error("잘못된 요청입니다.", e);
  }
};

export const createNewQuestion = async (registTestQ) => {
  try {
    const response = await fetch(`${host}/admin/system/test`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registTestQ),
    });
    if (!response.ok) {
      throw Error("잘못된 요청입니다.");
    }
    return await response.json();
  } catch (e) {
    throw Error("잘못된 요청입니다.", e);
  }
};

export const updateTestQuestion = async (questionId, body) => {
  try {
    const response = await fetch(`${host}/admin/system/test/${questionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw Error("잘못된 요청입니다.");
    }
    // 서버가 수정된 문제(ExamQuestionVO)를 JSON으로 돌려줌
    return await response.json();
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
