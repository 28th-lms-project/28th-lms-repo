package com.learningworks.common.action;

import java.util.List;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import com.learningworks.common.action.dao.ActionCodeDao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 서버 시작 후, ACTION 테이블에 등록됐지만 코드의 어떤 @RequireAction에도 없는 권한 코드를 경고 로그로 남긴다.
 * 삭제는 하지 않는다 (확인 후 사람이 정리).
 *
 * 이런 코드가 생기는 경우: @RequireAction API 삭제, domain · action 이름 변경, @RequireSuperAdmin 등으로 어노테이션 변경.
 * 남겨 두면 같은 이름으로 API를 다시 만들 때 예전에 부여된 역할이 그 API를 바로 쓸 수 있게 되므로 정리해야 한다.
 * 정리 방법: backend/docs/access-control-guide.md "권한 코드를 바꾸거나 없앨 때"
 *
 * 공용 개발 DB에서는 아직 머지되지 않은 다른 브랜치의 권한 코드도 여기에 나온다. 지우기 전에 확인할 것.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UnusedActionCodeReporter {

  private final ActionCodeRegistry actionCodeRegistry;
  private final ActionCodeDao actionCodeDao;

  /** ACTION 테이블의 권한 코드 중 코드에 없는 것 (이름순) */
  public List<String> findUnusedActionCodes() {
    return this.actionCodeDao.selectRegisteredActionCodes().stream()
        .filter(actionCode -> !this.actionCodeRegistry.contains(actionCode))
        .distinct()
        .sorted()
        .toList();
  }

  /** 서버 준비가 끝난 뒤 한 번 실행. 실패해도 서버 시작을 막지 않는다 */
  @EventListener(ApplicationReadyEvent.class)
  public void report() {
    try {
      List<String> unused = this.findUnusedActionCodes();
      if (!unused.isEmpty()) {
        log.warn("코드에서 쓰이지 않는 권한 코드 {}개가 ACTION에 등록되어 있습니다 (다른 브랜치에서 쓰는 코드일 수 있음, "
            + "정리 방법: access-control-guide.md \"권한 코드를 바꾸거나 없앨 때\"): {}", unused.size(), unused);
      }
    } catch (RuntimeException e) {
      log.warn("미사용 권한 코드 확인을 건너뜁니다 (ACTION 조회 실패): {}", e.getMessage());
    }
  }

}
