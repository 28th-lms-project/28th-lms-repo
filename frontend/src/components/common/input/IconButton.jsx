/** @format */

import "./IconButton.css";
import { useState } from "react";

/** @deprecated 아이콘은 icons.js + 표준 Button(common/ui/Button.jsx)의 icon을 쓴다. 마지막으로 쓰는 화면에 표준을 적용할 때 components/archive/로 옮긴다 (archive/README.md). */
export const Icon = ({
                         iconSize,
                         iconColor,
                         iconStyle = {},
                         icon,
                         disabled,
                         onClick = () => {},
                     }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            height={`${iconSize}px`}
            className="button-icon icon"
            viewBox="0 -960 960 960"
            width={`${iconSize}px`}
            fill={iconColor}
            onClick={onClick}
            style={{ ...iconStyle, opacity: disabled ? 0.5 : 1 }}
        >
            <path d={icon} />
        </svg>
    );
};

/** @deprecated 표준 Button(common/ui/Button.jsx)을 쓴다. 아직 환경 변수 관리(AddCode · UpdateCode)가 씀. 마지막으로 쓰는 화면에 표준을 적용할 때 components/archive/로 옮긴다 (archive/README.md). */
export const IconButton = ({
                               children,
                               color = "#666",
                               icon,
                               iconSize = 20,
                               iconColor = "#666",
                               hoverIconRotate = false,
                               alwaysIconRotate = false,
                               backgroundColor = "buttonface",
                               disabled = false,
                               style = {},
                               onClick = () => {},
                               // 그 밖의 props(aria-label, title, type …)는 <button>에 그대로 전달
                               className = "",
                               ...rest
                           }) => {
    const [hover, setHover] = useState(false);
    const hoverHandler = () => {
        setHover(true);
    };
    const houtHandler = () => {
        setHover(false);
    };

    const iconStyle = {};
    if (children) {
        iconStyle.marginRight = "5px";
    }
    if (hoverIconRotate) {
        iconStyle.transform = `rotate(${hover ? 360 : 0}deg)`;
        iconStyle.transition = "transform 0.4s";
    }
    if (alwaysIconRotate) {
        iconStyle.animation = "rotate 0.5s infinite";
    }

    return (
        <button
            type="button"
            {...rest}
            className={`iconButton ${className}`.trim()}
            onMouseEnter={hoverHandler}
            onMouseLeave={houtHandler}
            onClick={onClick}
            disabled={disabled}
            style={{
                cursor: disabled ? "not-allowed" : "pointer",
                fontWeight: hover ? 800 : 400,
                padding: icon ? "5px" : "7px",
                paddingRight: children ? "10px" : "5px",
                backgroundColor,
                ...style,
            }}
        >
            {icon && (
                <Icon
                    iconSize={iconSize}
                    iconColor={iconColor}
                    icon={icon}
                    iconStyle={iconStyle}
                    disabled={disabled}
                />
            )}
            {children && (
                <span
                    className="iconSpan"
                    style={{
                        color,
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
          {children}
        </span>
            )}
        </button>
    );
};
