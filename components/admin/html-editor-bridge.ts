/**
 * html-editor-bridge.ts
 *
 * Generates the JS runtime injected inside the iframe canvas.
 * It enables:
 *   - hover outline (red dashed border)
 *   - click → SELECT postMessage to parent
 *   - receiving STYLE / TEXT / ATTR commands from parent
 *   - receiving HIGHLIGHT / DESELECT commands
 */

export interface EditorElementInfo {
  eid:     string | null
  tag:     string
  id:      string | null
  classes: string | null
  text:    string | null
  html:    string | null
  styles: {
    color:           string
    backgroundColor: string
    fontSize:        string
    fontWeight:      string
    padding:         string
    margin:          string
    borderRadius:    string
    textAlign:       string
    display:         string
  }
}

export type EditorCommand =
  | { __editor_cmd: true; cmd: "style";     eid: string; prop: string; value: string }
  | { __editor_cmd: true; cmd: "text";      eid: string; value: string }
  | { __editor_cmd: true; cmd: "attr";      eid: string; attr: string; value: string }
  | { __editor_cmd: true; cmd: "highlight"; eid: string }
  | { __editor_cmd: true; cmd: "deselect" }

export function buildEditorRuntime(): string {
  return `
(function () {
  "use strict";

  /* ---- overlay elements ---- */
  function mkDiv(css) {
    var d = document.createElement("div");
    d.style.cssText = css;
    document.body.appendChild(d);
    return d;
  }

  var hoverEl = mkDiv(
    "position:fixed;pointer-events:none;border:1px dashed rgba(232,57,42,.7);border-radius:3px;" +
    "z-index:2147483640;transition:all .07s;display:none;"
  );
  var hoverBadge = document.createElement("div");
  hoverBadge.style.cssText =
    "position:absolute;top:-18px;left:0;background:#E8392A;color:#fff;font-size:9px;" +
    "font-family:monospace;padding:1px 5px;border-radius:3px;white-space:nowrap;line-height:16px;";
  hoverEl.appendChild(hoverBadge);

  var selEl = mkDiv(
    "position:fixed;pointer-events:none;border:2px solid #E8392A;" +
    "background:rgba(232,57,42,.06);border-radius:3px;z-index:2147483639;display:none;"
  );

  /* ---- helpers ---- */
  function canEdit(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    var t = (el.tagName || "").toLowerCase();
    return !["script","style","head","html","iframe"].includes(t);
  }

  function place(overlay, el) {
    var r = el.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.left   = r.left   + "px";
    overlay.style.top    = r.top    + "px";
    overlay.style.width  = r.width  + "px";
    overlay.style.height = r.height + "px";
  }

  function getInfo(el) {
    var cs = window.getComputedStyle(el);
    return {
      eid:     el.dataset.eid   || null,
      tag:     el.tagName.toLowerCase(),
      id:      el.id            || null,
      classes: el.className     || null,
      text:    (el.innerText    || "").slice(0, 120),
      html:    (el.innerHTML    || "").slice(0, 400),
      styles: {
        color:           cs.color,
        backgroundColor: cs.backgroundColor,
        fontSize:        cs.fontSize,
        fontWeight:      cs.fontWeight,
        padding:         cs.padding,
        margin:          cs.margin,
        borderRadius:    cs.borderRadius,
        textAlign:       cs.textAlign,
        display:         cs.display,
      }
    };
  }

  /* ---- hover ---- */
  document.addEventListener("mousemove", function (e) {
    var el = e.target;
    if (!canEdit(el)) { hoverEl.style.display = "none"; return; }
    place(hoverEl, el);
    hoverBadge.textContent =
      el.tagName.toLowerCase() +
      (el.id ? "#" + el.id : "") +
      (el.dataset && el.dataset.eid ? " [" + el.dataset.eid + "]" : "");
  });

  document.addEventListener("mouseleave", function () {
    hoverEl.style.display = "none";
  });

  /* ---- click → SELECT ---- */
  document.addEventListener("click", function (e) {
    var el = e.target;
    if (!canEdit(el)) return;
    e.stopPropagation();
    place(selEl, el);
    window.parent.postMessage({ __editor_select: true, info: getInfo(el) }, "*");
  }, true);

  /* ---- commands from parent ---- */
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || !d.__editor_cmd) return;

    var el = d.eid ? document.querySelector("[data-eid='" + d.eid + "']") : null;

    if (d.cmd === "style" && el) {
      el.style[d.prop] = d.value;
    }
    if (d.cmd === "text" && el) {
      el.innerText = d.value;
    }
    if (d.cmd === "attr" && el) {
      el.setAttribute(d.attr, d.value);
    }
    if (d.cmd === "highlight" && el) {
      place(selEl, el);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (d.cmd === "deselect") {
      selEl.style.display = "none";
    }
  });
})();
`.trim()
}
