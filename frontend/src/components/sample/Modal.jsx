/** @format */

import { useImperativeHandle, useRef, useState } from "react";
import styles from "./Modal.module.css";
import { createPortal } from "react-dom";
import { IconButton } from "./input/IconButton";
import { icons } from "./input/icons";

export const Alert = ({
                          ref,
                          title,
                          content,
                          draggable = false,
                          children,
                          buttonText = "OK",
                          buttonIcon = icons.ok,
                          full = false,
                          immediatlyOpen = false,
                          contentStyle = {},
                          appendButtons = [],
                          showButtons = true,
                          onBeforeLoad = () => {},
                          onClickOk = () => {},
                      }) => {
    const [down, setDown] = useState(false);
    const [open, setOpen] = useState(immediatlyOpen);

    const style = { display: open ? "flex" : "none" };

    const mouseDownHandler = () => {
        if (!draggable) {
            return;
        }
        alertRef.current.style.position = "absolute";
        setDown(true);
    };
    const mouseUpHandler = () => {
        if (!draggable) {
            return;
        }

        setDown(false);
    };
    const mouseMoveHandler = (event) => {
        if (!draggable) {
            return;
        }

        if (down) {
            const offsetTop = alertRef.current.offsetTop;
            const offsetLeft = alertRef.current.offsetLeft;

            alertRef.current.style.top = `${offsetTop + event.movementY}px`;
            alertRef.current.style.left = `${offsetLeft + event.movementX}px`;
        }
    };

    const clickHandler = () => {
        const result = onClickOk();
        if (result === undefined || result === true) {
            setOpen(false);
            alertRef.current.style.position = "";
            alertRef.current.style.top = "";
            alertRef.current.style.left = "";
        }
    };

    const alertRef = useRef();
    useImperativeHandle(ref, () => ({
        open() {
            onBeforeLoad();
            setOpen(true);
        },
        close() {
            setOpen(false);

            if (alertRef.current) {
                alertRef.current.style.position = "";
                alertRef.current.style.top = "";
                alertRef.current.style.left = "";
            }
        }
    }));

    return createPortal(
        // 다크 모드(샘플 페이지)에서도 밝게: 색을 직접 적은 모달이라 토큰을 따르지 않음
        <div className={styles.modalWrapper} style={style} data-color-scheme="light">
            <div
                className={`${styles.alert} ${full ? styles.fullAlert : ""}`}
                ref={alertRef}
                style={{
                    cursor: draggable ? (down ? "grabbing" : "grab") : "default",
                }}
                onMouseDown={mouseDownHandler}
                onMouseUp={mouseUpHandler}
                onMouseMove={mouseMoveHandler}
                onMouseLeave={mouseUpHandler}
            >
                <div className={`${styles.title} ${full ? styles.titleFull : ""}`}>
                    {title}
                </div>
                <div
                    className={`${styles.content} ${full ? styles.contentFull : ""}`}
                    style={contentStyle}
                >
                    {children ?? content}
                </div>
                {showButtons && (
                    <div
                        className={`${styles.buttonGroup} ${full ? styles.buttonGroupFull : ""}`}
                    >
                        {appendButtons}
                        <IconButton icon={buttonIcon} onClick={clickHandler}>
                            {buttonText}
                        </IconButton>
                    </div>
                )}
            </div>
        </div>,
        document.querySelector("#modals"),
    );
};

export const Confirm = ({
                            ref,
                            title,
                            content,
                            draggable = false,
                            children,
                            positiveButtonText = "Ok",
                            negativeButtonText = "Cancel",
                            confirmStyle = {},
                            onBeforeLoad = () => {},
                            onClickPositive = () => {},
                            onClickNegative = () => {},
                        }) => {
    const [down, setDown] = useState(false);
    const [open, setOpen] = useState(false);

    const style = { display: open ? "flex" : "none" };

    const mouseDownHandler = () => {
        if (!draggable) {
            return;
        }
        alertRef.current.style.position = "absolute";
        setDown(true);
    };
    const mouseUpHandler = () => {
        if (!draggable) {
            return;
        }

        setDown(false);
    };
    const mouseMoveHandler = (event) => {
        if (!draggable) {
            return;
        }

        if (down) {
            const offsetTop = alertRef.current.offsetTop;
            const offsetLeft = alertRef.current.offsetLeft;

            alertRef.current.style.top = `${offsetTop + event.movementY}px`;
            alertRef.current.style.left = `${offsetLeft + event.movementX}px`;
        }
    };

    const clickPositiveHandler = () => {
        setOpen(false);
        alertRef.current.style.position = "";
        alertRef.current.style.top = "";
        alertRef.current.style.left = "";
        onClickPositive();
    };

    const clickNegativeHandler = () => {
        setOpen(false);
        alertRef.current.style.position = "";
        alertRef.current.style.top = "";
        alertRef.current.style.left = "";
        onClickNegative();
    };

    const alertRef = useRef();
    useImperativeHandle(ref, () => ({
        open() {
            onBeforeLoad();
            setOpen(true);
        },
        close() {
            setOpen(false);
            alertRef.current.style.position = "";
            alertRef.current.style.top = "";
            alertRef.current.style.left = "";
        },
    }));

    return createPortal(
        // 다크 모드(샘플 페이지)에서도 밝게: 색을 직접 적은 모달이라 토큰을 따르지 않음
        <div className={styles.modalWrapper} style={style} data-color-scheme="light">
            <div
                className={`${styles.alert}`}
                ref={alertRef}
                style={{
                    cursor: draggable ? (down ? "grabbing" : "grab") : "default",
                }}
                onMouseDown={mouseDownHandler}
                onMouseUp={mouseUpHandler}
                onMouseMove={mouseMoveHandler}
                onMouseLeave={mouseUpHandler}
            >
                <div className={styles.title}>{title}</div>
                <div className={styles.content} style={confirmStyle}>
                    {children ?? content}
                </div>
                <div className={styles.buttonGroup}>
                    <IconButton
                        icon={icons.ok}
                        iconSize={14}
                        onClick={clickPositiveHandler}
                    >
                        {positiveButtonText}
                    </IconButton>
                    <IconButton
                        icon={icons.close}
                        iconSize={14}
                        onClick={clickNegativeHandler}
                    >
                        {negativeButtonText}
                    </IconButton>
                </div>
            </div>
        </div>,
        document.getElementById("modals") ||
        document.getElementById("root")
    );
};
