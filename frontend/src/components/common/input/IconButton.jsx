/** @format */

import "./IconButton.css";
import { useState } from "react";

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
            className="iconButton"
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
