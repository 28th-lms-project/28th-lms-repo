import { useState } from "react";

const CLAMP_LENGTH = 120; // 이보다 긴 글은 3줄로 접고 [더 보기]

/**
 * 댓글 한 개 (+ 답글). 스타일은 styles/content.css. <ul className="comment-list"> 안에 넣는다.
 *
 * @param {object} props
 * @param {React.ReactNode} props.author
 * @param {React.ReactNode} [props.time]      "2026-11-16 14:20"
 * @param {React.ReactNode} [props.badge]     작성자 옆 (강사 · 내 글)
 * @param {string} props.body                  내용 (줄바꿈 유지, 길면 접힘)
 * @param {React.ReactNode} [props.actions]   [답글] [수정] [삭제] (<Button variant="text">)
 * @param {React.ReactNode} [props.children]  답글 <Comment />들 (들여 쓴 목록으로)
 */
export default function Comment({ author, time, badge, body, actions, children }) {
  const long = typeof body === "string" && body.length > CLAMP_LENGTH;
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="comment">
      <div className="comment-head">
        <span className="comment-author">{author}</span>
        {badge}
        {time && <span className="comment-time">{time}</span>}
      </div>
      <p className={`comment-body ${long && !expanded ? "is-clamped" : ""}`.trim()}>{body}</p>
      {(long || actions) && (
        <div className="comment-actions">
          {long && (
            <button type="button" className="btn btn-text" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
              {expanded ? "접기" : "더 보기"}
            </button>
          )}
          {actions}
        </div>
      )}
      {children && <ul className="comment-list comment-replies">{children}</ul>}
    </li>
  );
}
