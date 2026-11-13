package com.learningworks.menu.dao;

import java.io.InputStream;
import java.lang.reflect.Method;
import java.util.Arrays;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.session.Configuration;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** DB 없이 매퍼 XML을 파싱해서, MenuDao의 모든 메서드에 SQL이 있는지 확인한다 */
class MenuDaoMapperTest {

  private static final String MAPPER = "com/learningworks/menu/dao/mapper/MenuDaoMapper.xml";

  @Test
  @DisplayName("MenuDaoMapper.xml이 파싱되고, MenuDao의 모든 메서드에 대응하는 SQL이 있다")
  void everyDaoMethodHasStatement() throws Exception {
    Configuration configuration = new Configuration();
    configuration.setMapUnderscoreToCamelCase(true);
    try (InputStream xml = this.getClass().getClassLoader().getResourceAsStream(MAPPER)) {
      new XMLMapperBuilder(xml, configuration, MAPPER, configuration.getSqlFragments()).parse();
    }

    Assertions.assertThat(Arrays.stream(MenuDao.class.getDeclaredMethods()).map(Method::getName))
        .allSatisfy(name -> Assertions.assertThat(configuration
            .hasStatement(MenuDao.class.getName() + "." + name)).as(name).isTrue());
  }

}
