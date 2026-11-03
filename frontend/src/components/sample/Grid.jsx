/** @format */

import {
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import styles from "./Grid.module.css";
import { IconButton } from "./input/IconButton";
import { icons } from "./input/icons";
import { isMobile } from "../../utils/window";

export const UpdateableGrid = ({
                                   ref,
                                   checkIdName,
                                   checkValueIndex = 0,
                                   title = "",
                                   columnStyle,
                                   colShowHide,
                                   header = [],
                                   content = [],
                                   footer,
                                   style = {},
                                   className = "",
                                   clickableColumn = {},
                                   doubleClickColumnIndex = [],
                                   onSaveClick = () => {},
                               }) => {
    const [editableContent, setEditableContent] = useState([]);
    const originalContent = JSON.parse(JSON.stringify(content));

    const gridRef = useRef();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEditableContent(JSON.parse(JSON.stringify(content)));
    }, [content]);

    useImperativeHandle(ref, () => ({
        ...gridRef.current,
        getFullData(idConverter = (id) => id) {
            return JSON.parse(JSON.stringify(editableContent)).map((d) => {
                const newD = d.map((d2) => {
                    let id = idConverter(d2.id);
                    return { ...d2, id: id };
                });
                return newD;
            });
        },
        getAddedData(idConverter) {
            const tempData = this.getFullData(idConverter);
            return tempData.filter((item) => item[checkValueIndex].type === "add");
        },
        getDeletedData(idConverter) {
            const tempData = this.getFullData(idConverter);
            return tempData.filter((item) => item[checkValueIndex].type === "del");
        },
        getModifiedData(idConverter) {
            const tempData = this.getFullData(idConverter);
            return tempData.filter((item) => item[checkValueIndex].type === "modify");
        },
    }));

    const onSaveClickHandler = (
        checkId,
        contentId,
        prevText,
        newText,
        rowIndex,
        index,
    ) => {
        setEditableContent((prevContent) => {
            const newContent = [...prevContent];
            newContent[rowIndex][index].value = newText;
            if (!newContent[rowIndex][checkValueIndex].type) {
                newContent[rowIndex][checkValueIndex].type = "modify";
            }

            if (newContent[rowIndex][checkValueIndex].type === "modify") {
                newContent[rowIndex][index].prevValue =
                    originalContent[rowIndex][index].value;
            }
            return newContent;
        });
    };

    const onDeleteClickHandler = () => {
        const checkedRows = gridRef.current.getChecked();

        setEditableContent((prevContent) => {
            return prevContent
                .map((row) => {
                    const isDel = checkedRows.includes(row[checkValueIndex][checkIdName]);
                    if (isDel && row[checkValueIndex].type === "add") {
                        return undefined;
                    } else if (isDel && row[checkValueIndex].type === "modify") {
                        const cleanData = originalContent.find((item) => {
                            return (
                                item[checkValueIndex][checkIdName] ===
                                row[checkValueIndex][checkIdName]
                            );
                        });
                        cleanData[checkValueIndex].type = "del";
                        cleanData[checkValueIndex].del = true;
                        return [...cleanData];
                    } else if (checkedRows.includes(row[checkValueIndex][checkIdName])) {
                        row[checkValueIndex].type = "del";
                        row[checkValueIndex].del = true;
                        return row;
                    } else if (row[checkValueIndex].del) {
                        const cleanData = originalContent.find((item) => {
                            return (
                                item[checkValueIndex][checkIdName] ===
                                row[checkValueIndex][checkIdName]
                            );
                        });
                        return [...cleanData];
                    } else {
                        return row;
                    }
                })
                .filter((item) => item !== undefined);
        });
    };

    const onAddRowClickHandler = () => {
        setEditableContent((prev) => {
            const newData = [];
            header.forEach((head) => {
                newData.push({
                    id: head.id,
                    keyName: head.id,
                    value: "",
                    type: "add",
                    pk: head.pk,
                });
            });

            return [...prev, newData];
        });
    };

    return (
        <div
            style={{
                position: "relative",
                display: "grid",
                gridTemplateRows: "1fr minmax(30px, auto)",
                gap: "10px",
                height: "100%",
            }}
        >
            <div
                style={{
                    overflow: "auto",
                    flexGrow: "1",
                    borderBottom: "1px solid #ccc",
                }}
            >
                <Grid
                    ref={gridRef}
                    checkable={true}
                    checkIdName={checkIdName}
                    checkValueIndex={checkValueIndex}
                    onCheck={onDeleteClickHandler}
                    title={title}
                    columnStyle={columnStyle}
                    colShowHide={colShowHide}
                    header={header}
                    content={editableContent}
                    footer={footer}
                    style={{ ...style }}
                    className={className}
                    editable={true}
                    doubleClickColumnIndex={doubleClickColumnIndex}
                    clickableColumn={clickableColumn}
                    onChange={onSaveClickHandler}
                />
            </div>
            <div
                className="horizontal-list"
                style={{
                    justifyContent: "flex-end",
                    gap: "10px",
                    position: "absolute",
                    bottom: "0",
                    right: "0",
                    left: "0",
                    backgroundColor: "#fff",
                }}
            >
                <IconButton icon={icons.add} onClick={onAddRowClickHandler}>
                    추가
                </IconButton>
                <IconButton
                    icon={icons.ok}
                    onClick={() => {
                        onSaveClick();
                    }}
                >
                    저장
                </IconButton>
            </div>
        </div>
    );
};

export const Grid = ({
                         ref,
                         checkable = false,
                         checkIdName,
                         checkValueIndex = 0,
                         onCheck = () => {},
                         title = "",
                         columnStyle,
                         colShowHide,
                         header = [],
                         content = [],
                         footer,
                         style = {},
                         className = "",
                         editable = false,
                         clickableColumn = {},
                         doubleClickColumnIndex = [],
                         onChange = () => {},
                     }) => {
    const [columnSize, setColumnSize] = useState();

    const [editCount, setEditCount] = useState(0);
    const contentLength = content.length === 0 ? 0 : content[0].length;

    const checkboxes = useRef([]);
    const doms = useRef([]);
    // eslint-disable-next-line react-hooks/purity
    const [, setRefresh] = useState(Math.random());

    useEffect(() => {
        checkboxes.current = [];
        doms.current = [];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRefresh(Math.random());
    }, [contentLength]);

    useEffect(() => {
        // eslint-disable-next-line no-useless-assignment
        let columnWidth = "";
        if (colShowHide) {
            columnWidth = colShowHide
                .filter((c) => c.show)
                .map((c) => c.width)
                .join(" ");
        } else {
            columnWidth = columnStyle ?? header.map(() => "1fr").join(" ");
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setColumnSize(columnWidth);
    }, [columnStyle, header, colShowHide]);

    const refs = useCallback((element, rowIndex, colIndex) => {
        if (element) {
            if (!doms.current[rowIndex]) {
                doms.current[rowIndex] = [];
            }
            doms.current[rowIndex][colIndex] = element;
        }
    }, []);
    const checkboxRefs = useCallback((element, rowIndex) => {
        if (element) {
            checkboxes.current[rowIndex] = element;
        }
    }, []);

    const allCheckRef = useRef();
    useImperativeHandle(ref, () => ({
        getChecked() {
            if (checkable && checkIdName) {
                return checkboxes.current.filter((r) => r.checked).map((r) => r.value);
            }
        },
        allCheck() {
            if (checkable && checkIdName) {
                allCheckRef.current.click();
            }
        },
    }));

    const items = [];

    content.forEach((item, rowIndex) => {
        if (checkable && checkIdName) {
            if (!items[rowIndex]) {
                items[rowIndex] = [];
            }

            items[rowIndex].push(
                <li
                    key={`${item[checkValueIndex][checkIdName]}_check`}
                    ref={(element) => refs(element, rowIndex, 0)}
                    data-key={`${item[checkValueIndex][checkIdName]}_check`}
                    data-row-index={rowIndex}
                    className={`item ${styles.gridColumnCell}`}
                    style={{
                        backgroundColor: item[checkValueIndex]?.del
                            ? "#faa"
                            : "transparent",
                    }}
                >
                    <input
                        type="checkbox"
                        value={item[checkValueIndex].id}
                        style={{ margin: "0" }}
                        ref={(element) => checkboxRefs(element, rowIndex)}
                        onChange={(event) => {
                            const checkboxCount = checkboxes.current.length;
                            const checkedCount = checkboxes.current.filter(
                                (r) => r.checked,
                            ).length;

                            onCheck(event.target.value);

                            allCheckRef.current.checked = checkboxCount === checkedCount;
                        }}
                    />
                </li>,
            );
        }
        item.forEach((content, index) => {
            if (!items[rowIndex]) {
                items[rowIndex] = [];
            }

            if (colShowHide) {
                const col = colShowHide.find((c) => c.id === content.keyName);
                if (col && !col.show) {
                    return;
                }
            }

            items[rowIndex].push(
                <Itembox
                    key={`${rowIndex}_${content.id}_${index}`}
                    ref={(element) =>
                        refs(
                            element,
                            rowIndex,
                            checkable && checkIdName ? index + 1 : index,
                        )
                    }
                    del={item[checkValueIndex]?.del ? true : false}
                    checkId={item[checkValueIndex]}
                    rowIndex={rowIndex}
                    content={content}
                    index={index}
                    contentLength={contentLength}
                    editable={editable}
                    editCount={editCount}
                    checkable={checkable && checkIdName}
                    setEditCount={setEditCount}
                    onChange={onChange}
                    clickable={Object.prototype.hasOwnProperty.call(
                        clickableColumn,
                        index,
                    )}
                    doubleClickColumnIndex={doubleClickColumnIndex}
                    onClickClickable={clickableColumn[index]}
                />,
            );
        });
    });

    return (
        <div className={className} style={{ style }}>
            <h3 className={styles.title}>{title}</h3>
            <ul
                className={styles.grid}
                style={{
                    borderTop: "0",
                    gridTemplateColumns:
                        checkable && checkIdName ? "50px " + columnSize : columnSize,
                }}
            >
                <GridHeader
                    checkable={checkable}
                    checkIdName={checkIdName}
                    columnSize={columnSize}
                    colShowHide={colShowHide}
                    allCheckRef={allCheckRef}
                    checkboxes={checkboxes}
                    header={header}
                    setColumnSize={setColumnSize}
                    onCheck={onCheck}
                />
                {items.map((list, index) => (
                    <ul
                        key={`item-list-row-${index}`}
                        className={`${styles.grid} ${styles.gridItem}`}
                        style={{
                            gridTemplateColumns:
                                checkable && checkIdName ? "50px " + columnSize : columnSize,
                            backgroundColor: list[checkValueIndex].del ? "#faa" : "",
                        }}
                    >
                        {list}
                    </ul>
                ))}
            </ul>
            {footer && <div className={styles.footer}>{footer}</div>}
        </div>
    );
};

const GridHeader = ({
                        checkable,
                        checkIdName,
                        columnSize,
                        colShowHide,
                        allCheckRef,
                        checkboxes,
                        header,
                        setColumnSize = () => {},
                        onCheck = () => {},
                    }) => {
    const [mouseState, setMouseState] = useState({
        state: undefined,
        dom: undefined,
        headerIndex: undefined,
    });

    const [newHeader, setNewHeader] = useState(
        JSON.parse(JSON.stringify(header)),
    );

    useEffect(() => {
        if (colShowHide) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setNewHeader(() => {
                return header.filter((hd) => {
                    const col = colShowHide.find((c) => c.id === hd.title);
                    return col && col.show;
                });
            });
        }
    }, [header, colShowHide]);

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
            className={styles.grid}
            onMouseUp={onMouseUpHandler}
            onMouseMove={onMouseMoveHandler}
            style={{
                position: "sticky",
                top: "0px",
                gridColumn: "1 / -1",
                gridTemplateColumns:
                    checkable && checkIdName ? "50px " + columnSize : columnSize,
                borderTop: "1px solid #ccc",
            }}
        >
            {checkable && checkIdName && (
                <li className={styles.gridColumnCell} data-index={0}>
                    <input
                        type="checkbox"
                        ref={allCheckRef}
                        style={{ margin: "0" }}
                        onChange={() => {
                            checkboxes.current.forEach(
                                (r) => (r.checked = allCheckRef.current.checked),
                            );

                            onCheck();
                        }}
                    />
                </li>
            )}
            {newHeader.map((item, index) => {
                return (
                    <GridHeaderItem
                        changeSize={changeSize}
                        showSizer={newHeader.length - 1 > index}
                        headerStyle={columnSize}
                        setHeaderStyle={setColumnSize}
                        key={item.id}
                        headerIndex={index}
                        index={checkable && checkIdName ? index + 1 : index}
                        item={item}
                        mouseState={mouseState}
                        setMouseState={setMouseState}
                    />
                );
            })}
        </ul>
    );
};

const GridHeaderItem = ({
                            changeSize = () => {},
                            showSizer = true,
                            item,
                            headerIndex,
                            index,
                            mouseState,
                            setMouseState = () => {},
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
            ref={itemRef}
            className={`${styles.gridColumnCell} ellipsis`}
            data-index={index}
            style={{
                position: "relative",
                fontWeight: 800,
                borderLeft: index > 0 ? "1px dashed #e4e4e4" : "0",
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

const Itembox = ({
                     ref,
                     rowIndex,
                     content,
                     del,
                     checkId,
                     index,
                     editable,
                     editCount,
                     checkable,
                     setEditCount,
                     clickable = false,
                     doubleClickColumnIndex = [],
                     onClickClickable = () => {},
                     onChange,
                 }) => {
    const editBoxRef = useRef();
    const [visibleTextbox, setVisibleTextbox] = useState(false);

    const doubleClickHandler = (index) => {
        if (!editable || editCount > 0 || clickable || del) {
            return;
        }

        if (doubleClickColumnIndex.includes(index)) {
            setEditCount(1);
            setVisibleTextbox(true);
        }
    };

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
            ref={ref}
            data-row-index={rowIndex}
            data-id={content.id}
            data-index={index}
            data-key={`${rowIndex}_${content.id}`}
            data-row={`${styles.grid}_${rowIndex}`}
            className="item ellipsis"
            data-default-text={content.value}
            style={{
                borderLeft:
                    (checkable ? index + 1 : index) > 0 ? "1px dashed #e4e4e4" : "0",
                borderBottom: "1px dashed #e4e4e4",
                padding: visibleTextbox ? 0 : "10px",
                display: visibleTextbox ? "flex" : "inline-block",
                backgroundColor: del ? "#faa" : "transparent",
            }}
        >
            {visibleTextbox ? (
                <Editbox
                    defaultText={content.value}
                    ref={editBoxRef}
                    onSave={() => {
                        if (content.value !== editBoxRef.current.value) {
                            onChange(
                                checkId,
                                content.id,
                                content.value,
                                editBoxRef.current.value,
                                rowIndex,
                                index,
                            );
                        }
                        setVisibleTextbox(false);
                        setEditCount(0);
                    }}
                />
            ) : (
                <div
                    onMouseEnter={hoverHandler}
                    onMouseOut={houtHandler}
                    className="ellipsis"
                    style={{
                        maxWidth: "100%",
                        height: "100%",
                        cursor: clickable ? "pointer" : "default",
                        color: hover ? "#888" : del ? "#fff" : "#333",
                        textDecoration: hover ? "underline" : "none",
                    }}
                    onClick={onClickClickable.bind(this, content.value)}
                    onDoubleClick={doubleClickHandler.bind(this, index)}
                >
                    {content.value}
                </div>
            )}
        </li>
    );
};

const Editbox = ({ defaultText, ref, onSave, onCancel }) => {
    useEffect(() => {
        ref.current.focus();
    }, [ref]);

    return (
        <div style={{ display: "flex", width: "100%" }}>
            <input
                type="text"
                defaultValue={defaultText}
                ref={ref}
                className={styles.input}
            />
            <button
                type="button"
                onClick={onSave}
                className={styles.button}
                style={{
                    backgroundColor: "#45F",
                    color: "#FFF",
                }}
            >
                OK
            </button>
            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    className={styles.button}
                    style={{
                        backgroundColor: "#F45",
                        color: "#FFF",
                    }}
                >
                    X
                </button>
            )}
        </div>
    );
};
