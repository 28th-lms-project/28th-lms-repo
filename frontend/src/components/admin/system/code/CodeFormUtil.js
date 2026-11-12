export const formatDate = (value) => {
  if (!value) {
    return "";
  }
  return value.replace("T", " ");
};

export const toOrder = (value) => {
  if (value === "") {
    return null;
  }
  return Number(value);
};

export const readInput = (event) => {
  const { name, value, type, checked } = event.target;
  if (type !== "checkbox") {
    return { name, value };
  }
  if (checked) {
    return { name, value: "Y" };
  }
  return { name, value: "N" };
};
