package com.learningworks.course.service;

import org.mockito.Mockito;
import com.learningworks.common.action.AccessChecker;

/**
 * 과정 단위 권한 테스트 도우미.
 * CourseAccessChecker 는 등록되지 않은 과정의 조회 · 관리를 권한 코드(COURSE_ALL_READ · COURSE_ALL_MANAGE)로 판단한다.
 * 테스트에서는 역할에 따라 이 두 코드를 아래처럼 허용한 것으로 흉내 낸다 (운영 DB 부여 안과 같음).
 * - ROLE_SUPER_ADMIN · ROLE_ADMIN: 둘 다
 * - ROLE_READONLY: COURSE_ALL_READ 만
 * - 그 외: 없음
 */
public final class CourseAccessTestSupport {

  private CourseAccessTestSupport() {}

  public static void stubAllCourse(AccessChecker accessChecker, String userId, String baseRole) {
    boolean admin = "ROLE_SUPER_ADMIN".equals(baseRole) || "ROLE_ADMIN".equals(baseRole);
    boolean readAll = admin || "ROLE_READONLY".equals(baseRole);
    Mockito.when(accessChecker.hasAction(userId, CourseAccessChecker.ALL_READ.actionCode()))
        .thenReturn(readAll);
    Mockito.when(accessChecker.hasAction(userId, CourseAccessChecker.ALL_MANAGE.actionCode()))
        .thenReturn(admin);
  }
}
