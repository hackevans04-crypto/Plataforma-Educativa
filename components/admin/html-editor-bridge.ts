/**
 * html-editor-bridge.ts
 *
 * Runtime injected into the iframe canvas.
 *
 * Interactions:
 *   single-click  → SELECT (shows inspector panel)
 *   double-click  → INLINE EDIT (contentEditable on text elements)
 *   blur          → TEXT_CHANGE (syncs edited content back to parent)
 *   Escape        → EXIT EDIT MODE
 *   drag element  → MOVE (drag & drop between containers)
 *
 * Commands received from parent:
 *   style | text | html | attr | highlight | deselect | enable_drag
 */

export interface EditorElementInfo {
  eid:     string | null
  tag:     string
  id:      string | null
  classes: string | null
  text:    string | null
  html:    string | null
  isText:  boolean
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
    width:           string
  }
}

export type EditorMessage =
  | { __editor_select:      true;  info: EditorElementInfo }
  | { __editor_editing:     true;  eid: string | null }
  | { __editor_text_change: true;  eid: string | null; text: string; html: string }
  | { __editor_moved:       true;  eid: string; targetEid: string; position: "before" | "after" | "inside" }
  | { __hei_resize:         number }

export type EditorCommand =
  | { __editor_cmd: true; cmd: "style";      eid: string; prop: string;  value: string }
  | { __editor_cmd: true; cmd: "text";       eid: string; value: string }
  | { __editor_cmd: true; cmd: "html";       eid: string; value: string }
  | { __editor_cmd: true; cmd: "attr";       eid: string; attr: string;  value: string }
  | { __editor_cmd: true; cmd: "highlight";  eid: string }
  | { __editor_cmd: true; cmd: "deselect" }
  | { __editor_cmd: true; cmd: "enable_drag" }

// Tags where double-click activates contentEditable
const TEXT_TAGS = new Set(["p","h1","h2","h3","h4","h5","h6","span","a","button","li","td","th","label","div","small","strong","em","blockquote"])

export function buildEditorRuntime(): string {
  return `
(function () {
  "use strict";

  /* ============================================================
     OVERLAY HELPERS
  ============================================================ */
  function mkDiv(css) {
    var d = document.createElement("div");
    d.style.cssText = css + ";pointer-events:none;";
    document.documentElement.appendChild(d);
    return d;
  }

  var hoverBox = mkDiv(
    "position:fixed;border:1px dashed rgba(232,57,42,.65);border-radius:3px;" +
    "z-index:2147483645;transition:left .05s,top .05s,width .05s,height .05s;display:none;"
  );
  var hoverTag = document.createElement("div");
  hoverTag.style.cssText =
    "position:absolute;top:-17px;left:-1px;background:#E8392A;color:#fff;font:bold 9px/15px monospace;" +
    "padding:0 5px;border-radius:3px 3px 0 0;white-space:nowrap;";
  hoverBox.appendChild(hoverTag);

  var selBox = mkDiv(
    "position:fixed;border:2px solid #E8392A;background:rgba(232,57,42,.05);border-radius:3px;" +
    "z-index:2147483644;display:none;"
  );

  var editBox = mkDiv(
    "position:fixed;border:2px solid #22c55e;border-radius:3px;" +
    "z-index:2147483643;display:none;"
  );
  var editBadge = document.createElement("div");
  editBadge.style.cssText =
    "position:absolute;top:-17px;right:0;background:#22c55e;color:#000;font:bold 9px/15px monospace;" +
    "padding:0 6px;border-radius:3px 3px 0 0;white-space:nowrap;";
  editBadge.textContent = "Editando — Esc para salir";
  editBox.appendChild(editBadge);

  /* drag indicator */
  var dropLine = mkDiv(
    "position:fixed;height:2px;background:#E8392A;border-radius:2px;z-index:2147483646;display:none;"
  );

  function place(overlay, el) {
    if (!el) return;
    var r = el.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.left   = r.left   + "px";
    overlay.style.top    = r.top    + "px";
    overlay.style.width  = r.width  + "px";
    overlay.style.height = r.height + "px";
  }

  /* ============================================================
     ELEMENT HELPERS
  ============================================================ */
  var TEXT_TAGS = ["p","h1","h2","h3","h4","h5","h6","span","a","button","li","td","th","label","small","strong","em","blockquote"];

  function canEdit(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    var t = (el.tagName || "").toLowerCase();
    return !["script","style","head","html","iframe"].includes(t);
  }

  function isTextEl(el) {
    return TEXT_TAGS.includes((el.tagName || "").toLowerCase());
  }

  function getInfo(el) {
    var cs = window.getComputedStyle(el);
    return {
      eid:     el.dataset.eid   || null,
      tag:     el.tagName.toLowerCase(),
      id:      el.id            || null,
      classes: el.className     || null,
      text:    (el.innerText    || "").slice(0, 200),
      html:    (el.innerHTML    || "").slice(0, 600),
      isText:  isTextEl(el),
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
        width:           cs.width,
      }
    };
  }

  /* ============================================================
     STATE
  ============================================================ */
  var editingEl  = null;  // element currently in contentEditable mode
  var selectedEl = null;
  var dragEl     = null;
  var dragEnabled = false;

  /* ============================================================
     HOVER
  ============================================================ */
  document.addEventListener("mousemove", function (e) {
    if (editingEl) return;
    var el = e.target;
    if (!canEdit(el) || el === selectedEl) { hoverBox.style.display = "none"; return; }
    place(hoverBox, el);
    var t = el.tagName.toLowerCase();
    hoverTag.textContent = t + (el.id ? "#" + el.id : "") + (el.dataset.eid ? " [" + el.dataset.eid + "]" : "");
  });

  document.addEventListener("mouseleave", function () {
    hoverBox.style.display = "none";
  });

  /* ============================================================
     SINGLE CLICK → SELECT
  ============================================================ */
  document.addEventListener("click", function (e) {
    if (editingEl) return;                          // don't steal clicks while editing
    var el = e.target;
    if (!canEdit(el)) return;
    e.stopPropagation();
    selectedEl = el;
    hoverBox.style.display = "none";
    place(selBox, el);
    window.parent.postMessage({ __editor_select: true, info: getInfo(el) }, "*");
  }, true);

  /* ============================================================
     DOUBLE CLICK → INLINE EDIT (contentEditable)
  ============================================================ */
  document.addEventListener("dblclick", function (e) {
    var el = e.target;
    if (!canEdit(el) || !isTextEl(el)) return;
    e.preventDefault();
    e.stopPropagation();

    // Activate
    editingEl = el;
    el.contentEditable = "true";
    el.focus();

    // Move cursor to click position
    if (document.caretRangeFromPoint) {
      var range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (range) {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    // Overlays
    selBox.style.display   = "none";
    hoverBox.style.display = "none";
    place(editBox, el);

    window.parent.postMessage({ __editor_editing: true, eid: el.dataset.eid || null }, "*");
  }, true);

  /* ============================================================
     BLUR → SAVE TEXT
  ============================================================ */
  document.addEventListener("blur", function (e) {
    var el = e.target;
    if (el !== editingEl) return;
    el.contentEditable = "false";
    editBox.style.display = "none";

    window.parent.postMessage({
      __editor_text_change: true,
      eid:  el.dataset.eid || null,
      text: el.innerText  || "",
      html: el.innerHTML  || "",
    }, "*");

    // Reselect after a tick
    var saved = el;
    setTimeout(function () {
      editingEl = null;
      place(selBox, saved);
      window.parent.postMessage({ __editor_select: true, info: getInfo(saved) }, "*");
    }, 50);
  }, true);

  /* ============================================================
     ESCAPE → CANCEL EDIT
  ============================================================ */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && editingEl) {
      editingEl.contentEditable = "false";
      editingEl.blur();
    }
  }, true);

  /* ============================================================
     DRAG & DROP (block-level elements)
  ============================================================ */
  var BLOCK_TAGS = ["section","article","div","li","tr","p","h1","h2","h3","h4","h5","h6","header","footer","aside","figure"];

  function enableDrag() {
    dragEnabled = true;
    BLOCK_TAGS.forEach(function (tag) {
      document.querySelectorAll(tag).forEach(function (el) {
        if (!el.dataset.draggable) {
          el.setAttribute("draggable", "true");
          el.dataset.draggable = "1";
        }
      });
    });
  }

  document.addEventListener("dragstart", function (e) {
    if (!dragEnabled) return;
    dragEl = e.target;
    dragEl.style.opacity = "0.4";
    e.dataTransfer.effectAllowed = "move";
  });

  document.addEventListener("dragend", function () {
    if (dragEl) { dragEl.style.opacity = ""; dragEl = null; }
    dropLine.style.display = "none";
  });

  document.addEventListener("dragover", function (e) {
    if (!dragEl) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    var target = e.target;
    if (target && target !== dragEl && canEdit(target)) {
      var r = target.getBoundingClientRect();
      var mid = r.top + r.height / 2;
      dropLine.style.display = "block";
      dropLine.style.left  = r.left + "px";
      dropLine.style.width = r.width + "px";
      dropLine.style.top   = (e.clientY < mid ? r.top - 1 : r.bottom - 1) + "px";
    }
  });

  document.addEventListener("drop", function (e) {
    e.preventDefault();
    dropLine.style.display = "none";
    var target = e.target;
    if (!dragEl || !target || target === dragEl) return;
    var r   = target.getBoundingClientRect();
    var mid = r.top + r.height / 2;
    var pos = e.clientY < mid ? "before" : "after";

    // DOM move
    if (pos === "before") {
      target.parentNode && target.parentNode.insertBefore(dragEl, target);
    } else {
      target.parentNode && target.parentNode.insertBefore(dragEl, target.nextSibling);
    }

    window.parent.postMessage({
      __editor_moved: true,
      eid:       dragEl.dataset.eid  || null,
      targetEid: target.dataset.eid  || null,
      position:  pos,
    }, "*");
  });

  /* ============================================================
     COMMANDS FROM PARENT
  ============================================================ */
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || !d.__editor_cmd) return;

    var el = d.eid ? document.querySelector("[data-eid='" + d.eid + "']") : null;

    if (d.cmd === "style" && el)   { el.style[d.prop] = d.value; }
    if (d.cmd === "text"  && el)   { el.innerText = d.value; }
    if (d.cmd === "html"  && el)   { el.innerHTML = d.value; }
    if (d.cmd === "attr"  && el)   { el.setAttribute(d.attr, d.value); }
    if (d.cmd === "enable_drag")   { enableDrag(); }

    if (d.cmd === "highlight" && el) {
      place(selBox, el);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (d.cmd === "deselect") {
      selectedEl = null;
      selBox.style.display = "none";
    }
  });

  /* ============================================================
     AUTO RESIZE
  ============================================================ */
  function reportHeight() {
    var h = document.documentElement.scrollHeight || document.body.scrollHeight;
    if (h > 0) window.parent.postMessage({ __hei_resize: h }, "*");
  }
  reportHeight();
  if (window.ResizeObserver) {
    new ResizeObserver(reportHeight).observe(document.body);
  }

})();
`.trim()
}
