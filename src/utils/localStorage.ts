const getItem = (name: string, fallback?: string): string | undefined => {
  let value;
  try {
    value = window.localStorage.getItem(name);
  } catch {}

  return value == null ? fallback : value;
};

const setItem = (name: string, value: string): void => {
  try {
    window.localStorage.setItem(name, value);
  } catch {}
};

const localStorage = {
  getItem,
  setItem,
};

export default localStorage;
