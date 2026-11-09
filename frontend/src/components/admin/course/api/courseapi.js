export const courseStudent = async (id) => {
  try {
    const fetchResult = await fetch(`http://localhost:8080/${id}/list/student`);
    const resultJson = await fetchResult.json();

    return resultJson;
  } catch (e) {
    throw Error("잘못된 요청입니다", e);
  }
};
