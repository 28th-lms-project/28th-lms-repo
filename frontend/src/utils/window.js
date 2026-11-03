/** @format */

export const title = (title) => {
    const titleElem = document.querySelector("title");
    titleElem.innerText = title;
};

export const isMobile = () => {
    return window.innerWidth <= 600;
};
