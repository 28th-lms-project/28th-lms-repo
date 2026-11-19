package com.learningworks.common.action;

import java.util.List;

/**
 * API에 붙지 않는 권한 코드를 선언하는 빈.
 *
 * 권한 코드 등록부(ActionCodeRegistry)는 컨트롤러의 @RequireAction만 모으므로, 서비스 안에서 판단하는 권한
 * (예: 과정에 등록되지 않아도 모든 과정을 다룰 수 있는지)은 이 인터페이스로 선언한다. 등록부는 두 가지를 함께 등록하고,
 * 권한 관리 화면에서 다른 권한 코드처럼 등록 · 역할에 부여할 수 있다. 판단은 AccessChecker.hasAction으로 한다.
 *
 * 구현 예: CourseAccessChecker (COURSE_ALL_READ · COURSE_ALL_MANAGE)
 */
public interface ActionCodeDeclarer {

  /** 이 빈이 쓰는 권한 코드 목록 */
  List<DeclaredActionCode> declaredActionCodes();
}
