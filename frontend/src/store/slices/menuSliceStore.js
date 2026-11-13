import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getMyMenus } from "../../api/admin/system/menu/menuApi";
import { logout } from "./loginSliceStore";

/**
 * 내 메뉴 (GET /menus/me). 사이드바와 메뉴 가드가 사용한다.
 * 설계: frontend/docs/design/menu-page-design.md 7-1
 *
 * - fetchMyMenus: status가 "idle"일 때만 조회 (처음 한 번)
 * - refreshMyMenus: 조건 없이 다시 조회. 메뉴 관리에서 저장 · 삭제 · 순서 변경에 성공한 뒤 호출한다.
 *   응답이 올 때까지 이전 값을 유지한다 (사이드바가 깜빡이지 않게). 실패하면 이전 값을 그대로 둔다.
 * - logout 시 초기화되어, 다음 로그인 때 다시 조회된다.
 */

const initialState = {
  status: "idle", // "idle" | "loading" | "succeeded" | "failed"
  requestId: null, // 가장 최근 요청. 이전 요청 · logout 이전 사용자의 응답을 버리기 위함
  superAdmin: false,
  menus: [],
  guardUrls: [],
};

export const fetchMyMenus = createAsyncThunk("menu/fetchMy", () => getMyMenus(), {
  // 이미 조회 중이거나 조회한 뒤면 다시 요청하지 않음 (StrictMode의 effect 2회 실행 포함)
  condition: (_, { getState }) => getState().menu.status === "idle",
});

export const refreshMyMenus = createAsyncThunk("menu/refreshMy", () => getMyMenus());

const applyMyMenus = (state, payload) => {
  const { superAdmin, menus, guardUrls } = payload ?? {};
  state.status = "succeeded";
  state.requestId = null;
  state.superAdmin = superAdmin === true;
  state.menus = menus ?? [];
  state.guardUrls = guardUrls ?? [];
};

export const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyMenus.pending, (state, action) => {
        state.status = "loading";
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchMyMenus.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        applyMyMenus(state, action.payload);
      })
      .addCase(fetchMyMenus.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        return { ...initialState, status: "failed" };
      })
      // 다시 조회: status · 이전 값은 그대로 두고 요청 ID만 바꾼다
      .addCase(refreshMyMenus.pending, (state, action) => {
        state.requestId = action.meta.requestId;
      })
      .addCase(refreshMyMenus.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        applyMyMenus(state, action.payload);
      })
      .addCase(refreshMyMenus.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.requestId = null;
      })
      .addCase(logout, () => initialState);
  },
  selectors: {
    selectMyMenuStatus: (state) => state.status,
    selectMyMenus: (state) => state.menus,
    selectGuardUrls: (state) => state.guardUrls,
    selectIsMenuSuperAdmin: (state) => state.superAdmin,
  },
});

export const { selectMyMenuStatus, selectMyMenus, selectGuardUrls, selectIsMenuSuperAdmin } =
  menuSlice.selectors;
export default menuSlice.reducer;
