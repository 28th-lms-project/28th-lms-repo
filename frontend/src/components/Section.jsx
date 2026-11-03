
/** @format */

import "./Section.css";

export const Section = ({
                            title,
                            children,
                            fixed = false,
                            nopadding = false,
                            nomargin = false,
                            header,
                            style,
                            flex = true,
                            direction = "column",
                            itemGap = "0px",
                        }) => {
    return (
        <div
            className={`section ${fixed ? "section-fixed" : ""}`}
            style={{
                padding: nopadding ? "0" : "2rem",
                paddingTop: title
                    ? 0
                    : nopadding
                        ? 0
                        : "2rem",
                margin: nomargin ? 0 : "1rem 0",
                ...style,
            }}
        >
            {title && (
                <h3 className="section-title">
                    {title}
                </h3>
            )}

            {header && <div>{header}</div>}

            <div
                className="section-content"
                style={{
                    display: flex ? "flex" : "block",
                    flexDirection: direction,
                    gap: itemGap,
                }}
            >
                {children}
            </div>
        </div>
    );
};
