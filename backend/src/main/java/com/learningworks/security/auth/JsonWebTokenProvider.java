package com.learningworks.security.auth;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Component
public class JsonWebTokenProvider {

  public static final String ROLES_CLAIM = "roles";
  public static final String ISSUER = "learningworks";

  // 서명·검증에 쓰는 HMAC 키
  private final SecretKey key;
  // 토큰 유효시간(초)
  private final long accessTokenValiditySeconds;
  // 현재 시간
  private final Clock clock;

  // Spring Bean 형성
  // Applicaiton.yml 에서 키와 시간을 받아옴
  @Autowired
  public JsonWebTokenProvider(@Value("${app.jwt.secret-key}") String secret,
      @Value("${app.jwt.access-token-validity-seconds}") long accessTokenValiditySeconds) {
    this(secret, accessTokenValiditySeconds, Clock.systemDefaultZone());
  }

  public JsonWebTokenProvider(String secret, long accessTokenValiditySeconds, Clock clock) {
    if (secret == null || secret.isBlank()) {
      // 앱 실행할 때 secret-key 가 있는지 검증
      throw new IllegalArgumentException("JWT Secret 이 비어있습니다.");
    }
    if (accessTokenValiditySeconds <= 0) {
      throw new IllegalArgumentException("access token 유효기간은 0보다 커야합니다.");
    }

    // secret-key 를 기반으로 비밀 키 생성
    this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    this.accessTokenValiditySeconds = accessTokenValiditySeconds;
    this.clock = clock;
  }

  public String createAccessToken(LoginUser loginUser) {
    if (loginUser == null) {
      throw new IllegalArgumentException("로그인 사용자 정보가 null 입니다.");
    }

    List<String> roles = new ArrayList<>();
    for (GrantedAuthority authority : loginUser.getAuthorities()) {
      roles.add(authority.getAuthority());
    }

    Instant now = this.clock.instant();
    Instant expiration = now.plusSeconds(this.accessTokenValiditySeconds);

    return Jwts.builder().issuer(JsonWebTokenProvider.ISSUER) // "learningworks"
        .subject(loginUser.getUsername()) // 사용자 ID
        .claim(JsonWebTokenProvider.ROLES_CLAIM, roles) // 권한 목록
        .issuedAt(Date.from(now)) // 발급 시각
        .expiration(Date.from(expiration)) // 만료 시각
        .signWith(this.key) // 서명: 위의 비밀 키와 builder 의 내용들을 합쳐서 고유한 서명을 만들어냄
        .compact();
  }

  public Claims getClaims(String token) {
    if (token == null || token.isBlank()) {
      throw new IllegalArgumentException("토큰이 비어있습니다.");
    }
    return Jwts.parser().verifyWith(this.key) // 우리 key 로 서명 검증
        .requireIssuer(JsonWebTokenProvider.ISSUER) // 우리가 발급한 key 인지 검증 (learning works 인지 아닌지)
        .clock(() -> Date.from(this.clock.instant())) // 발급 시각이 만료되었는지 검증
        .build().parseSignedClaims(token).getPayload();
  }

  public List<String> getRoles(Claims claims) {
    List<String> roles = new ArrayList<>();
    Object value = claims.get(JsonWebTokenProvider.ROLES_CLAIM);
    if (value instanceof List<?> list) {
      for (Object role : list) {
        roles.add(String.valueOf(role));
      }
    }
    return roles;
  }
}
