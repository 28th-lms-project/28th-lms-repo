package com.learningworks.security;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.learningworks.member.dao.MemberDao;
import com.learningworks.member.service.MemberService;
import com.learningworks.security.auth.JsonWebTokenProvider;
import com.learningworks.security.auth.LoginPasswordValidator;
import com.learningworks.security.auth.LoginUserDetailsService;
import com.learningworks.security.auth.filter.LoginJwtAuthenticationFilter;
import com.learningworks.security.auth.filter.ValidateJwtAuthenticationFilter;
import com.learningworks.security.auth.providers.LoginAuthenticationProvider;
import com.learningworks.security.auth.providers.handlers.LoginFailureHandler;
import com.learningworks.security.auth.providers.handlers.LoginSuccessHandler;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.json.JsonMapper;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

  private final MemberDao memberDao;
  private final MemberService memberService;
  private final JsonWebTokenProvider jsonWebTokenProvider;
  private final JsonMapper jsonMapper;

  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http.csrf(AbstractHttpConfigurer::disable) // CSRF 끔
        .cors(Customizer.withDefaults()) // 아래 corsConfigurationSource 사용
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .formLogin(AbstractHttpConfigurer::disable).httpBasic(AbstractHttpConfigurer::disable)
        .authorizeHttpRequests(auth -> auth.anyRequest().permitAll()) // 개발용: 전부 허용
        .addFilterBefore(
            new ValidateJwtAuthenticationFilter(this.jsonWebTokenProvider, this.jsonMapper),
            UsernamePasswordAuthenticationFilter.class)
        .addFilterAt(this.createLoginJwtAuthenticationFilter(),
            UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("*")); // 모든 origin
    config.setAllowedMethods(List.of("*"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true); // 쿠키/세션 쓸 때 필요

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  AuthenticationProvider createLoginAuthenticationProvider() {
    UserDetailsService userDetailsService = new LoginUserDetailsService(this.memberDao);
    LoginPasswordValidator loginPasswordValidator = new LoginPasswordValidator();

    return new LoginAuthenticationProvider(userDetailsService, loginPasswordValidator);
  }

  LoginJwtAuthenticationFilter createLoginJwtAuthenticationFilter() {
    AuthenticationManager authManager =
        new ProviderManager(this.createLoginAuthenticationProvider());

    LoginJwtAuthenticationFilter filter =
        new LoginJwtAuthenticationFilter(authManager, this.jsonMapper);
    filter.setAuthenticationSuccessHandler(
        new LoginSuccessHandler(this.memberService, this.jsonWebTokenProvider, this.jsonMapper));
    filter.setAuthenticationFailureHandler(
        new LoginFailureHandler(this.memberService, this.jsonMapper));
    return filter;

  }


}
