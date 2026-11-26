package com.learningworks.common.config;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;
import com.learningworks.common.action.ActionCodeRules;
import com.learningworks.common.action.LoginRequired;
import com.learningworks.common.action.PublicApi;
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.action.RequireSuperAdmin;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;

/**
 * Swagger(springdoc) API 명세 설정.
 *
 * <pre>
 * 화면: /swagger-ui.html
 * 명세(JSON): /v3/api-docs
 * </pre>
 *
 * - 컨트롤러에 Swagger 어노테이션을 붙이지 않아도 권한 어노테이션(@RequireAction 등)을 읽어
 *   API마다 "필요 권한"을 설명에 자동으로 적는다. @RequireAction의 description은 요약(summary)으로 쓴다.
 * - 인증: 화면 오른쪽 위 [Authorize]에 POST /login 으로 받은 토큰을 넣으면 Authorization: Bearer 헤더로 보낸다.
 * - 로그인(POST /login)은 컨트롤러가 아니라 보안 필터라 자동으로 잡히지 않아 직접 추가한다.
 * - Swagger 주소는 권한 검사 인터셉터에서 제외되어 있다 (ActionCheckWebConfig).
 */
@Configuration
public class OpenApiConfig {

  private static final String BEARER_SCHEME = "bearerAuth";

  /** 로그인 API(POST /login) 그룹 이름 */
  private static final String LOGIN_TAG = "로그인";

  /** 권한 어노테이션이 없는 API를 SUPER_ADMIN 전용으로 보는지 (ActionCheckInterceptor와 같은 설정) */
  private final boolean defaultSuperAdmin;

  public OpenApiConfig(
      @Value("${app.access-check.default-super-admin:true}") boolean defaultSuperAdmin) {
    this.defaultSuperAdmin = defaultSuperAdmin;
  }

  /** 기본 정보 + JWT 인증 버튼 (모든 API에 bearerAuth 적용) */
  @Bean
  OpenAPI learningworksOpenApi() {
    return new OpenAPI()
        .info(new Info()
            .title("LearningWorks LMS API")
            .version("v1")
            .description("응답은 공통 형식 ApiResponse로 감싸져 있습니다. "
                + "권한은 각 API의 \"필요 권한\"을 참고하세요."))
        .components(new Components().addSecuritySchemes(BEARER_SCHEME,
            new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("POST /login 응답 body의 토큰")))
        .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME));
  }

  /** 권한 어노테이션 → 요약 · 필요 권한 표시 (ActionCheckInterceptor의 판단 순서와 같게) */
  @Bean
  OperationCustomizer permissionOperationCustomizer() {
    return (Operation operation, HandlerMethod handlerMethod) -> {
      String permission;
      RequireAction requireAction = handlerMethod.getMethodAnnotation(RequireAction.class);
      if (handlerMethod.hasMethodAnnotation(PublicApi.class)) {
        permission = "없음 (비로그인 포함 누구나)";
        operation.setSecurity(List.of()); // 토큰 없이 호출 가능
      } else if (handlerMethod.hasMethodAnnotation(LoginRequired.class)) {
        permission = "로그인한 사용자 누구나";
      } else if (requireAction != null) {
        permission = ActionCodeRules.toActionCode(requireAction)
            + " (" + requireAction.description() + ")";
        if (operation.getSummary() == null) {
          operation.setSummary(requireAction.description());
        }
      } else if (handlerMethod.hasMethodAnnotation(RequireSuperAdmin.class)) {
        permission = "SUPER_ADMIN 전용";
      } else {
        permission = this.defaultSuperAdmin
            ? "SUPER_ADMIN 전용 (권한 어노테이션 없음)"
            : "없음 (권한 어노테이션 없음)";
      }

      String line = "**필요 권한**: " + permission;
      String description = operation.getDescription();
      operation.setDescription(description == null || description.isBlank()
          ? line
          : description + "\n\n" + line);
      return operation;
    };
  }

  /** 보안 필터가 처리하는 로그인 API (POST /login)를 명세에 추가한다 */
  @Bean
  OpenApiCustomizer loginPathCustomizer() {
    return openApi -> {
      ObjectSchema body = new ObjectSchema();
      body.addProperty("id", new StringSchema().description("아이디"));
      body.addProperty("password", new StringSchema().description("비밀번호"));
      body.setRequired(List.of("id", "password"));

      Operation login = new Operation()
          .addTagsItem(LOGIN_TAG)
          .summary("로그인")
          .description("성공하면 body에 JWT 토큰을 돌려준다. [Authorize]에 넣고 다른 API를 호출한다.\n\n"
              + "**필요 권한**: 없음 (비로그인 포함 누구나)")
          .security(List.of())
          .requestBody(new RequestBody().required(true).content(new Content()
              .addMediaType("application/json", new MediaType().schema(body))))
          .responses(new ApiResponses()
              .addApiResponse("200", new ApiResponse().description("로그인 성공 (body: JWT 토큰)"))
              .addApiResponse("401", new ApiResponse()
                  .description("아이디 · 비밀번호 불일치, 잠긴 계정 등 (USER_NOT_MATCHED_IDENTIFY)"))
              .addApiResponse("500", new ApiResponse()
                  .description("로그인 처리 중 서버 내부 오류 (GLOBAL_SYSTEM_ERROR)")));

      openApi.path("/login", new PathItem().post(login));
    };
  }

  /**
   * Swagger 화면의 그룹(@Tag) 순서. 이름은 각 컨트롤러의 @Tag(name)과 같아야 한다.
   * 여기 없는 그룹은 맨 뒤에 이름순으로 붙는다.
   */
  private static final List<String> TAG_ORDER = List.of(
      "로그인", "회원", "역할", "메뉴", "접근 권한", "역할별 접근 권한", "권한 코드", "환경 변수",
      "과정", "출석", "시간표", "시험", "성적", "설문", "상담", "면접 일정", "교육 자료");

  /** 그룹(@Tag)을 TAG_ORDER 순서로 정렬한다 (로그인 그룹 설명도 여기서 채움) */
  @Bean
  OpenApiCustomizer tagOrderCustomizer() {
    return openApi -> {
      List<Tag> tags = new ArrayList<>(openApi.getTags() == null ? List.of() : openApi.getTags());
      if (tags.stream().noneMatch(tag -> LOGIN_TAG.equals(tag.getName()))) {
        tags.add(new Tag().name(LOGIN_TAG).description("로그인 · JWT 토큰 발급"));
      }
      tags.sort(Comparator
          .comparingInt((Tag tag) -> {
            int index = TAG_ORDER.indexOf(tag.getName());
            return index < 0 ? Integer.MAX_VALUE : index;
          })
          .thenComparing(Tag::getName));
      openApi.setTags(tags);
    };
  }

}
