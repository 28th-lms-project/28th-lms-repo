/** @format */
/* 기록용 (archive): 표준화 전 모습을 남긴 코드. 새 코드에서 import 금지(lint로 막음) · 고치지 않음. 대체: common/ui/Pagination. 안내: components/archive/README.md */

import styles from "./Paginator.module.css";

export const Paginator = ({
                              id,
                              start,
                              countPerPageGroup = 10,
                              activePage,
                              setActivePage,
                              totalPageCount,
                          }) => {
    const pageClickHandler = (pageNumber) => {
        setActivePage(pageNumber);
    };

    const pageList = [];
    if (start / countPerPageGroup >= 1) {
        pageList.push(
            <li key={`page_${id}_0`} onClick={pageClickHandler.bind(this, 0)}>
                처음
            </li>,
        );
        pageList.push(
            <li
                key={`page_prev_${id}_${start - 1}`}
                onClick={pageClickHandler.bind(this, start - 1)}
            >
                이전
            </li>,
        );
    }
    let end = start + countPerPageGroup;
    if (end > totalPageCount) {
        end = totalPageCount;
    }
    for (let i = start; i < end; i++) {
        pageList.push(
            <li
                key={`page_${id}_${i}`}
                className={`${activePage === i ? styles.active : ""}`}
                onClick={pageClickHandler.bind(this, i)}
            >
                {i + 1}
            </li>,
        );
    }
    if (end < totalPageCount) {
        pageList.push(
            <li key={`page_${id}_${end}`} onClick={pageClickHandler.bind(this, end)}>
                다음
            </li>,
        );
        pageList.push(
            <li
                key={`page_${id}_${totalPageCount}`}
                onClick={pageClickHandler.bind(this, totalPageCount - 1)}
            >
                마지막
            </li>,
        );
    }

    return <ul className={styles.pageList}>{pageList}</ul>;
};
