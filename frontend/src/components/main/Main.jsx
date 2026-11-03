import PageContainer from "../common/PageContainer";
import styles from "./Main.module.css";

export default function Main() {
  return (
    <PageContainer>
      <div className={styles.dashboard}>
        <div className={styles.contentContainer}>
          <h3 className={styles.contentTitle}>오늘의 스케쥴 - 시간표</h3>
        </div>
        <div className={styles.contentContainer}>
          <h3 className={styles.contentTitle}>오늘의 출결 현황</h3>
        </div>
        <div className={styles.contentContainer}>
          <h3 className={styles.contentTitle}>진행 중인 시험</h3>
        </div>
        <div className={styles.contentContainer}>
          <h3 className={styles.contentTitle}>진행 중인 과제</h3>
        </div>
      </div>
    </PageContainer>
  );
}
