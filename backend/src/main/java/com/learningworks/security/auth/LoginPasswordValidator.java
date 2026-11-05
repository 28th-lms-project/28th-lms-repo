package com.learningworks.security.auth;

import com.learningworks.common.utils.crypto.SHA;

public class LoginPasswordValidator {

  public boolean matches(String rawPassword, LoginUser loginUser) {
    if (rawPassword == null || rawPassword.isBlank()) {
      return false;
    }
    if (loginUser == null) {
      return false;
    }
    if (loginUser.getSalt() == null || loginUser.getSalt().isBlank()) {
      return false;
    }
    if (loginUser.getPassword() == null || loginUser.getPassword().isBlank()) {
      return false;
    }

    return SHA.matches(rawPassword, loginUser.getSalt(), loginUser.getPassword());
  }

}
