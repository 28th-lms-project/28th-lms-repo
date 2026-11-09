import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getMyActionCodes } from "../../api/permission/permissionApi";
import { logout } from "./loginSliceStore";

/**
 * 내 권한 (GET /action-codes/me)
 *
 * - 화면의 버튼 · 기능 표시 여부를 판단하는 데만 사용한다. 실제 차단은 서버가 한다.
 * - 조회는 MainLayout에서 로그인 상태이고 status가 "idle"일 때 한 번 한다.
 * - logout 시 초기화되어, 다음 로그인 때 다시 조회된다.
 * - "loaded"가 되기 전에는 selectCan이 항상 false다 (권한이 필요한 요소는 숨김 상태로 시작).
 */

const initialState = {
  status: "idle", // "idle" | "loading" | "loaded" | "failed"
  requestId: null, // 진행 중인 조회. logout 뒤에 도착한 이전 사용자의 응답을 버리기 위함
  roleId: null,
  roleDisplayName: null,
  superAdmin: false,
  actionCodes: [],
};

export const fetchMyPermission = createAsyncThunk(
  "permission/fetchMy",
  () => getMyActionCodes(),
  {
    // 이미 조회 중이거나 조회한 뒤면 다시 요청하지 않음 (StrictMode의 effect 2회 실행 포함)
    condition: (_, { getState }) => getState().permission.status === "idle",
  },
);

export const permissionSlice = createSlice({
  name: "permission",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPermission.pending, (state, action) => {
        state.status = "loading";
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchMyPermission.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;

        const { roleId, roleDisplayName, superAdmin, actionCodes } = action.payload ?? {};
        state.status = "loaded";
        state.requestId = null;
        state.roleId = roleId ?? null;
        state.roleDisplayName = roleDisplayName ?? null;
        state.superAdmin = superAdmin === true;
        state.actionCodes = actionCodes ?? [];
      })
      .addCase(fetchMyPermission.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;

        return { ...initialState, status: "failed" };
      })
      .addCase(logout, () => initialState);
  },
  selectors: {
    selectPermissionStatus: (state) => state.status,
    selectIsSuperAdmin: (state) => state.status === "loaded" && state.superAdmin,
    selectCan: (state, actionCode) =>
      state.status === "loaded" && (state.superAdmin || state.actionCodes.includes(actionCode)),
  },
});

export const { selectPermissionStatus, selectIsSuperAdmin, selectCan } = permissionSlice.selectors;
export default permissionSlice.reducer;
