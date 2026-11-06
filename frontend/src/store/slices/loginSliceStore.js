import { createSlice } from "@reduxjs/toolkit";
import {
  decodeToken,
  getToken,
  isTokenExpired,
  removeToken,
  setToken,
} from "../../utils/tokenStorage";

function createInitialState() {
  const token = getToken();
  const payload = decodeToken(token);
  if (isTokenExpired(payload)) {
    removeToken();
    return { user: null, status: "idle" };
  }

  return {
    user: {
      id: payload.sub,
      name: null,
      roleName: null,
    },
    status: "idle",
  };
}

export const loginSlice = createSlice({
  name: "login",
  initialState: createInitialState,
  reducers: {
    loginSuccess(state, action) {
      const { token, user } = action.payload;
      setToken(token);
      state.user = user;
    },

    setUser(state, action) {
      state.user = { ...state.user, ...action.payload };
    },

    logout(state) {
      removeToken();
      state.user = null;
    },
  },
  selectors: {
    selectUser: (state) => state.user,
  },
});

export const { loginSuccess, setUser, logout } = loginSlice.actions;
export const { selectUser } = loginSlice.selectors;
export default loginSlice.reducer;
