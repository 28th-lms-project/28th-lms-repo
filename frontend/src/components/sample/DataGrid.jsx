/** @format */

import { useEffect, useRef, useState } from "react";
import styles from "./Grid.module.css";
import { isMobile } from "../../utils/window";

export const DataGrid = ({
                             title,
                             conditionStyle,
                             headers,
                             ellipsis = true,
                             onSelect = () => {},
                             selectId,
                             contents = [],
                             clickEvents = {},
                             className = "",
                             style = {},
                         }) => {
    const columnWidth = headers
        .filter((h) => h.show)
        .map((h) => (h.width ? h.width : "1fr"))
        .join(" ");
    const [columnSize, setColumnSize] = useState();

    const ulRef = useRef();
    const [maxWidth, setMaxWidth] = useState("100%");

    const [rnd, setRnd] = useState();

    window.addResizeCallback(selectId, () => {
        setRnd(`${Math.random()}`);
    });

    useEffect(() => {
        setColumnSize(columnWidth);
    }, [columnWidth]);

    useEffect(() => {
        if (ulRef.current) {
            const containerWidth = ulRef.current.parentNode.scrollWidth;
            setMaxWidth(containerWidth);
        }
    }, [rnd]);

    return (
        <div
            style={{
                height: "100%",
                borderTop: "1px solid #ccc",
                borderBottom: "1px solid #ccc",
                overflow: "auto",
            }}
        >
            <div className={className} style={{ ...style, width: "100%" }}>
                <h3 className={styles.title}>{title}</h3>
                <ul
                    ref={ulRef}
                    className={styles.grid}
                    style={{
                        position: "relative",
                        fontSize: isMobile() ? "0.85rem" : "1rem",
                        // gridTemplateColumns: columnWidth,
                        maxWidth: maxWidth,
                        borderTop: 0,
                    }}
                >
                    <DataGridHeader
                        columnSize={columnSize}
                        setColumnSize={setColumnSize}
                        maxWidth={maxWidth}
                        headers={headers.filter((h) => h.show)}
                        ellipsis={ellipsis}
                    />
                    <li style={{ gridColumn: "1 / -1", padding: 0, maxWidth: maxWidth }}>
                        {contents.length === 0 && (
                            <div style={{ padding: "10px", textAlign: "center" }}>
                                등록된 데이터가 없습니다.
                            </div>
                        )}
                        {contents &&
                            contents.map((eachContent, rowIndex) => (
                                <ul
                                    key={`${eachContent.id}_row_${rowIndex}`}
                                    id={`${eachContent.id}_row_${rowIndex}`}
                                    className={`${styles.grid} ${
                                        selectId === `${eachContent.id}_row_${rowIndex}`
                                            ? styles.gridItemActive
                                            : ""
                                    }`}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: columnSize,
                                        padding: 0,
                                        margin: 0,
                                        border: 0,
                                        maxWidth: maxWidth,
                                    }}
                                >
                                    <DataGridContent
                                        key={eachContent.id}
                                        ellipsis={ellipsis}
                                        maxWidth={maxWidth}
                                        itemId={`${eachContent.id}_row_${rowIndex}`}
                                        rowIndex={rowIndex}
                                        eachContent={eachContent}
                                        headers={headers.filter((h) => h.show)}
                                        contentLength={contents.length}
                                        condition={conditionStyle?.condition}
                                        conditionStyle={conditionStyle?.style}
                                        clickEvents={clickEvents}
                                        onClick={onSelect}
                                    />
                                </ul>
                            ))}
                    </li>
                </ul>
            </div>
        </div>
    );
};

const DataGridHeader = ({
                            columnSize,
                            setColumnSize,
                            maxWidth,
                            headers,
                            checkable,
                            checkValue,
                            ellipsis,
                        }) => {
    const [mouseState, setMouseState] = useState({
        state: undefined,
        dom: undefined,
        headerIndex: undefined,
    });

    const changeSize = (width, headerIndex) => {
        const headerSplit = columnSize.split(" ");
        headerSplit[headerIndex] = `${width < 30 ? 30 : width}px`;
        setColumnSize(headerSplit.join(" "));
    };

    const onMouseUpHandler = () => {
        setMouseState({ state: undefined, dom: undefined, headerIndex: undefined });
    };
    const onMouseMoveHandler = (event) => {
        if (mouseState.state === "down") {
            const headerSplit = columnSize.split(" ");

            const prevWidth = parseInt(
                headerSplit[mouseState.headerIndex].replaceAll("px", ""),
            );
            changeSize(prevWidth + event.movementX, mouseState.headerIndex);
        }
    };

    return (
        <ul
            onMouseUp={onMouseUpHandler}
            onMouseMove={onMouseMoveHandler}
            style={{
                gridColumn: "1 / -1",
                width: "100%",
                margin: "0",
                padding: "0",
                display: "grid",
                position: "sticky",
                top: 0,
                //borderTop: "1px solid #ccc",
                backgroundColor: "#fff",
                gridTemplateColumns: columnSize,
                maxWidth: maxWidth,
            }}
        >
            {headers.map((item, index) => (
                <DataGridHeaderItem
                    key={item.id}
                    changeSize={changeSize}
                    headerIndex={index}
                    mouseState={mouseState}
                    setMouseState={setMouseState}
                    checkable={checkable}
                    checkValue={checkValue}
                    ellipsis={ellipsis}
                    item={item}
                    showSizer={headers.length - 1 > index}
                />
            ))}
        </ul>
    );
};

const DataGridHeaderItem = ({
                                changeSize = () => {},
                                headerIndex,
                                mouseState,
                                setMouseState,
                                checkable,
                                checkValue,
                                ellipsis,
                                item,
                                showSizer,
                            }) => {
    const itemRef = useRef();

    const onMouseDownHandler = () => {
        setMouseState({
            state: "down",
            dom: itemRef.current,
            headerIndex: headerIndex,
        });
        changeSize(itemRef.current.offsetWidth, headerIndex);
    };

    return (
        <li
            key={item.id}
            ref={itemRef}
            className={`${styles.gridColumn} ${ellipsis ? "ellipsis" : ""}`}
            data-index={checkable && checkValue ? headerIndex + 1 : headerIndex}
            style={{
                position: "relative",
                borderLeft:
                    (checkable && checkValue ? headerIndex + 1 : headerIndex) > 0
                        ? "1px dashed #e4e4e4"
                        : "0",
            }}
        >
            {item.title}
            {!isMobile() && showSizer && (
                <div
                    className="columnHeaderSizer"
                    data-status={mouseState}
                    onMouseDown={onMouseDownHandler}
                ></div>
            )}
        </li>
    );
};

const DataGridContent = ({
                             itemId,
                             ellipsis,
                             maxWidth,
                             onClick,
                             rowIndex,
                             eachContent,
                             headers,
                             contentLength,
                             condition,
                             conditionStyle,
                             clickEvents = {},
                         }) => {
    const conditionColumn = condition?.column;
    const conditionValue = condition?.value;
    let contentStyle = {};
    if (conditionColumn) {
        if (eachContent[conditionColumn] === conditionValue) {
            contentStyle = { ...conditionStyle };
        }
    }
    return (
        <>
            {headers.map(({ id: contentKey }, index) => (
                <Itembox
                    key={`${rowIndex}_${index}`}
                    rowIndex={rowIndex}
                    maxWidth={maxWidth}
                    ellipsis={ellipsis}
                    index={index}
                    contentStyle={contentStyle}
                    contentLength={contentLength}
                    content={eachContent[contentKey]}
                    rawContent={eachContent}
                    clickable={Object.prototype.hasOwnProperty.call(
                        clickEvents,
                        contentKey,
                    )}
                    onClick={(content, rawContent) => {
                        if (clickEvents[contentKey]) {
                            clickEvents[contentKey](content, rawContent);
                            onClick(itemId);
                        }
                    }}
                />
            ))}
        </>
    );
};

const Itembox = ({
                     rowIndex,
                     content,
                     rawContent,
                     ellipsis,
                     index,
                     contentStyle,
                     contentLength,
                     checkable,
                     clickable = false,
                     onClick = () => {},
                 }) => {
    const [hover, setHover] = useState(false);
    const hoverHandler = () => {
        if (clickable) {
            setHover(true);
        }
    };
    const houtHandler = () => {
        if (clickable) {
            setHover(false);
        }
    };
    return (
        <li
            className={`item ${ellipsis ? "ellipsis" : ""}`}
            data-row-index={rowIndex}
            onClick={() => {
                onClick(content, rawContent);
            }}
            style={{
                borderLeft:
                    (checkable ? index + 1 : index) > 0 ? "1px dashed #e4e4e4" : "0",
                borderBottom: rowIndex < contentLength - 1 ? "1px dashed #e4e4e4" : 0,
                padding: "10px",
                display: "inline-block",
                color: hover ? "#888" : "#333",
                textDecoration: hover ? "underline" : "none",
            }}
        >
            <div
                onMouseEnter={hoverHandler}
                onMouseOut={houtHandler}
                className={`${ellipsis ? "ellipsis" : ""}`}
                style={{
                    ...contentStyle,
                    cursor: clickable ? "pointer" : "default",
                }}
            >
                {content}
            </div>
        </li>
    );
};
