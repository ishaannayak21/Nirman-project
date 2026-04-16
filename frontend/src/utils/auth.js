const TOKEN_KEY = "grievance_admin_token";
const ADMIN_KEY = "grievance_admin_user";
const USER_TOKEN_KEY = "grievance_user_token";
const USER_KEY = "grievance_user_data";

export const saveAdminSession = ({ token, admin }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
};

export const getAdminToken = () => {
  return localStorage.getItem(TOKEN_KEY) || "";
};

export const getAdminUser = () => {
  const admin = localStorage.getItem(ADMIN_KEY);
  return admin ? JSON.parse(admin) : null;
};

export const clearAdminSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
};

export const isAdminLoggedIn = () => {
  return Boolean(getAdminToken());
};

export const saveUserSession = ({ token, user }) => {
  localStorage.setItem(USER_TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUserToken = () => {
  return localStorage.getItem(USER_TOKEN_KEY) || "";
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const clearUserSession = () => {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isUserLoggedIn = () => {
  return Boolean(getUserToken());
};
