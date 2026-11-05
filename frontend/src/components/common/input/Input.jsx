/** @format */

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import styles from "./Input.module.css";
import { Grid } from "../Grid";
import { Icon, IconButton } from "./IconButton";
import { icons } from "./icons";

const inputStyle = {
    width: "100%",
    outline: "0",
    border: "1px solid #ddd",
    borderRadius: "7px",
    padding: "10px",
    height: "43.5px",
    cursor: "text",
};

const specialKeys = [
    "Tab",
    "CapsLock",
    "Control",
    "Meta",
    "Shift",
    "Alt",
    "Escape",
    "Backspace",
    "Delete",
    "Insert",
    "Home",
    "End",
    "Clear",
    "PageUp",
    "PageDown",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(
        (n) => "F" + n,
    ),
];

const HANGUL_REGEX = /[\u3130-\u318F\uAC00-\uD7AF]/g;

const stripHangul = (value = "") => value.replace(HANGUL_REGEX, "");

const moveCaretToEnd = (element) => {
    if (!element || typeof window === "undefined") {
        return;
    }

    const selection = window.getSelection();
    if (!selection) {
        return;
    }

    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
};

export const Id = ({ ref, id = Math.random(), label, style = {} }) => {
    const [val, setVal] = useState("");
    const inputRef = useRef();
    useImperativeHandle(ref, () => {
        return { value: val };
    });

    const syncValue = (target) => {
        const currentValue = target?.textContent ?? "";
        const nextValue = stripHangul(currentValue);

        if (target && currentValue !== nextValue) {
            target.textContent = nextValue;
            moveCaretToEnd(target);
        }

        setVal(nextValue);
    };

    const onKeyDownHandler = (event) => {
        if (event.isComposing || event.key === "Process") {
            event.preventDefault();
            return;
        }

        if (/^[가-힣]$/.test(event.key)) {
            event.preventDefault();
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            return;
        }

        if (specialKeys.includes(event.key)) {
            return;
        }
    };

    const onBeforeInputHandler = (event) => {
        const incomingText = event.data ?? "";
        if (incomingText && HANGUL_REGEX.test(incomingText)) {
            event.preventDefault();
        }
    };

    const onPasteHandler = (event) => {
        event.preventDefault();

        const clipboardText = event.clipboardData?.getData("text/plain") ?? "";
        const sanitizedText = stripHangul(clipboardText);

        if (!sanitizedText) {
            return;
        }

        const target = event.currentTarget;
        const selection = window.getSelection();

        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(sanitizedText));
            range.setStartAfter(range.endContainer);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            target.textContent = `${target.textContent ?? ""}${sanitizedText}`;
        }

        syncValue(target);
    };

    const onInputHandler = (event) => {
        syncValue(event.currentTarget);
    };

    return (
        <div style={{ ...style, position: "relative" }}>
            {val.length === 0 && (
                <label
                    htmlFor={id}
                    onClick={() => {
                        inputRef.current.focus();
                    }}
                    style={{
                        cursor: "text",
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        color: "#999",
                    }}
                >
                    {label}
                </label>
            )}

            <div
                ref={inputRef}
                id={id}
                contentEditable={true}
                onBeforeInput={onBeforeInputHandler}
                onKeyDown={onKeyDownHandler}
                onPaste={onPasteHandler}
                onInput={onInputHandler}
                style={{
                    ...inputStyle,
                    ...style,
                    overflow: "hidden",
                    width: "100%",
                    whiteSpace: "nowrap",
                }}
            ></div>
        </div>
    );
};

export const Password = ({ ref, id = Math.random(), label, style = {} }) => {
    const [val, setVal] = useState("");
    const inputRef = useRef();
    useImperativeHandle(ref, () => {
        return { value: val };
    });

    const syncValue = (target) => {
        const currentValue = target?.textContent ?? "";
        const nextValue = stripHangul(currentValue);

        if (target && currentValue !== nextValue) {
            target.textContent = nextValue;
            moveCaretToEnd(target);
        }

        setVal(nextValue);
    };

    const onKeyDownHandler = (event) => {
        if (event.isComposing || event.key === "Process") {
            event.preventDefault();
            return;
        }

        if (/^[가-힣]$/.test(event.key)) {
            event.preventDefault();
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            return;
        }

        if (specialKeys.includes(event.key)) {
            return;
        }
    };

    const onBeforeInputHandler = (event) => {
        const incomingText = event.data ?? "";
        if (incomingText && HANGUL_REGEX.test(incomingText)) {
            event.preventDefault();
        }
    };

    const onPasteHandler = (event) => {
        event.preventDefault();

        const clipboardText = event.clipboardData?.getData("text/plain") ?? "";
        const sanitizedText = stripHangul(clipboardText);

        if (!sanitizedText) {
            return;
        }

        const target = event.currentTarget;
        const selection = window.getSelection();

        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(sanitizedText));
            range.setStartAfter(range.endContainer);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            target.textContent = `${target.textContent ?? ""}${sanitizedText}`;
        }

        syncValue(target);
    };

    const onInputHandler = (event) => {
        syncValue(event.currentTarget);
    };

    return (
        <div style={{ ...style, position: "relative" }}>
            {val.length === 0 && (
                <label
                    htmlFor={id}
                    onClick={() => {
                        inputRef.current.focus();
                    }}
                    style={{
                        cursor: "text",
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        color: "#999",
                    }}
                >
                    {label}
                </label>
            )}

            <div
                id={id}
                ref={inputRef}
                contentEditable={true}
                onBeforeInput={onBeforeInputHandler}
                onKeyDown={onKeyDownHandler}
                onPaste={onPasteHandler}
                onInput={onInputHandler}
                style={{
                    ...inputStyle,
                    overflow: "hidden",
                    width: "100%",
                    whiteSpace: "nowrap",
                    WebkitTextSecurity: "disc",
                    WebkitAppearance: "textfield",
                    WebkitUserSelect: "text",
                }}
            ></div>
        </div>
    );
};

export const Checkbox = ({
                             ref,
                             id,
                             className,
                             name,
                             checked = false,
                             value,
                             disabled = false,
                             styleType = "checked",
                             onChange = () => {},
                             labelText,
                         }) => {
    const inputRef = useRef({ checked: checked });
    useImperativeHandle(ref, () => ({
        checked: inputRef.current.checked,
        value: inputRef.current.value,
        check: (checked) => {
            setIsChecked(checked);
        },
        refresh: (checked) => {
            setIsChecked(checked);
        },
    }));

    const [isChecked, setIsChecked] = useState(checked);

    useEffect(() => {
        inputRef.current.checked = checked;
        setIsChecked(checked);
    }, [checked, id]);

    const changeHandler = () => {
        setIsChecked(isChecked);
        if (disabled) {
            return;
        }
        setIsChecked(inputRef.current.checked);
        onChange(inputRef.current);
    };

    const clickHandler = () => {
        if (disabled) {
            return;
        }

        inputRef.current.checked = !inputRef.current.checked;
        setIsChecked(inputRef.current.checked);
        onChange(inputRef.current);
    };

    return (
        <div className={styles.checkbox}>
            {labelText && <label htmlFor={id}>{labelText}</label>}
            <input
                type="checkbox"
                className={`${className ?? ""}`}
                id={id}
                data-id={id}
                data-name={name}
                data-input-type="checkbox"
                ref={inputRef}
                value={value}
                name={name}
                checked={isChecked}
                //defaultChecked={checked}
                onChange={changeHandler}
            />
            {styleType === "checked" && (
                <Icon
                    onClick={clickHandler}
                    iconSize={20}
                    iconColor="#666"
                    icon={isChecked ? icons.checked : icons.unchecked}
                />
            )}
            {styleType === "onoff" && (
                <div className={styles.checkboxOver} onClick={clickHandler}>
                    <div className={styles.whiteCircle}></div>
                </div>
            )}
        </div>
    );
};

export const Radio = ({
                          ref,
                          id,
                          className,
                          name,
                          checked = false,
                          value,
                          styleType = "checked",
                          onChange = () => {},
                          labelText,
                      }) => {
    const inputRef = useRef();

    useImperativeHandle(ref, () => inputRef.current);

    const clickHandler = () => {
        inputRef.current.checked = !inputRef.current.checked;
        onChange(inputRef.current);
    };

    return (
        <div className={styles.radio}>
            {labelText && <label htmlFor={id}>{labelText}</label>}
            <input
                type="radio"
                className={`${className}`}
                id={id}
                data-id={id}
                data-name={name}
                data-input-type="radio"
                ref={inputRef}
                value={value}
                name={name}
                checked={checked}
                onChange={onChange}
            />
            {styleType === "checked" && (
                <Icon
                    onClick={clickHandler}
                    iconSize={20}
                    iconColor="#666"
                    icon={
                        inputRef.current?.checked
                            ? icons.radioChecked
                            : icons.radioUnChecked
                    }
                />
            )}
            {styleType === "onoff" && (
                <div className={styles.checkboxOver} onClick={clickHandler}>
                    <div className={styles.whiteCircle}></div>
                </div>
            )}
        </div>
    );
};
export const TextField = ({
                              ref,
                              matchRef,
                              type = "text",
                              id,
                              className,
                              name,
                              placeholder,
                              value,
                              onChange = () => {},
                              onMatch = () => {},
                              labelText,
                              style = {},
                          }) => {
    const matchHandler = () => {
        if (matchRef?.current) {
            onMatch(ref.current.value === matchRef.current.value);
        }
    };

    return (
        <span style={{ position: "relative" }}>
      <input
          type={type}
          className={`${className} ${styles.text}`}
          style={style}
          id={`${id}`}
          data-id={id}
          data-name={name}
          data-input-type="text"
          ref={ref}
          name={`${name}`}
          placeholder={placeholder}
          value={value}
          onInput={matchHandler}
          onChange={onChange}
      />
            {labelText && (
                <label className={styles.text} htmlFor={id}>
                    {labelText}
                </label>
            )}
    </span>
    );
};

export const NativeSelect = ({
                                 ref,
                                 id,
                                 className,
                                 name,
                                 onChange = () => {},
                                 labelText,
                                 withDefault = false,
                                 defaultText = "선택하세요.",
                                 defaultValue = "",
                                 options = [],
                             }) => {
    return (
        <>
            {labelText && <label htmlFor={id}>{labelText}</label>}
            <select
                ref={ref}
                className={`${className} ${styles.select}`}
                id={id}
                data-id={id}
                data-name={name}
                data-input-type="select"
                onChange={onChange}
            >
                {withDefault && <option value={defaultValue}>{defaultText}</option>}
                {options.map(({ id, value, text, selected }) => (
                    <option key={id} value={value} selected={selected}>
                        {text}
                    </option>
                ))}
            </select>
        </>
    );
};

const mediaType = {
    img: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
    audio: ["mp3"],
    video: ["mp4"],
    other: [],
};

export const FileField = ({
                              ref,
                              id,
                              className,
                              name,
                              preview = false,
                              multiple = false,
                              placeholder,
                              value,
                              style = {},
                              onChange = () => {},
                              labelText,
                          }) => {
    const [_2, setLoaded] = useState(false);
    const [_, setLoad] = useState(0);
    const [file, setFile] = useState([]);

    const changeHandler = () => {
        if (!preview) {
            return;
        }
        setLoaded(false);
        onChange();

        const files = ref.current.files;

        setFile(() => {
            const newState = [];
            Array.from(files).forEach((f) => {
                const fileObj = {};
                fileObj.id = `${Math.random()}_${f.size}`;
                fileObj.lastModifiedDate = f.lastModifiedDate;
                fileObj.name = f.name;
                fileObj.size = `${(f.size / 1024 / 1024).toFixed(2)}mb`;
                fileObj.ext = f.name
                    .toLowerCase()
                    .substring(f.name.lastIndexOf(".") + 1);
                fileObj.loaded = false;
                const reader = new FileReader();
                reader.onload = (e) => {
                    setLoaded(true);
                    setLoad(Math.random);
                    fileObj.loaded = true;
                    fileObj.data = e.target.result;
                };
                reader.readAsDataURL(f);
                newState.push(fileObj);
            });

            return newState;
        });
    };
    return (
        <div
            style={{
                ...style,
                position: "relative",
                minHeight: "50px",
                paddingTop: "3rem",
                border: "1px solid #ddd",
                borderRadius: "7px",
            }}
        >
            <input
                type="file"
                hidden={preview}
                style={{ display: preview ? "none" : "block" }}
                multiple={multiple}
                className={`${className} ${styles.text}`}
                id={id}
                data-id={id}
                data-name={name}
                data-input-type="file"
                ref={ref}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={changeHandler}
            />
            {labelText && (
                <label className={styles.text} htmlFor={id}>
                    {labelText}
                    <div style={{ display: "inline-block", marginLeft: "10px" }}>
                        <IconButton
                            icon={icons.add}
                            onClick={() => {
                                ref.current.click();
                            }}
                        >
                            추가
                        </IconButton>
                    </div>
                </label>
            )}

            {preview && file.length > 0 && (
                <Grid
                    style={{ display: "grid", marginTop: "0.625rem", padding: "10px" }}
                    columnStyle="1fr 150px minmax(5rem, auto)"
                    header={[
                        { id: "col-1", title: "파일명" },
                        { id: "col-2", title: "파일크기" },
                        { id: "col-3", title: "미리보기" },
                    ]}
                    content={file.map((fc, index) => [
                        { id: `row-${index}-${fc.id}`, value: fc.name },
                        { id: `row-${index}-${fc.id}`, value: fc.size },
                        {
                            id: `row-${index}-${fc.id}`,
                            value: mediaType.img.includes(fc.ext) ? (
                                <img src={fc.data} style={{ maxWidth: "5rem" }} />
                            ) : mediaType.audio.includes(fc.ext) ? (
                                <audio src={fc.data} controls />
                            ) : mediaType.video.includes(fc.ext) ? (
                                <video src={fc.data} controls style={{ maxWidth: "10rem" }} />
                            ) : (
                                <div></div>
                            ),
                        },
                    ])}
                />
            )}
        </div>
    );
};

export const Textarea = ({
                             ref,
                             id,
                             className,
                             name,
                             placeholder,
                             value,
                             onChange = () => {},
                             labelText,
                         }) => {
    return (
        <>
            {labelText && <label htmlFor={id}>{labelText}</label>}
            <textarea
                ref={ref}
                className={`${className} ${styles.textarea}`}
                id={id}
                data-id={id}
                data-name={name}
                data-input-type="textarea"
                placeholder={placeholder}
                onChange={onChange}
                defaultValue={value}
            ></textarea>
        </>
    );
};

export const Button = ({ text, className, onClick = () => {} }) => {
    const buttonStyles = {
        positive: {
            backgroundColor: "rgb(86 151 255)",
            color: "#FFF",
        },
        negative: {
            backgroundColor: "rgb(232 107 123)",
            color: "#FFF",
        },
    };

    return (
        <button
            type="button"
            className={styles.button}
            style={buttonStyles[className]}
            onClick={onClick}
        >
            {text}
        </button>
    );
};
