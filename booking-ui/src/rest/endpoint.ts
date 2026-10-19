export const ENDPOINT = {
  LOGIN: "booking-service/api/auth/login",
  GOOGLE_LOGIN: "booking-service/api/auth/google/login",
  GOOGLE_LOGIN_GET_TOKEN: "booking-service/api/auth/google/getToken",
  USERS: "booking-service/api/users/current-user",
  SIGN_UP: "booking-service/api/auth/register",
  SIGN_OUT: "booking-service/api/auth/logout",
  REFRESH_TOKEN: "booking-service/api/auth/refresh",
} as const;
