/**
 * Runtime injected into the iframe canvas for imported HTML blocks.
 *
 * Interactions:
 * - single click: select
 * - double click: inline edit for text nodes
 * - blur: save text
 * - drag: reorder simple blocks
 *
 * Parent -> iframe commands:
 * - style | text | html | replace | attr | highlight | deselect | enable_drag
 */

export interface EditorElementInfo {
  eid: string | null
  nodeType: "image" | "button" | "field" | "icon" | "text" | "container" | null
  tag: string
  id: string | null
  classes: string | null
  parentEid: string | null
  parentTag: string | null
  children: Array<{ eid: string | null; tag: string; label: string }>
  text: string | null
  html: string | null
  isText: boolean
  isLink: boolean
  isButton: boolean
  isActionable: boolean
  attrs: {
    id: string | null
    href: string | null
    target: string | null
    placeholder: string | null
    src: string | null
    type: string | null
    name: string | null
    autocomplete: string | null
    min: string | null
    max: string | null
    step: string | null
    rows: string | null
    multiple: boolean
    value: string | null
    alt: string | null
    title: string | null
    required: boolean
    disabled: boolean
    checked: boolean
    dataIcon: string | null
  }
  styles: {
    color: string
    backgroundColor: string
    backgroundImage: string
    fontSize: string
    fontWeight: string
    fontFamily: string
    fontStyle: string
    lineHeight: string
    letterSpacing: string
    textDecoration: string
    textTransform: string
    padding: string
    margin: string
    borderRadius: string
    textAlign: string
    display: string
    width: string
    maxWidth: string
    height: string
    maxHeight: string
    objectFit: string
    borderWidth: string
    borderColor: string
    boxShadow: string
    strokeWidth: string
    accentColor: string
    gap: string
    justifyContent: string
    alignItems: string
  }
}

export type EditorMessage =
  | { __editor_select: true; info: EditorElementInfo | null }
  | { __editor_editing: true; eid: string | null }
  | { __editor_text_change: true; eid: string | null; text: string; html: string }
  | { __editor_moved: true; eid: string | null; targetEid: string | null; position: "before" | "after" | "inside" }
  | { __editor_snapshot: true; html: string }
  | { __editor_interaction_lock: true; active: boolean; kind: "move" | "resize" | "group" | null }
  | { __editor_open_inspector: true }
  | { __hei_resize: number }

export type EditorCommand =
  | { __editor_cmd: true; cmd: "style"; eid: string; prop: string; value: string }
  | { __editor_cmd: true; cmd: "style_query"; eid: string; selector: string; prop: string; value: string }
  | { __editor_cmd: true; cmd: "style_batch"; eid: string; updates: Array<{ selector?: string; prop: string; value: string }> }
  | { __editor_cmd: true; cmd: "icon_patch"; eid: string; color?: string; size?: string; strokeWidth?: string }
  | { __editor_cmd: true; cmd: "text"; eid: string; value: string }
  | { __editor_cmd: true; cmd: "html"; eid: string; value: string }
  | { __editor_cmd: true; cmd: "replace"; eid: string; value: string }
  | { __editor_cmd: true; cmd: "attr"; eid: string; attr: string; value: string }
  | { __editor_cmd: true; cmd: "insert"; eid: string; position: "beforebegin" | "afterbegin" | "beforeend" | "afterend"; value: string }
  | { __editor_cmd: true; cmd: "highlight"; eid: string }
  | { __editor_cmd: true; cmd: "move_up"; eid: string }
  | { __editor_cmd: true; cmd: "move_down"; eid: string }
  | { __editor_cmd: true; cmd: "delete"; eid: string }
  | { __editor_cmd: true; cmd: "cleanup_layout"; eid?: string }
  | { __editor_cmd: true; cmd: "deselect" }
  | { __editor_cmd: true; cmd: "enable_drag" }

const TEXT_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "a", "button", "li", "td", "th", "label", "small", "strong", "em", "blockquote"])
export const EDITOR_RUNTIME_VERSION = "2026-03-20-02"

export function buildEditorRuntime(): string {
  return `
(function () {
  "use strict";
  var RUNTIME_VERSION = "${EDITOR_RUNTIME_VERSION}";

  var TEXT_TAGS = ["p","h1","h2","h3","h4","h5","h6","span","a","button","li","td","th","label","small","strong","em","blockquote"];
  var BLOCK_TAGS = ["section","article","div","li","tr","p","h1","h2","h3","h4","h5","h6","header","footer","aside","figure"];
  var EID_SKIP = ["html","head","body","meta","link","style","script","iframe","noscript"];
  var ICON_SHAPE_TAGS = ["path","rect","circle","line","polyline","polygon","ellipse","g","use"];
  var editingEl = null;
  var selectedEl = null;
  var multiSelectMode = false;
  var multiSelectedEls = [];
  var dragEl = null;
  var dragEnabled = false;
  var freeMoveEl = null;
  var freeMoveIsGroup = false;
  var freeMoveState = null;
  var freeMoveDirectHandleEl = null;
  var freeMoveDirectHandle = null;
  var resizeState = null;
  var snapshotTimer = null;
  var suppressSelectionClick = false;
  var activeTouchId = null;
  var autoScrollRafId = 0;
  var lastInteractionPoint = null;
  var eidCounter = 1;
  var coarsePointer = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) || ((navigator.maxTouchPoints || 0) > 0);
  var resizeHandleSize = coarsePointer ? 34 : 14;
  var resizeHandleHalf = Math.round(resizeHandleSize / 2);
  var compactTargetSize = coarsePointer ? 58 : 30;
  var moveHitTargetSize = coarsePointer ? 96 : 34;
  var toolbarGap = coarsePointer ? 10 : 12;

  function markRuntime(node, attr) {
    node.setAttribute(attr, "1");
    return node;
  }

  document.documentElement.setAttribute("data-he-editor-runtime-version", RUNTIME_VERSION);

  function mkDiv(css) {
    var d = document.createElement("div");
    d.style.cssText = css + ";pointer-events:none;touch-action:none;";
    markRuntime(d, "data-he-editor-overlay");
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
  var moveHitBox = mkDiv(
    "position:fixed;border:none;background:transparent;border-radius:10px;" +
    "z-index:2147483646;display:none;"
  );
  var groupBox = mkDiv(
    "position:fixed;border:2px dashed rgba(34,197,94,.9);background:rgba(34,197,94,.06);border-radius:8px;" +
    "z-index:2147483644;display:none;"
  );
  var resizeHandle = document.createElement("div");
  resizeHandle.style.cssText =
    "position:fixed;width:" + resizeHandleSize + "px;height:" + resizeHandleSize + "px;border-radius:999px;background:#E8392A;" +
    "border:2px solid rgba(9,17,27,.95);box-shadow:0 6px 18px rgba(0,0,0,.32);" +
    "z-index:2147483647;display:none;cursor:nwse-resize;pointer-events:auto;touch-action:none;";
  resizeHandle.setAttribute("data-he-runtime", "resize");
  document.documentElement.appendChild(resizeHandle);

  var editBox = mkDiv(
    "position:fixed;border:2px solid #22c55e;border-radius:3px;" +
    "z-index:2147483643;display:none;"
  );
  var editBadge = document.createElement("div");
  editBadge.style.cssText =
    "position:absolute;top:-17px;right:0;background:#22c55e;color:#000;font:bold 9px/15px monospace;" +
    "padding:0 6px;border-radius:3px 3px 0 0;white-space:nowrap;";
  editBadge.textContent = "Editando - Esc para salir";
  editBox.appendChild(editBadge);

  var dropLine = mkDiv(
    "position:fixed;height:2px;background:#E8392A;border-radius:2px;z-index:2147483646;display:none;"
  );
  var moveGuideX = document.createElement("div");
  moveGuideX.style.cssText =
    "position:fixed;top:0;bottom:0;width:1px;background:rgba(232,57,42,.55);" +
    "z-index:2147483646;display:none;pointer-events:none;";
  markRuntime(moveGuideX, "data-he-runtime");
  document.documentElement.appendChild(moveGuideX);

  var moveGuideY = document.createElement("div");
  moveGuideY.style.cssText =
    "position:fixed;left:0;right:0;height:1px;background:rgba(232,57,42,.55);" +
    "z-index:2147483646;display:none;pointer-events:none;";
  markRuntime(moveGuideY, "data-he-runtime");
  document.documentElement.appendChild(moveGuideY);

  var moveHud = document.createElement("div");
  moveHud.style.cssText =
    "position:fixed;display:none;align-items:center;gap:6px;padding:5px 8px;border-radius:10px;" +
    "background:rgba(9,17,27,.96);border:1px solid rgba(255,255,255,.08);color:#e2eaf0;" +
    "font:600 11px/1.2 system-ui;z-index:2147483647;pointer-events:none;white-space:nowrap;";
  markRuntime(moveHud, "data-he-runtime");
  document.documentElement.appendChild(moveHud);

  var selToolbar = document.createElement("div");
  selToolbar.style.cssText =
    "position:fixed;display:none;align-items:center;gap:4px;padding:6px;border-radius:14px;" +
    "background:rgba(9,17,27,.95);border:1px solid rgba(255,255,255,.08);" +
    "box-shadow:0 12px 28px rgba(0,0,0,.32);z-index:2147483647;pointer-events:auto;";
  selToolbar.setAttribute("data-he-runtime", "toolbar");
  selToolbar.innerHTML = [
    '<button type="button" data-tool="group" style="height:28px;padding:0 10px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:#e2eaf0;font:600 11px/28px system-ui;cursor:pointer;">Grupo</button>',
    '<button type="button" data-tool="edit" style="height:28px;padding:0 10px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:#e2eaf0;font:600 11px/28px system-ui;cursor:pointer;">Editar</button>',
    '<button type="button" data-tool="drag" style="height:28px;padding:0 10px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:#e2eaf0;font:600 11px/28px system-ui;cursor:pointer;">Mover</button>',
    '<button type="button" data-tool="up" style="height:28px;width:28px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:#e2eaf0;font:700 12px/28px system-ui;cursor:pointer;">&uarr;</button>',
    '<button type="button" data-tool="down" style="height:28px;width:28px;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:#e2eaf0;font:700 12px/28px system-ui;cursor:pointer;">&darr;</button>',
    '<button type="button" data-tool="delete" style="height:28px;padding:0 10px;border-radius:10px;border:1px solid rgba(232,57,42,.22);background:rgba(232,57,42,.12);color:#ff8b81;font:700 11px/28px system-ui;cursor:pointer;">Eliminar</button>'
  ].join("");
  document.documentElement.appendChild(selToolbar);
  var lastToolbarTouchTs = 0;
  if (coarsePointer) {
    selToolbar.style.maxWidth = "calc(100vw - 14px)";
    selToolbar.style.flexWrap = "wrap";
    selToolbar.style.justifyContent = "center";
    Array.prototype.forEach.call(selToolbar.querySelectorAll("button[data-tool]"), function (button) {
      if (!button || !button.style) return;
      if (button.getAttribute("data-tool") === "up" || button.getAttribute("data-tool") === "down") {
        button.style.width = "34px";
        button.style.height = "34px";
        button.style.lineHeight = "34px";
      } else {
        button.style.height = "34px";
        button.style.lineHeight = "34px";
      }
      button.style.fontSize = "12px";
      button.style.borderRadius = "12px";
      button.style.paddingLeft = button.style.paddingLeft || "12px";
      button.style.paddingRight = button.style.paddingRight || "12px";
    });
  }

  function emitToParent(payload) {
    try {
      if (window.frameElement && window.frameElement.__heEditorBridge) {
        window.frameElement.__heEditorBridge(payload);
      }
    } catch (_err) {}
    try {
      window.parent.postMessage(payload, "*");
    } catch (_err) {}
  }

  function getPrimaryTouch(event) {
    if (!event) return null;
    var list = null;
    if (event.changedTouches && event.changedTouches.length) {
      list = event.changedTouches;
    } else if (event.touches && event.touches.length) {
      list = event.touches;
    }
    if (!list || !list.length) return null;
    if (activeTouchId != null) {
      for (var index = 0; index < list.length; index += 1) {
        if (list[index] && list[index].identifier === activeTouchId) {
          return list[index];
        }
      }
    }
    return list[0];
  }

  function getEventClientPoint(event) {
    if (event && typeof event.pointerId === "number" && typeof event.clientX === "number" && typeof event.clientY === "number") {
      return { x: event.clientX, y: event.clientY, id: event.pointerId };
    }
    var touch = getPrimaryTouch(event);
    if (touch) {
      return { x: touch.clientX, y: touch.clientY, id: touch.identifier };
    }
    if (typeof event.clientX === "number" && typeof event.clientY === "number") {
      return { x: event.clientX, y: event.clientY, id: null };
    }
    return null;
  }

  function isNonMousePointerEvent(event) {
    return !!(event && typeof event.pointerType === "string" && event.pointerType !== "mouse");
  }

  function stopGestureEvent(event) {
    if (!event) return;
    if (event.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();
  }

  function setInteractionPoint(clientX, clientY, touchIdentifier) {
    if (typeof clientX !== "number" || typeof clientY !== "number") return;
    lastInteractionPoint = {
      x: clientX,
      y: clientY,
      id: touchIdentifier != null ? touchIdentifier : activeTouchId,
    };
  }

  function clearInteractionPoint() {
    lastInteractionPoint = null;
  }

  function cancelAutoScrollLoop() {
    if (autoScrollRafId) {
      window.cancelAnimationFrame(autoScrollRafId);
      autoScrollRafId = 0;
    }
  }

  function getInteractionScrollContainer(preferredRoot) {
    var scrollingElement = document.scrollingElement || document.documentElement || document.body;
    var candidates = [];

    if (preferredRoot && preferredRoot instanceof Element) {
      candidates.push(preferredRoot);
      var current = preferredRoot.parentElement;
      var depth = 0;
      while (current && current !== document.body && current !== document.documentElement && depth < 8) {
        candidates.push(current);
        current = current.parentElement;
        depth += 1;
      }
    }

    if (scrollingElement) candidates.push(scrollingElement);
    if (document.documentElement) candidates.push(document.documentElement);
    if (document.body) candidates.push(document.body);

    for (var index = 0; index < candidates.length; index += 1) {
      var candidate = candidates[index];
      if (!candidate || !(candidate instanceof Element)) continue;
      var canScrollY = candidate.scrollHeight > candidate.clientHeight + 2;
      var canScrollX = candidate.scrollWidth > candidate.clientWidth + 2;
      if (canScrollX || canScrollY) return candidate;
    }

    return scrollingElement || preferredRoot || document.body;
  }

  function getInteractionScrollRect(container) {
    var root = document.scrollingElement || document.documentElement || document.body;
    if (!container || container === document.body || container === document.documentElement || container === root) {
      return {
        left: 0,
        top: 0,
        right: window.innerWidth || document.documentElement.clientWidth || 0,
        bottom: window.innerHeight || document.documentElement.clientHeight || 0,
      };
    }
    return container.getBoundingClientRect();
  }

  function scrollInteractionContainer(container, deltaX, deltaY) {
    if (!container) return { movedX: 0, movedY: 0 };
    var root = document.scrollingElement || document.documentElement || document.body;
    var isViewportRoot = container === document.body || container === document.documentElement || container === root;
    var startLeft = isViewportRoot ? (window.scrollX || root.scrollLeft || 0) : container.scrollLeft;
    var startTop = isViewportRoot ? (window.scrollY || root.scrollTop || 0) : container.scrollTop;

    if (isViewportRoot) {
      window.scrollTo(startLeft + deltaX, startTop + deltaY);
    } else if (typeof container.scrollBy === "function") {
      container.scrollBy({ left: deltaX, top: deltaY, behavior: "auto" });
    } else {
      container.scrollLeft += deltaX;
      container.scrollTop += deltaY;
    }

    var endLeft = isViewportRoot ? (window.scrollX || root.scrollLeft || 0) : container.scrollLeft;
    var endTop = isViewportRoot ? (window.scrollY || root.scrollTop || 0) : container.scrollTop;
    return {
      movedX: endLeft - startLeft,
      movedY: endTop - startTop,
    };
  }

  function autoScrollActiveCanvas(preferredRoot, clientX, clientY) {
    var container = getInteractionScrollContainer(preferredRoot);
    if (!container) return false;

    var rect = getInteractionScrollRect(container);
    var threshold = coarsePointer ? 84 : 52;
    var deltaX = 0;
    var deltaY = 0;

    if (clientY < rect.top + threshold) {
      deltaY = -Math.round(((rect.top + threshold) - clientY) * 0.38 + 10);
    } else if (clientY > rect.bottom - threshold) {
      deltaY = Math.round((clientY - (rect.bottom - threshold)) * 0.38 + 10);
    }

    if (clientX < rect.left + threshold) {
      deltaX = -Math.round(((rect.left + threshold) - clientX) * 0.26 + 6);
    } else if (clientX > rect.right - threshold) {
      deltaX = Math.round((clientX - (rect.right - threshold)) * 0.26 + 6);
    }

    var moved = scrollInteractionContainer(container, deltaX, deltaY);
    if (!moved.movedX && !moved.movedY && (deltaX || deltaY)) {
      emitToParent({ __editor_autoscroll: true, deltaX: deltaX, deltaY: deltaY });
      return true;
    }

    return !!(moved.movedX || moved.movedY);
  }

  function getActiveInteractionRoot() {
    if (freeMoveState) {
      if (freeMoveState.root) return freeMoveState.root;
      if (freeMoveState.items && freeMoveState.items[0] && freeMoveState.items[0].root) {
        return freeMoveState.items[0].root;
      }
    }
    if (resizeState && resizeState.el) return getFreeMoveRoot(resizeState.el);
    if (selectedEl) return getFreeMoveRoot(selectedEl);
    return document.scrollingElement || document.body;
  }

  function runAutoScrollLoop() {
    autoScrollRafId = 0;
    if ((!freeMoveState && !resizeState) || !lastInteractionPoint) return;

    var scrolled = autoScrollActiveCanvas(getActiveInteractionRoot(), lastInteractionPoint.x, lastInteractionPoint.y);
    if (scrolled) {
      handleCanvasPointerMove(
        lastInteractionPoint.x,
        lastInteractionPoint.y,
        document.elementFromPoint(lastInteractionPoint.x, lastInteractionPoint.y),
        1,
        false,
        lastInteractionPoint.id != null ? lastInteractionPoint.id : activeTouchId
      );
    }

    autoScrollRafId = window.requestAnimationFrame(runAutoScrollLoop);
  }

  function ensureAutoScrollLoop() {
    if (autoScrollRafId) return;
    autoScrollRafId = window.requestAnimationFrame(runAutoScrollLoop);
  }

  function beginInteractionLock(cursor, touchIdentifier) {
    if (touchIdentifier != null) {
      activeTouchId = touchIdentifier;
    }
    if (document.body) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = cursor || "grabbing";
      document.body.style.touchAction = "none";
      document.body.style.overscrollBehavior = "none";
      document.body.style.overflow = "hidden";
    }
    if (document.documentElement) {
      document.documentElement.style.userSelect = "none";
      document.documentElement.style.cursor = cursor || "grabbing";
      document.documentElement.style.touchAction = "none";
      document.documentElement.style.overscrollBehavior = "none";
      document.documentElement.style.overflow = "hidden";
    }
  }

  function endInteractionLock() {
    activeTouchId = null;
    if (document.body) {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.body.style.touchAction = "";
      document.body.style.overscrollBehavior = "";
      document.body.style.overflow = "";
    }
    if (document.documentElement) {
      document.documentElement.style.userSelect = "";
      document.documentElement.style.cursor = "";
      document.documentElement.style.touchAction = "";
      document.documentElement.style.overscrollBehavior = "";
      document.documentElement.style.overflow = "";
    }
  }

  function abortActiveInteraction() {
    if (finishCanvasPointerInteraction()) {
      return true;
    }
    cancelAutoScrollLoop();
    clearInteractionPoint();
    endInteractionLock();
    emitToParent({ __editor_interaction_lock: true, active: false, kind: null });
    hideMoveFeedback();
    return false;
  }

  function place(overlay, el) {
    if (!overlay || !el) return;
    var rect = el.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.left = rect.left + "px";
    overlay.style.top = rect.top + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
  }

  function placeResizeHandle(el) {
    if (!el) {
      resizeHandle.style.display = "none";
      return;
    }
    var rect = el.getBoundingClientRect();
    resizeHandle.style.display = "block";
    resizeHandle.style.left = (rect.right - resizeHandleHalf) + "px";
    resizeHandle.style.top = (rect.bottom - resizeHandleHalf) + "px";
  }

  function placeSelectionBox(el) {
    if (!el) {
      selBox.style.display = "none";
      return;
    }
    var rect = el.getBoundingClientRect();
    var nodeType = getNodeType(el);
    var padX = 0;
    var padY = 0;
    if (nodeType === "icon" || rect.width < 24 || rect.height < 24) {
      var minWidth = compactTargetSize;
      var minHeight = compactTargetSize;
      padX = Math.max(6, (minWidth - rect.width) / 2);
      padY = Math.max(6, (minHeight - rect.height) / 2);
    }
    selBox.style.display = "block";
    selBox.style.left = (rect.left - padX) + "px";
    selBox.style.top = (rect.top - padY) + "px";
    selBox.style.width = (rect.width + padX * 2) + "px";
    selBox.style.height = (rect.height + padY * 2) + "px";
  }

  function placeMoveHitBox(el) {
    if (!el) {
      moveHitBox.style.display = "none";
      return;
    }
    var rect = el.getBoundingClientRect();
    var nodeType = getNodeType(el);
    var shouldExpandHitBox = coarsePointer || nodeType === "icon" || rect.width < 24 || rect.height < 24;
    if (!shouldExpandHitBox) {
      moveHitBox.style.display = "none";
      return;
    }
    var minWidth = moveHitTargetSize;
    var minHeight = moveHitTargetSize;
    var padX = Math.max(10, (minWidth - rect.width) / 2);
    var padY = Math.max(10, (minHeight - rect.height) / 2);
    moveHitBox.style.display = "block";
    moveHitBox.style.left = (rect.left - padX) + "px";
    moveHitBox.style.top = (rect.top - padY) + "px";
    moveHitBox.style.width = (rect.width + padX * 2) + "px";
    moveHitBox.style.height = (rect.height + padY * 2) + "px";
  }

  function hideSelectionUi() {
    selBox.style.display = "none";
    moveHitBox.style.display = "none";
    groupBox.style.display = "none";
    selToolbar.style.display = "none";
    resizeHandle.style.display = "none";
    moveGuideX.style.display = "none";
    moveGuideY.style.display = "none";
    moveHud.style.display = "none";
  }

  function getToolbarButton(tool) {
    return selToolbar.querySelector("button[data-tool='" + tool + "']");
  }

  function getUniqueEditableElements(list) {
    var next = [];
    (list || []).forEach(function (node) {
      if (!node || !canEdit(node) || !node.isConnected || isImportRootEl(node)) return;
      if (next.indexOf(node) === -1) {
        next.push(node);
      }
    });
    return next;
  }

  function hasGroupedSelection() {
    return multiSelectMode && getUniqueEditableElements(multiSelectedEls).length > 1;
  }

  function getGroupedSelectionBounds(list) {
    var items = getUniqueEditableElements(list);
    if (!items.length) return null;
    var left = Infinity;
    var top = Infinity;
    var right = -Infinity;
    var bottom = -Infinity;

    items.forEach(function (node) {
      var rect = node.getBoundingClientRect();
      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    });

    if (!isFinite(left) || !isFinite(top) || !isFinite(right) || !isFinite(bottom)) return null;
    return {
      left: left,
      top: top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top)
    };
  }

  function placeToolbarForRect(rect) {
    if (!rect) {
      selToolbar.style.display = "none";
      return;
    }
    selToolbar.style.display = "flex";
    var toolbarWidth = selToolbar.offsetWidth || 320;
    var toolbarHeight = selToolbar.offsetHeight || 42;
    var gap = toolbarGap;
    var minX = 10;
    var minY = 10;
    var maxLeft = Math.max(minX, window.innerWidth - toolbarWidth - 10);
    var maxTop = Math.max(minY, window.innerHeight - toolbarHeight - 10);
    var desiredLeft = rect.left + rect.width / 2 - toolbarWidth / 2;
    var clampedLeft = clampValue(desiredLeft, minX, maxLeft);
    var aboveTop = rect.top - toolbarHeight - gap;
    var belowTop = rect.top + rect.height + gap;
    var aboveFits = aboveTop >= minY;
    var belowFits = belowTop <= maxTop;
    var top = aboveFits ? aboveTop : (belowFits ? belowTop : clampValue(aboveTop, minY, maxTop));

    function rectsOverlap(a, b) {
      if (!a || !b) return false;
      return !(
        a.left >= b.right ||
        a.right <= b.left ||
        a.top >= b.bottom ||
        a.bottom <= b.top
      );
    }

    var toolbarRect = {
      left: clampedLeft,
      top: top,
      right: clampedLeft + toolbarWidth,
      bottom: top + toolbarHeight
    };
    var selectionRect = {
      left: rect.left - 8,
      top: rect.top - 8,
      right: rect.left + rect.width + 8,
      bottom: rect.top + rect.height + 8
    };

    if (rectsOverlap(toolbarRect, selectionRect)) {
      if (belowFits) {
        top = belowTop;
      } else if (aboveFits) {
        top = aboveTop;
      } else {
        var rightLeft = clampValue(rect.left + rect.width + gap, minX, maxLeft);
        var leftLeft = clampValue(rect.left - toolbarWidth - gap, minX, maxLeft);
        var rightRect = {
          left: rightLeft,
          top: clampValue(rect.top, minY, maxTop),
          right: rightLeft + toolbarWidth,
          bottom: clampValue(rect.top, minY, maxTop) + toolbarHeight
        };
        if (!rectsOverlap(rightRect, selectionRect)) {
          clampedLeft = rightLeft;
          top = rightRect.top;
        } else {
          clampedLeft = leftLeft;
          top = clampValue(rect.top, minY, maxTop);
        }
      }
    }

    selToolbar.style.top = clampValue(top, minY, maxTop) + "px";
    selToolbar.style.left = clampValue(clampedLeft, minX, maxLeft) + "px";
  }

  function placeGroupBox(list) {
    var bounds = getGroupedSelectionBounds(list);
    if (!bounds) {
      groupBox.style.display = "none";
      return null;
    }
    groupBox.style.display = "block";
    groupBox.style.left = bounds.left + "px";
    groupBox.style.top = bounds.top + "px";
    groupBox.style.width = bounds.width + "px";
    groupBox.style.height = bounds.height + "px";
    return bounds;
  }

  function clearMultiSelection() {
    multiSelectedEls = [];
  }

  function setMultiSelection(list) {
    var next = getUniqueEditableElements(list);
    multiSelectedEls = next;
    if (next.length === 0) {
      selectedEl = null;
      return;
    }
    if (selectedEl && next.indexOf(selectedEl) !== -1) {
      return;
    }
    selectedEl = next[0];
  }

  function toggleMultiSelection(el) {
    if (!canEdit(el) || isImportRootEl(el)) return;
    var current = getUniqueEditableElements(multiSelectedEls);
    var index = current.indexOf(el);
    if (index === -1) {
      current.push(el);
    } else {
      current.splice(index, 1);
    }
    setMultiSelection(current);
  }

  function hideMoveFeedback() {
    moveGuideX.style.display = "none";
    moveGuideY.style.display = "none";
    moveHud.style.display = "none";
  }

  function updateMoveFeedback(root, left, top, width, height, guideX, guideY) {
    if (!root) {
      hideMoveFeedback();
      return;
    }
    var rootRect = root.getBoundingClientRect();
    var scrollLeft = root.scrollLeft || 0;
    var scrollTop = root.scrollTop || 0;
    var viewportLeft = rootRect.left - scrollLeft + left;
    var viewportTop = rootRect.top - scrollTop + top;

    moveHud.style.display = "flex";
    moveHud.textContent = "x: " + Math.round(left) + "  y: " + Math.round(top) + "  |  " + Math.round(width) + " x " + Math.round(height);
    var hudWidth = moveHud.offsetWidth || 160;
    var hudLeft = Math.min(window.innerWidth - hudWidth - 10, Math.max(10, viewportLeft + width + 10));
    var hudTop = Math.max(10, viewportTop - 34);
    moveHud.style.left = hudLeft + "px";
    moveHud.style.top = hudTop + "px";

    if (typeof guideX === "number" && isFinite(guideX)) {
      moveGuideX.style.display = "block";
      moveGuideX.style.left = (rootRect.left - scrollLeft + guideX) + "px";
    } else {
      moveGuideX.style.display = "none";
    }

    if (typeof guideY === "number" && isFinite(guideY)) {
      moveGuideY.style.display = "block";
      moveGuideY.style.top = (rootRect.top - scrollTop + guideY) + "px";
    } else {
      moveGuideY.style.display = "none";
    }
  }

  function getLengthValue(el, prop) {
    if (!el || !el.style) return 0;
    var inlineValue = el.style[prop];
    if (inlineValue && inlineValue !== "auto") {
      var parsedInline = parseFloat(inlineValue);
      if (!isNaN(parsedInline)) return parsedInline;
    }
    var computedValue = window.getComputedStyle(el)[prop];
    if (!computedValue || computedValue === "auto") return 0;
    var parsedComputed = parseFloat(computedValue);
    return isNaN(parsedComputed) ? 0 : parsedComputed;
  }

  function clampValue(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function isPointInsideRect(clientX, clientY, rect) {
    if (!rect) return false;
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  function resolveSnapGuide(desiredStart, size, containerSize, threshold) {
    var maxStart = Math.max(0, containerSize - size);
    var candidates = [
      { start: 0, guide: 0 },
      { start: maxStart / 2, guide: containerSize / 2 },
      { start: maxStart, guide: containerSize }
    ];
    var best = null;
    var bestDistance = Infinity;

    for (var index = 0; index < candidates.length; index += 1) {
      var candidate = candidates[index];
      var distance = Math.abs(desiredStart - candidate.start);
      if (distance <= threshold && distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }

    return best;
  }

  function isImportRootEl(el) {
    return !!(el && el.getAttribute && (el.getAttribute("data-he-import-root") === "1" || el.id === "he-import-root"));
  }

  function getEditorRoot(el) {
    if (!el || !el.closest) return document.body;
    return el.closest("[data-he-import-root='1']") || document.body;
  }

  function getFreeMoveRoot(el) {
    var fallback = getEditorRoot(el);
    var current = el ? el.parentElement : null;

    while (current && current !== fallback && current !== document.body && current !== document.documentElement) {
      if (!canEdit(current)) {
        current = current.parentElement;
        continue;
      }

      var tag = (current.tagName || "").toLowerCase();
      var rect = current.getBoundingClientRect();
      var childCount = current.children ? current.children.length : 0;
      var looksLikeContainer = ["div", "section", "article", "main", "header", "footer", "aside", "nav", "form", "fieldset", "ul", "ol", "li", "span"].indexOf(tag) !== -1;
      var hasRoom = rect.width >= 220 && rect.height >= 120;

      if (
        looksLikeContainer &&
        hasRoom &&
        !isFieldEl(current) &&
        !isActionableEl(current) &&
        !isImageLikeEl(current) &&
        !isTextEl(current) &&
        (hasVisualChromeEl(current) || childCount > 1)
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return fallback;
  }

  function getStoredMoveOffset(el) {
    if (!el || !el.getAttribute) return { x: 0, y: 0 };
    var rawX = el.getAttribute("data-he-move-x");
    var rawY = el.getAttribute("data-he-move-y");
    var x = parseFloat(rawX != null ? rawX : (el.style && el.style.left) || "0");
    var y = parseFloat(rawY != null ? rawY : (el.style && el.style.top) || "0");
    return {
      x: isNaN(x) ? 0 : x,
      y: isNaN(y) ? 0 : y,
    };
  }

  function getFreeMoveMode(el) {
    if (!el || !el.getAttribute) return "transform";
    var storedMode = (el.getAttribute("data-he-free-move-mode") || "").toLowerCase();
    if (storedMode === "absolute" || storedMode === "transform") {
      return storedMode;
    }
    return isAbsoluteFreeMoveEl(el) ? "absolute" : "transform";
  }

  function isAbsoluteFreeMoveEl(el) {
    if (!el || !el.style) return false;
    if (el.getAttribute("data-he-free-move") !== "1") return false;
    if ((el.getAttribute("data-he-free-move-mode") || "").toLowerCase() === "absolute") return true;
    var inlinePosition = (el.style.position || "").toLowerCase();
    if (inlinePosition === "absolute") return true;
    return (window.getComputedStyle(el).position || "").toLowerCase() === "absolute";
  }

  function getBaseTransform(el) {
    if (!el || !el.getAttribute || !el.style) return "";
    var stored = el.getAttribute("data-he-base-transform");
    if (stored != null) {
      return stored;
    }
    var current = el.style.transform && el.style.transform !== "none" ? el.style.transform : "";
    el.setAttribute("data-he-base-transform", current);
    return current;
  }

  function getBasePosition(el) {
    if (!el || !el.getAttribute || !el.style) return "";
    var stored = el.getAttribute("data-he-base-position");
    if (stored != null) {
      return stored;
    }
    var current = el.style.position || "";
    el.setAttribute("data-he-base-position", current);
    return current;
  }

  function shouldUseTransformFreeMove(el) {
    if (!el || !canEdit(el)) return false;
    var kind = getNodeType(el);
    return kind === "icon" || kind === "image" || kind === "text" || kind === "button" || kind === "field" || kind === "container";
  }

  function composeFreeMoveTransform(base, x, y) {
    var translate = "translate(" + (Math.round(x * 100) / 100) + "px, " + (Math.round(y * 100) / 100) + "px)";
    var normalizedBase = base && base !== "none" ? base.trim() : "";
    return normalizedBase ? (normalizedBase + " " + translate).trim() : translate;
  }

  function applyFreeMoveTransform(el, x, y) {
    if (!el || !el.style) return;
    var nextX = Math.round(x * 100) / 100;
    var nextY = Math.round(y * 100) / 100;
    var mode = getFreeMoveMode(el);
    el.setAttribute("data-he-move-x", String(nextX));
    el.setAttribute("data-he-move-y", String(nextY));
    var base = el.getAttribute ? el.getAttribute("data-he-base-transform") || "" : "";
    if (mode === "absolute") {
      el.style.left = nextX + "px";
      el.style.top = nextY + "px";
      el.style.transform = base && base !== "none" ? base : "";
      return;
    }
    el.style.left = "";
    el.style.top = "";
    el.style.transform = nextX || nextY ? composeFreeMoveTransform(base, nextX, nextY) : (base && base !== "none" ? base : "");
  }

  function clearFreeMoveTransform(el) {
    if (!el || !el.style) return;
    var base = el.getAttribute ? el.getAttribute("data-he-base-transform") || "" : "";
    el.removeAttribute && el.removeAttribute("data-he-move-x");
    el.removeAttribute && el.removeAttribute("data-he-move-y");
    el.style.left = "";
    el.style.top = "";
    el.style.transform = base && base !== "none" ? base : "";
  }

  function resetFreeMoveState(el) {
    if (!el || !el.style) return;
    var basePosition = el.getAttribute ? el.getAttribute("data-he-base-position") || "" : "";
    clearFreeMoveTransform(el);
    el.removeAttribute && el.removeAttribute("data-he-free-move");
    el.removeAttribute && el.removeAttribute("data-he-free-move-mode");
    el.removeAttribute && el.removeAttribute("data-he-base-transform");
    el.removeAttribute && el.removeAttribute("data-he-base-position");
    el.style.zIndex = "";
    el.style.willChange = "";
    el.style.transformOrigin = "";
    el.style.touchAction = "";
    el.style.left = "";
    el.style.top = "";
    el.style.position = basePosition || "";
  }

  function copyPersistedLayoutState(fromEl, toEl) {
    if (!fromEl || !toEl || !toEl.style) return;
    if (fromEl.dataset && fromEl.dataset.eid) {
      toEl.dataset.eid = fromEl.dataset.eid;
    }
    if (fromEl.getAttribute && fromEl.getAttribute("data-he-icon") && !toEl.getAttribute("data-he-icon")) {
      toEl.setAttribute("data-he-icon", fromEl.getAttribute("data-he-icon"));
    }
    [
      "data-he-free-move",
      "data-he-free-move-mode",
      "data-he-move-x",
      "data-he-move-y",
      "data-he-base-position",
      "data-he-base-transform",
    ].forEach(function (attrName) {
      var value = fromEl.getAttribute ? fromEl.getAttribute(attrName) : null;
      if (value != null) {
        toEl.setAttribute(attrName, value);
      }
    });
    [
      "position",
      "left",
      "top",
      "width",
      "height",
      "maxWidth",
      "maxHeight",
      "minWidth",
      "minHeight",
      "fontSize",
      "color",
      "zIndex",
      "margin",
      "willChange",
      "isolation",
      "display",
    ].forEach(function (prop) {
      if (fromEl.style && fromEl.style[prop] && (!toEl.style[prop] || toEl.style[prop] === "")) {
        toEl.style[prop] = fromEl.style[prop];
      }
    });
  }

  function getElementAnchorWithinRoot(el, root, offset) {
    var currentRoot = root || getEditorRoot(el);
    if (isAbsoluteFreeMoveEl(el)) {
      return { left: 0, top: 0 };
    }
    var rect = el.getBoundingClientRect();
    var rootRect = currentRoot.getBoundingClientRect();
    var moveOffset = offset || getStoredMoveOffset(el);
    return {
      left: rect.left - rootRect.left + (currentRoot.scrollLeft || 0) - moveOffset.x,
      top: rect.top - rootRect.top + (currentRoot.scrollTop || 0) - moveOffset.y,
    };
  }

  function getElementPositionWithinRoot(el, root) {
    var currentRoot = root || getEditorRoot(el);
    var rect = el.getBoundingClientRect();
    var rootRect = currentRoot.getBoundingClientRect();
    return {
      left: rect.left - rootRect.left + (currentRoot.scrollLeft || 0),
      top: rect.top - rootRect.top + (currentRoot.scrollTop || 0),
    };
  }

  function getFreeMoveBounds(el) {
    var parent = getFreeMoveRoot(el);
    var rect = parent.getBoundingClientRect();
    var width = Math.max(parent.clientWidth || 0, rect.width || 0, 24);
    var height = Math.max(parent.clientHeight || 0, rect.height || 0, 24);
    return {
      parent: parent,
      width: Math.max(24, width || 0),
      height: Math.max(24, height || 0)
    };
  }

  function normalizeFreeMoveElement(el) {
    if (!el || !el.style || el.getAttribute("data-he-free-move") !== "1") return false;
    if (isImportRootEl(el)) {
      resetFreeMoveState(el);
      el.style.width = "";
      el.style.height = "";
      el.style.maxWidth = "";
      el.style.maxHeight = "";
      el.style.margin = "";
      return true;
    }
    var cs = window.getComputedStyle(el);
    var changed = false;

    ensureFreeMoveStyles(el);
    var mode = getFreeMoveMode(el);

    var bounds = getFreeMoveBounds(el);
    if (mode === "absolute" && (cs.position === "absolute" || (el.style.position || "").toLowerCase() === "absolute")) {
      var legacyLeft = Math.max(0, getLengthValue(el, "left"));
      var legacyTop = Math.max(0, getLengthValue(el, "top"));
      var basePosition = el.getAttribute ? el.getAttribute("data-he-base-position") || "" : "";
      el.style.position = basePosition || "";
      el.style.left = "";
      el.style.top = "";
      el.setAttribute("data-he-move-x", String(legacyLeft));
      el.setAttribute("data-he-move-y", String(legacyTop));
      changed = true;
    }
    if (mode !== "absolute" && ((el.style.position || "").toLowerCase() === "absolute" || cs.position === "absolute")) {
      var restoredPosition = el.getAttribute ? el.getAttribute("data-he-base-position") || "" : "";
      el.style.position = restoredPosition || "";
      el.style.left = "";
      el.style.top = "";
      changed = true;
    }
    var offset = getStoredMoveOffset(el);
    var currentWidth = Math.max(18, getLengthValue(el, "width") || el.getBoundingClientRect().width || 18);
    var currentHeight = Math.max(18, getLengthValue(el, "height") || el.getBoundingClientRect().height || 18);
    var currentLeft = offset.x;
    var currentTop = offset.y;
    var nextWidth = currentWidth;
    var nextHeight = currentHeight;

    if (isIconCandidate(el)) {
      var iconMax = Math.max(18, Math.min(bounds.width, bounds.height, 220));
      var nextIconSize = clampValue(Math.max(currentWidth, currentHeight), 18, iconMax);
      if (Math.abs(nextIconSize - currentWidth) > 0.5 || Math.abs(nextIconSize - currentHeight) > 0.5) {
        nextWidth = nextIconSize;
        nextHeight = nextIconSize;
        el.style.fontSize = nextIconSize + "px";
        el.querySelectorAll("svg,[data-he-icon-root='1']").forEach(function (node) {
          if (node && node.style) {
            node.style.width = nextIconSize + "px";
            node.style.height = nextIconSize + "px";
            node.style.fontSize = nextIconSize + "px";
          }
        });
        changed = true;
      }
    } else if (mode === "absolute") {
      var maxWidth = Math.max(24, bounds.width);
      var maxHeight = Math.max(24, bounds.height);
      var clampedWidth = clampValue(currentWidth, 24, maxWidth);
      var clampedHeight = clampValue(currentHeight, 24, maxHeight);
      if (Math.abs(clampedWidth - currentWidth) > 0.5) {
        nextWidth = clampedWidth;
        changed = true;
      }
      if (Math.abs(clampedHeight - currentHeight) > 0.5) {
        nextHeight = clampedHeight;
        changed = true;
      }
    }

    var minLeft = 0;
    var maxLeft = Math.max(0, bounds.width - nextWidth);
    var minTop = 0;
    var maxTop = Math.max(0, bounds.height - nextHeight);
    var clampedLeft = clampValue(currentLeft, minLeft, maxLeft);
    var clampedTop = clampValue(currentTop, minTop, maxTop);

    if (Math.abs(clampedLeft - currentLeft) > 0.5) {
      applyFreeMoveTransform(el, clampedLeft, clampedTop);
      changed = true;
    }
    if (!changed) {
      applyFreeMoveTransform(el, clampedLeft, clampedTop);
    }
    if (mode === "absolute" && Math.abs(nextWidth - currentWidth) > 0.5) {
      el.style.width = nextWidth + "px";
      changed = true;
    }
    if (mode === "absolute" && Math.abs(nextHeight - currentHeight) > 0.5) {
      el.style.height = nextHeight + "px";
      changed = true;
    }
    return changed;
  }

  function normalizeStandaloneIconElement(el) {
    if (!el || !el.style || !isIconCandidate(el)) return false;
    var bounds = getFreeMoveBounds(el);
    var rect = el.getBoundingClientRect();
    var iconMax = Math.max(18, Math.min(bounds.width, bounds.height, 220));
    var nextIconSize = clampValue(Math.max(rect.width, rect.height, getNumericComputed(el, "fontSize", 18)), 12, iconMax);
    var changed = false;

    if (rect.width > iconMax + 1 || rect.height > iconMax + 1 || getNumericComputed(el, "fontSize", 18) > iconMax + 1) {
      el.style.width = nextIconSize + "px";
      el.style.height = nextIconSize + "px";
      el.style.fontSize = nextIconSize + "px";
      el.style.maxWidth = nextIconSize + "px";
      el.style.maxHeight = nextIconSize + "px";
      el.querySelectorAll("svg,[data-he-icon-root='1']").forEach(function (node) {
        if (node && node.style) {
          node.style.width = nextIconSize + "px";
          node.style.height = nextIconSize + "px";
          node.style.fontSize = nextIconSize + "px";
          node.style.maxWidth = nextIconSize + "px";
          node.style.maxHeight = nextIconSize + "px";
        }
      });
      changed = true;
    }

    return changed;
  }

  function ensureRootMoveCapacity(root, desiredLeft, desiredTop, width, height) {
    return;
  }

  function recalculateRootMoveCapacity(root) {
    if (!root || !root.style || !root.querySelectorAll) return;
    root.style.minHeight = "";
  }

  function normalizePersistedEditorLayout() {
    var changed = false;
    document.querySelectorAll("[data-he-free-move='1']").forEach(function (node) {
      if (node && normalizeFreeMoveElement(node)) {
        changed = true;
      }
    });
    document.querySelectorAll("[data-he-icon-root='1'], [data-he-icon], .he-inline-icon, .lucide").forEach(function (node) {
      if (node && normalizeStandaloneIconElement(node)) {
        changed = true;
      }
    });
    return changed;
  }

  function hasMeaningfulContent(el) {
    if (!el) return false;
    var text = ((el.innerText || el.textContent || "") + "").replace(/\s+/g, " ").trim();
    if (text.length > 0) return true;
    if (el.querySelector && el.querySelector("input,textarea,select,button,a,img,svg,video,iframe,canvas")) return true;
    return false;
  }

  function cleanupLayout(rootEl) {
    var scope = rootEl && rootEl.querySelectorAll ? rootEl : document.body;
    var changed = false;

    if (scope && scope.style) {
      if (scope.style.height || scope.style.minHeight || scope.style.maxHeight) {
        scope.style.height = "";
        scope.style.minHeight = "";
        scope.style.maxHeight = "";
        changed = true;
      }
    }

    if (scope.querySelectorAll) {
      scope.querySelectorAll("*").forEach(function (node) {
        if (!node || !node.style || !canEdit(node)) return;

        if (node.getAttribute("data-he-free-move") === "1") {
          if (normalizeFreeMoveElement(node)) changed = true;
        }

        if (isIconCandidate(node)) {
          if (normalizeStandaloneIconElement(node)) changed = true;
        }

        var rect = node.getBoundingClientRect();
        var isSpacerLike =
          !hasMeaningfulContent(node) &&
          !node.children.length &&
          rect.height > 72;

        if (isSpacerLike) {
          node.style.height = "";
          node.style.minHeight = "";
          node.style.maxHeight = "";
          node.style.marginTop = "";
          node.style.marginBottom = "";
          node.style.paddingTop = "";
          node.style.paddingBottom = "";
          changed = true;
        }
      });
    }

    if (changed) {
      recalculateRootMoveCapacity(scope);
      reportHeight();
    }
    return changed;
  }

  function ensureFreeMoveStyles(el) {
    if (!el || !el.style) return;
    if (isImportRootEl(el)) return;
    var rect = el.getBoundingClientRect();
    var cs = window.getComputedStyle(el);
    el.setAttribute("data-he-free-move", "1");
    var moveMode = shouldUseTransformFreeMove(el) ? "transform" : "absolute";
    el.setAttribute("data-he-free-move-mode", moveMode);
    var root = getFreeMoveRoot(el);
    var rootStyle = window.getComputedStyle(root);
    if (cs.display === "inline") {
      el.style.display = "inline-block";
    }
    if (moveMode === "absolute" && rootStyle.position === "static" && !root.style.position) {
      root.style.position = "relative";
    }
    if (moveMode === "absolute" && (rootStyle.overflow === "hidden" || rootStyle.overflow === "clip")) {
      root.style.overflow = "visible";
    }
    if (!root.style.isolation) {
      root.style.isolation = "isolate";
    }
    getBaseTransform(el);
    getBasePosition(el);
    var currentOffset = getStoredMoveOffset(el);
    if (moveMode === "absolute" && !isAbsoluteFreeMoveEl(el)) {
      var currentPosition = getElementPositionWithinRoot(el, root);
      el.style.position = "absolute";
      el.style.left = currentPosition.left + "px";
      el.style.top = currentPosition.top + "px";
      if (!el.style.width || el.style.width === "auto") {
        el.style.width = Math.max(18, rect.width) + "px";
      }
      if ((!el.style.height || el.style.height === "auto") && (canResizeFreely(el) || isIconCandidate(el))) {
        el.style.height = Math.max(18, rect.height) + "px";
      }
      currentOffset = { x: currentPosition.left, y: currentPosition.top };
      el.setAttribute("data-he-move-x", String(currentPosition.left));
      el.setAttribute("data-he-move-y", String(currentPosition.top));
    }
    if (moveMode !== "absolute" && ((el.style.position || "").toLowerCase() === "absolute" || cs.position === "absolute")) {
      var basePosition = el.getAttribute ? el.getAttribute("data-he-base-position") || "" : "";
      el.style.position = basePosition || "";
      el.style.left = "";
      el.style.top = "";
    }
    if (moveMode === "absolute" && !el.style.flex) {
      el.style.flex = "none";
    }
    if (moveMode === "absolute" && !el.style.alignSelf) {
      el.style.alignSelf = "flex-start";
    }
    if (!el.style.zIndex || el.style.zIndex === "auto") {
      el.style.zIndex = moveMode === "absolute" ? "2147483000" : "4";
    }
    if (!el.hasAttribute("data-he-move-x")) {
      el.setAttribute("data-he-move-x", "0");
    }
    if (!el.hasAttribute("data-he-move-y")) {
      el.setAttribute("data-he-move-y", "0");
    }
    if (!el.style.isolation) {
      el.style.isolation = "isolate";
    }
    if (moveMode !== "absolute") {
      el.style.transformOrigin = "top left";
    }
    el.style.touchAction = "none";
    applyFreeMoveTransform(el, currentOffset.x, currentOffset.y);
    el.style.willChange = moveMode === "absolute" ? "left, top, width, height" : "transform, width, height";
    if (moveMode === "absolute") {
      promoteFreeMoveAncestors(el);
    }
  }

  function beginSingleFreeMove(el, clientX, clientY, touchIdentifier) {
    if (!el || !el.isConnected || !canUseFreeMove(el)) return false;
    ensureFreeMoveStyles(el);
    primeFreeMoveLayout(el);
    var currentOffset = getStoredMoveOffset(el);
    var root = getFreeMoveRoot(el);
    var anchorPosition = getElementAnchorWithinRoot(el, root, currentOffset);
    var rect = el.getBoundingClientRect();
    freeMoveState = {
      el: el,
      startX: clientX,
      startY: clientY,
      startLeft: currentOffset.x,
      startTop: currentOffset.y,
      anchorLeft: anchorPosition.left,
      anchorTop: anchorPosition.top,
      pointerOffsetX: clientX - rect.left,
      pointerOffsetY: clientY - rect.top,
      root: root
    };
    setInteractionPoint(clientX, clientY, touchIdentifier);
    beginInteractionLock("grabbing", touchIdentifier);
    ensureAutoScrollLoop();
    emitToParent({ __editor_interaction_lock: true, active: true, kind: "move" });
    return true;
  }

  function detachDirectFreeMoveHandle() {
    if (freeMoveDirectHandleEl && freeMoveDirectHandle) {
      freeMoveDirectHandleEl.removeEventListener("mousedown", freeMoveDirectHandle, true);
      freeMoveDirectHandleEl.removeEventListener("touchstart", freeMoveDirectHandle, true);
      freeMoveDirectHandleEl.removeEventListener("pointerdown", freeMoveDirectHandle, true);
    }
    freeMoveDirectHandleEl = null;
    freeMoveDirectHandle = null;
  }

  function attachDirectFreeMoveHandle(el) {
    detachDirectFreeMoveHandle();
    if (!el || !canUseFreeMove(el)) return;
    freeMoveDirectHandleEl = el;
    freeMoveDirectHandle = function (event) {
      if (typeof event.button === "number" && event.button !== 0) return;
      if (editingEl || resizeState || freeMoveState) return;
      if (isRuntimeUiTarget(event.target)) return;
      if (!selectedEl || selectedEl !== el || freeMoveEl !== el || freeMoveIsGroup) return;
      var point = getEventClientPoint(event);
      if (!point) return;
      stopGestureEvent(event);
      suppressSelectionClick = true;
      beginSingleFreeMove(el, point.x, point.y, point.id);
    };
    el.addEventListener("mousedown", freeMoveDirectHandle, true);
    el.addEventListener("touchstart", freeMoveDirectHandle, { passive: false, capture: true });
    el.addEventListener("pointerdown", freeMoveDirectHandle, true);
  }

  function primeFreeMoveLayout(el) {
    try {
      if (el && el.getBoundingClientRect) {
        el.getBoundingClientRect();
      }
      if (document.body) {
        document.body.offsetHeight;
      }
    } catch (_err) {}
  }

  function primeSelectionUiLayout() {
    try {
      if (selBox && selBox.style.display !== "none") {
        selBox.getBoundingClientRect();
      }
      if (moveHitBox && moveHitBox.style.display !== "none") {
        moveHitBox.getBoundingClientRect();
      }
      if (groupBox && groupBox.style.display !== "none") {
        groupBox.getBoundingClientRect();
      }
      if (selToolbar && selToolbar.style.display !== "none") {
        selToolbar.getBoundingClientRect();
      }
      if (resizeHandle && resizeHandle.style.display !== "none") {
        resizeHandle.getBoundingClientRect();
      }
    } catch (_err) {}
  }

  function startGroupMove(clientX, clientY, touchIdentifier) {
    if (!hasGroupedSelection() || !freeMoveEl || !freeMoveIsGroup) return false;
    var selection = getUniqueEditableElements(multiSelectedEls);
    if (!selection.length || !selection.every(function (node) { return canUseFreeMove(node); })) return false;
    var items = selection.map(function (node) {
      ensureFreeMoveStyles(node);
      var currentOffset = getStoredMoveOffset(node);
      var root = getFreeMoveRoot(node);
      var anchorPosition = getElementAnchorWithinRoot(node, root, currentOffset);
      var rect = node.getBoundingClientRect();
      var bounds = getFreeMoveBounds(node);
      return {
        el: node,
        startLeft: currentOffset.x,
        startTop: currentOffset.y,
        anchorLeft: anchorPosition.left,
        anchorTop: anchorPosition.top,
        width: Math.max(18, rect.width || getLengthValue(node, "width")),
        height: Math.max(18, rect.height || getLengthValue(node, "height")),
        bounds: bounds,
        root: root
      };
    });
    freeMoveState = {
      isGroup: true,
      startX: clientX,
      startY: clientY,
      items: items
    };
    setInteractionPoint(clientX, clientY, touchIdentifier);
    beginInteractionLock("grabbing", touchIdentifier);
    ensureAutoScrollLoop();
    emitToParent({ __editor_interaction_lock: true, active: true, kind: "group" });
    return true;
  }

  function startSelectedResize(clientX, clientY, touchIdentifier) {
    if (!selectedEl || !selectedEl.isConnected || !canResizeFreely(selectedEl)) return false;
    ensureFreeMoveStyles(selectedEl);
    var rect = selectedEl.getBoundingClientRect();
    var startOffset = getStoredMoveOffset(selectedEl);
    var anchorPosition = getElementAnchorWithinRoot(selectedEl, getFreeMoveRoot(selectedEl), startOffset);
    resizeState = {
      el: selectedEl,
      startX: clientX,
      startY: clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      startLeft: startOffset.x,
      startTop: startOffset.y,
      anchorLeft: anchorPosition.left,
      anchorTop: anchorPosition.top,
      startFontSize: getNumericComputed(selectedEl, "fontSize", rect.height || rect.width || 18),
      keepRatio: isImageLikeEl(selectedEl),
      ratio: rect.height > 0 ? rect.width / rect.height : 1,
    };
    setInteractionPoint(clientX, clientY, touchIdentifier);
    beginInteractionLock("nwse-resize", touchIdentifier);
    ensureAutoScrollLoop();
    emitToParent({ __editor_interaction_lock: true, active: true, kind: "resize" });
    return true;
  }

  function setMovePointerPassthrough(el, enabled) {
    if (!el || !el.style) return;
    if (enabled) {
      if (!el.hasAttribute("data-he-base-pointer-events")) {
        el.setAttribute("data-he-base-pointer-events", el.style.pointerEvents || "");
      }
      el.style.pointerEvents = "none";
      return;
    }
    if (!el.hasAttribute("data-he-base-pointer-events")) return;
    var basePointerEvents = el.getAttribute("data-he-base-pointer-events") || "";
    el.style.pointerEvents = basePointerEvents;
    el.removeAttribute("data-he-base-pointer-events");
  }

  function promoteFreeMoveAncestors(el) {
    var current = el ? el.parentElement : null;
    var depth = 0;

    while (current && current !== document.body && current !== document.documentElement && depth < 8) {
      if (!canEdit(current)) {
        current = current.parentElement;
        depth += 1;
        continue;
      }

      var cs = window.getComputedStyle(current);
      var overflowX = cs.overflowX || "";
      var overflowY = cs.overflowY || "";
      var overflow = cs.overflow || "";
      var clipsChildren =
        overflow === "hidden" ||
        overflow === "clip" ||
        overflowX === "hidden" ||
        overflowX === "clip" ||
        overflowY === "hidden" ||
        overflowY === "clip";

      if (clipsChildren) {
        current.style.overflow = "visible";
      }

      if (cs.position === "static" && !current.style.position) {
        current.style.position = "relative";
      }

      if ((!current.style.zIndex || current.style.zIndex === "auto") && (!cs.zIndex || cs.zIndex === "auto")) {
        current.style.zIndex = "1";
      }

      if (!current.style.isolation) {
        current.style.isolation = "isolate";
      }

      current = current.parentElement;
      depth += 1;
    }
  }

  function syncMoveUi() {
    var groupButton = getToolbarButton("group");
    var moveButton = getToolbarButton("drag");
    var upButton = getToolbarButton("up");
    var downButton = getToolbarButton("down");
    var deleteButton = getToolbarButton("delete");
    var editButton = getToolbarButton("edit");
    var protectedSelection = !!(selectedEl && isImportRootEl(selectedEl));
    var grouped = hasGroupedSelection();
    var movableSelection = !!(selectedEl && canUseFreeMove(selectedEl));
    var resizableSelection = !!(selectedEl && canResizeFreely(selectedEl));
    var active = !!(freeMoveEl && ((freeMoveIsGroup && grouped) || (!freeMoveIsGroup && selectedEl && freeMoveEl === selectedEl)));
    var activelyDragging = !!(freeMoveState || resizeState);
    var selectedRect = selectedEl && selectedEl.getBoundingClientRect ? selectedEl.getBoundingClientRect() : null;
    var smallTargetSelection = !!(selectedRect && (getNodeType(selectedEl) === "icon" || selectedRect.width < 24 || selectedRect.height < 24));
    var moveOverlayActive = !grouped && movableSelection && ((active && (coarsePointer || smallTargetSelection)) || (coarsePointer && !!selectedEl));
    var singleOverlayInteractive = (active && !grouped) || (coarsePointer && !grouped && movableSelection);
    if (groupButton) {
      groupButton.disabled = protectedSelection;
      groupButton.style.opacity = protectedSelection ? ".35" : "1";
      groupButton.style.borderColor = multiSelectMode ? "rgba(34,197,94,.28)" : "rgba(255,255,255,.08)";
      groupButton.style.background = multiSelectMode ? "rgba(34,197,94,.14)" : "rgba(255,255,255,.03)";
      groupButton.style.color = multiSelectMode ? "#bbf7d0" : "#e2eaf0";
    }
    if (editButton) {
      editButton.disabled = protectedSelection || grouped;
      editButton.style.opacity = protectedSelection || grouped ? ".35" : "1";
    }
    if (moveButton) {
      moveButton.textContent = activelyDragging ? "Soltar" : grouped ? "Mover grupo" : "Mover";
      moveButton.disabled = protectedSelection || (!grouped && !movableSelection);
      moveButton.style.opacity = protectedSelection || (!grouped && !movableSelection) ? ".35" : "1";
      moveButton.style.borderColor = active || activelyDragging ? "rgba(232,57,42,.22)" : "rgba(255,255,255,.08)";
      moveButton.style.background = active || activelyDragging ? "rgba(232,57,42,.12)" : "rgba(255,255,255,.03)";
      moveButton.style.color = active || activelyDragging ? "#ffb2aa" : "#e2eaf0";
    }
    selBox.style.pointerEvents = singleOverlayInteractive ? "auto" : "none";
    groupBox.style.pointerEvents = active && grouped ? "auto" : "none";
    selBox.style.cursor = active && !grouped ? "move" : "default";
    groupBox.style.cursor = active && grouped ? "move" : "default";
    moveHitBox.style.pointerEvents = moveOverlayActive ? "auto" : "none";
    moveHitBox.style.cursor = moveOverlayActive ? "move" : "default";
    if (!moveOverlayActive) {
      moveHitBox.style.display = "none";
    }
    if (upButton) {
      upButton.disabled = protectedSelection || grouped;
      upButton.style.opacity = protectedSelection || grouped ? ".35" : "1";
    }
    if (downButton) {
      downButton.disabled = protectedSelection || grouped;
      downButton.style.opacity = protectedSelection || grouped ? ".35" : "1";
    }
    if (deleteButton) {
      deleteButton.disabled = protectedSelection;
      deleteButton.style.opacity = protectedSelection ? ".35" : "1";
    }
    selBox.style.pointerEvents = singleOverlayInteractive ? "auto" : "none";
    selBox.style.cursor = active && !grouped ? "move" : "default";
    groupBox.style.pointerEvents = active && grouped ? "auto" : "none";
    groupBox.style.cursor = active && grouped ? "move" : "default";
    moveHitBox.style.pointerEvents = moveOverlayActive ? "auto" : "none";
    moveHitBox.style.cursor = moveOverlayActive ? "move" : "default";
    resizeHandle.style.opacity = selectedEl && !protectedSelection && !grouped && resizableSelection ? "1" : "0";
    resizeHandle.style.pointerEvents = selectedEl && !protectedSelection && !grouped && resizableSelection ? "auto" : "none";
  }

  function placeToolbar(el) {
    if (!el) {
      placeToolbarForRect(null);
      return;
    }
    placeToolbarForRect(el.getBoundingClientRect());
  }

  function setFreeMove(el, asGroup) {
    if (freeMoveEl) {
      setMovePointerPassthrough(freeMoveEl, false);
    }
    detachDirectFreeMoveHandle();
    freeMoveEl = el || null;
    freeMoveIsGroup = !!asGroup;
    if (freeMoveEl) {
      if (freeMoveIsGroup && hasGroupedSelection()) {
        getUniqueEditableElements(multiSelectedEls).forEach(function (node) {
          ensureFreeMoveStyles(node);
        });
      } else {
        ensureFreeMoveStyles(freeMoveEl);
        setMovePointerPassthrough(freeMoveEl, getNodeType(freeMoveEl) === "icon");
        attachDirectFreeMoveHandle(freeMoveEl);
      }
    }
    syncMoveUi();
    var primeTarget = freeMoveEl && freeMoveEl.isConnected ? freeMoveEl : document.body;
    if (primeTarget) {
      primeFreeMoveLayout(primeTarget);
      primeSelectionUiLayout();
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(function () {
          primeFreeMoveLayout(primeTarget && primeTarget.isConnected ? primeTarget : document.body);
          primeSelectionUiLayout();
        });
      }
    }
  }

  function canEdit(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    if (el.closest && el.closest("[data-he-runtime],[data-he-editor-overlay]")) return false;
    var tag = (el.tagName || "").toLowerCase();
    return EID_SKIP.indexOf(tag) === -1;
  }

  function isRuntimeUiTarget(target) {
    return !!(target && target.closest && target.closest("[data-he-runtime],[data-he-editor-overlay]"));
  }

  function hasCompactText(el) {
    if (!el) return true;
    var text = ((el.innerText || el.textContent || "") + "").replace(/\\s+/g, " ").trim();
    return text.length <= 2;
  }

  function normalizeTextValue(value) {
    return ((value || "") + "").replace(/\\s+/g, " ").trim();
  }

  function getVisibleTextContent(el) {
    if (!el) return "";
    return normalizeTextValue(el.innerText || el.textContent || "");
  }

  function getOwnTextContent(el) {
    if (!el || !el.childNodes) return "";
    var parts = [];
    for (var index = 0; index < el.childNodes.length; index += 1) {
      var child = el.childNodes[index];
      if (child && child.nodeType === 3 && child.textContent) {
        parts.push(child.textContent);
      }
    }
    return normalizeTextValue(parts.join(" "));
  }

  function hasVisualChromeEl(el) {
    if (!el || !el.style) return false;
    var cs = window.getComputedStyle(el);
    var bg = cs.backgroundColor || "";
    var borderTop = parseFloat(cs.borderTopWidth || "0");
    var borderRight = parseFloat(cs.borderRightWidth || "0");
    var borderBottom = parseFloat(cs.borderBottomWidth || "0");
    var borderLeft = parseFloat(cs.borderLeftWidth || "0");
    var radius = parseFloat(cs.borderRadius || "0");
    return (
      (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") ||
      borderTop > 0 ||
      borderRight > 0 ||
      borderBottom > 0 ||
      borderLeft > 0 ||
      radius > 0 ||
      (cs.boxShadow && cs.boxShadow !== "none")
    );
  }

  function hasNestedComplexContent(el) {
    return !!(el && el.querySelector && el.querySelector("input,textarea,select,button,a,img,video,iframe,table,ul,ol"));
  }

  function isIconStructuralTag(tag) {
    return ICON_SHAPE_TAGS.indexOf(tag) !== -1 || tag === "svg";
  }

  function isInsideIconRoot(el) {
    if (!el || !el.closest) return false;
    var host = el.closest("[data-he-icon-root='1'],[data-he-icon],.he-inline-icon,.lucide");
    return !!host && host !== el;
  }

  function inferEditorNodeType(el) {
    if (!el || !el.tagName) return "container";
    var tag = (el.tagName || "").toLowerCase();
    var className = typeof el.className === "string" ? el.className.toLowerCase() : "";
    var text = ((el.textContent || "") + "").replace(/\\s+/g, " ").trim();

    if (
      el.getAttribute("data-he-icon-root") === "1" ||
      !!el.getAttribute("data-he-icon") ||
      className.indexOf("he-inline-icon") !== -1 ||
      className.indexOf("lucide") !== -1
    ) {
      return "icon";
    }

    if (tag === "svg" && !isInsideIconRoot(el)) {
      return "icon";
    }

    if (tag === "img") return "image";
    if (tag === "input" || tag === "textarea" || tag === "select") return "field";

    if (
      tag === "button" ||
      tag === "a" ||
      el.getAttribute("role") === "button" ||
      el.hasAttribute("onclick")
    ) {
      return "button";
    }

    if (
      ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "label", "small", "strong", "em", "blockquote", "li"].indexOf(tag) !== -1 &&
      text.length > 0
    ) {
      return "text";
    }

    return "container";
  }

  function markEditableNodeTypes(root) {
    var scope = root || document.body;
    if (!scope || !scope.querySelectorAll) return;
    scope.querySelectorAll("*").forEach(function (node) {
      if (!node || !node.tagName) return;
      var tag = (node.tagName || "").toLowerCase();
      if (isInsideIconRoot(node) && isIconStructuralTag(tag)) {
        node.removeAttribute("data-he-node-type");
        return;
      }
      if (!node || !node.dataset || !node.dataset.eid) return;
      node.setAttribute("data-he-node-type", inferEditorNodeType(node));
    });
  }

  function getNodeType(el) {
    if (!el || !el.getAttribute) return null;
    return el.getAttribute("data-he-node-type") || inferEditorNodeType(el);
  }

  function getEditableOwner(el) {
    if (!el || !(el instanceof Element)) return null;
    var iconHost = getIconHost(el);
    if (iconHost) return iconHost;
    return el.closest("[data-eid][data-he-node-type]") || el.closest("[data-eid]") || null;
  }

  function getTouchContainerTarget(raw) {
    if (!coarsePointer || !raw || !(raw instanceof Element)) return null;
    var current = raw;
    var depth = 0;
    while (current && current !== document.body && current !== document.documentElement && depth < 6) {
      if (
        canEdit(current) &&
        getNodeType(current) === "container" &&
        !isImportRootEl(current) &&
        (hasVisualChromeEl(current) || (current.children && current.children.length > 1))
      ) {
        return current;
      }
      current = current.parentElement;
      depth += 1;
    }
    return null;
  }

  function getPreferredSelectionTarget(raw) {
    if (!raw || !(raw instanceof Element)) return null;
    var icon = getIconHost(raw);
    if (icon && canEdit(icon)) return icon;
    var field = raw.closest("[data-he-node-type='field']");
    if (field && canEdit(field)) return field;
    var button = raw.closest("[data-he-node-type='button']");
    if (button && canEdit(button)) return button;
    var touchContainer = getTouchContainerTarget(raw);
    if (touchContainer && canEdit(touchContainer)) return touchContainer;
    var text = raw.closest("[data-he-node-type='text']");
    if (text && canEdit(text)) return text;
    var owner = getEditableOwner(raw);
    return owner && canEdit(owner) ? owner : null;
  }

  function canUseFreeMove(el) {
    var kind = getNodeType(el);
    if (kind === "icon" || kind === "text" || kind === "button" || kind === "image" || kind === "field") return true;
    if (kind === "container" && !isImportRootEl(el)) return true;
    return false;
  }

  function canResizeFreely(el) {
    var kind = getNodeType(el);
    return kind === "icon" || kind === "button" || kind === "image" || kind === "container" || kind === "field" || kind === "text";
  }

  function isIconCandidate(el) {
    if (!el || !el.tagName) return false;
    if (getNodeType(el) === "icon") return true;
    var tag = (el.tagName || "").toLowerCase();
    var cls = typeof el.className === "string" ? el.className.toLowerCase() : "";
    if (tag === "svg" && !isInsideIconRoot(el)) return true;
    if (ICON_SHAPE_TAGS.indexOf(tag) !== -1 && !isInsideIconRoot(el)) return true;
    if (el.getAttribute("data-he-icon-root") === "1" || !!el.getAttribute("data-he-icon")) return true;
    if (cls.indexOf("he-inline-icon") !== -1 || cls.indexOf("lucide") !== -1) return true;
    if ((tag === "span" || tag === "i" || tag === "em" || tag === "strong" || tag === "small" || tag === "div") && getDirectIconChild(el) && hasCompactText(el)) return true;
    return false;
  }

  function getIconHost(el) {
    if (!el || !(el instanceof Element)) return null;
    return (
      el.closest("[data-he-icon-root='1'],[data-he-icon],.he-inline-icon,.lucide") ||
      el.closest("[data-he-node-type='icon']")
    );
  }

  function getDirectIconChild(el) {
    if (!el || !el.children) return null;
    for (var index = 0; index < el.children.length; index += 1) {
      var child = el.children[index];
      if (isIconCandidate(child) && canEdit(child)) return child;
    }
    return null;
  }

  function looksLikeButtonContainerEl(el) {
    if (!el || !el.tagName || isImportRootEl(el) || isFieldEl(el) || isImageEl(el) || isIconCandidate(el) || isActionableEl(el)) return false;
    var tag = (el.tagName || "").toLowerCase();
    if (["div", "span", "label", "li", "p"].indexOf(tag) === -1) return false;
    if (hasNestedComplexContent(el)) return false;
    if (el.children && el.children.length > 4) return false;
    var text = getVisibleTextContent(el);
    if (!text || text.length > 90) return false;
    var cs = window.getComputedStyle(el);
    var display = (cs.display || "").toLowerCase();
    var inlineLike = display.indexOf("inline") !== -1 || display.indexOf("flex") !== -1 || display.indexOf("grid") !== -1;
    var clickable = cs.cursor === "pointer" || el.getAttribute("role") === "button" || el.tabIndex >= 0;
    var hasIcon = !!getDirectIconChild(el) || !!(el.querySelector && el.querySelector("[data-he-icon],[data-he-icon-root='1'],svg,.he-inline-icon,.lucide"));
    return (hasVisualChromeEl(el) || hasIcon) && (inlineLike || clickable);
  }

  function looksLikeTextContainerEl(el) {
    if (!el || !el.tagName || isImportRootEl(el) || isFieldEl(el) || isImageEl(el) || isIconCandidate(el) || isActionableEl(el) || looksLikeButtonContainerEl(el)) return false;
    var tag = (el.tagName || "").toLowerCase();
    if (["div", "span", "label", "li", "p"].indexOf(tag) === -1) return false;
    if (hasNestedComplexContent(el)) return false;
    if (el.children && el.children.length > 3) return false;
    var directText = getOwnTextContent(el);
    var text = directText || getVisibleTextContent(el);
    if (!text || text.length > 180) return false;
    return true;
  }

  function isPointNearRect(rect, clientX, clientY, padding) {
    var pad = typeof padding === "number" ? padding : 0;
    return (
      clientX >= rect.left - pad &&
      clientX <= rect.right + pad &&
      clientY >= rect.top - pad &&
      clientY <= rect.bottom + pad
    );
  }

  function getRectDistanceToPoint(rect, clientX, clientY) {
    var dx = 0;
    var dy = 0;
    if (clientX < rect.left) dx = rect.left - clientX;
    else if (clientX > rect.right) dx = clientX - rect.right;
    if (clientY < rect.top) dy = rect.top - clientY;
    else if (clientY > rect.bottom) dy = clientY - rect.bottom;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function findBestInlineIconTarget(source, clientX, clientY) {
    if (!source) return null;
    var pool = [];
    var seen = [];

    function pushCandidate(node) {
      if (!node || !canEdit(node) || seen.indexOf(node) !== -1) return;
      seen.push(node);
      pool.push(node);
    }

    pushCandidate(source);
    if (source.querySelectorAll) {
      source.querySelectorAll("[data-he-icon-root='1'],[data-he-icon],svg,.he-inline-icon,.lucide").forEach(function (node) {
        pushCandidate(node);
      });
    }

    var best = null;
    var bestScore = Infinity;

    for (var index = 0; index < pool.length; index += 1) {
      var candidate = pool[index];
      var host = getIconHost(candidate) || candidate;
      if (!host || !canEdit(host)) continue;
      var rect = host.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (!isPointNearRect(rect, clientX, clientY, 10)) continue;
      var distance = getRectDistanceToPoint(rect, clientX, clientY);
      var area = Math.max(1, rect.width * rect.height);
      var score = distance * 1000 + area;
      if (score < bestScore) {
        bestScore = score;
        best = host;
      }
    }

    return best;
  }

  function findBestInlineTextTarget(source, clientX, clientY) {
    if (!source || !canEdit(source)) return null;
    var pool = [];
    var seen = [];

    function pushCandidate(node) {
      if (!node || !canEdit(node) || seen.indexOf(node) !== -1) return;
      seen.push(node);
      pool.push(node);
    }

    function isTextLikeCandidate(node) {
      return !!node && canEdit(node) && (isTextEl(node) || looksLikeTextContainerEl(node) || looksLikeButtonContainerEl(node));
    }

    pushCandidate(source);
    if (source.querySelectorAll) {
      source.querySelectorAll(TEXT_TAGS.join(",") + ",div,span,label,li").forEach(function (node) {
        if (isTextLikeCandidate(node)) {
          pushCandidate(node);
        }
      });
    }

    var best = null;
    var bestScore = Infinity;

    for (var index = 0; index < pool.length; index += 1) {
      var candidate = pool[index];
      if (!isTextLikeCandidate(candidate)) continue;
      var rect = candidate.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (!isPointNearRect(rect, clientX, clientY, 8)) continue;
      var distance = getRectDistanceToPoint(rect, clientX, clientY);
      var area = Math.max(1, rect.width * rect.height);
      var score = distance * 1000 + area;
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    return best;
  }

  function normalizeSelectionTarget(el) {
    if (!el || !canEdit(el)) return el;
    var typedTarget = getPreferredSelectionTarget(el);
    if (typedTarget && canEdit(typedTarget)) {
      el = typedTarget;
    }
    var tag = (el.tagName || "").toLowerCase();
    var iconHost = getIconHost(el);

    if (ICON_SHAPE_TAGS.indexOf(tag) !== -1) {
      if (iconHost && canEdit(iconHost)) return iconHost;
    }

    if (tag === "svg" && iconHost && canEdit(iconHost)) {
      return iconHost;
    }

    if (isIconCandidate(el)) {
      if (
        el.getAttribute("data-he-icon-root") === "1" ||
        !!el.getAttribute("data-he-icon") ||
        (typeof el.className === "string" && el.className.toLowerCase().indexOf("he-inline-icon") !== -1)
      ) {
        return el;
      }
      if (iconHost && iconHost !== el && canEdit(iconHost)) return iconHost;
      return el;
    }

    var nestedIcon = getDirectIconChild(el);
    if (nestedIcon && hasCompactText(el)) {
      var nestedHost = getIconHost(nestedIcon);
      return nestedHost && canEdit(nestedHost) ? nestedHost : nestedIcon;
    }

    return el;
  }

  function isFieldEl(el) {
    if (!el || !el.tagName) return false;
    var tag = (el.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select";
  }

  function isImageEl(el) {
    return !!el && !!el.tagName && (el.tagName || "").toLowerCase() === "img";
  }

  function getSelectionTargetFromPoint(clientX, clientY, fallback) {
    var preferredFallback = getPreferredSelectionTarget(fallback);
    if (preferredFallback && canEdit(preferredFallback)) {
      fallback = preferredFallback;
    }

    var earlyIcon = null;
    if (typeof document.elementsFromPoint === "function") {
      var rawStack = document.elementsFromPoint(clientX, clientY) || [];
      for (var rawIndex = 0; rawIndex < rawStack.length; rawIndex += 1) {
        var rawNode = rawStack[rawIndex];
        if (!canEdit(rawNode)) continue;
        var preferred = getPreferredSelectionTarget(rawNode);
        if (preferred && canEdit(preferred) && getNodeType(preferred) === "icon") {
          return normalizeSelectionTarget(preferred);
        }
        earlyIcon = findBestInlineIconTarget(rawNode, clientX, clientY);
        if (earlyIcon && canEdit(earlyIcon)) {
          return normalizeSelectionTarget(earlyIcon);
        }
      }
    }

    var fallbackIcon = findBestInlineIconTarget(fallback, clientX, clientY);
    if (fallbackIcon && canEdit(fallbackIcon)) {
      return normalizeSelectionTarget(fallbackIcon);
    }

    var earlyText = null;
    if (typeof document.elementsFromPoint === "function") {
      var textStack = document.elementsFromPoint(clientX, clientY) || [];
      for (var textIndex = 0; textIndex < textStack.length; textIndex += 1) {
        var textNode = textStack[textIndex];
        if (!canEdit(textNode)) continue;
        var preferredText = getPreferredSelectionTarget(textNode);
        if (
          preferredText &&
          canEdit(preferredText) &&
          getNodeType(preferredText) !== "container" &&
          (!coarsePointer || getNodeType(preferredText) === "button" || getNodeType(preferredText) === "field")
        ) {
          return normalizeSelectionTarget(preferredText);
        }
        earlyText = findBestInlineTextTarget(textNode, clientX, clientY);
        if (earlyText && canEdit(earlyText)) {
          return normalizeSelectionTarget(earlyText);
        }
      }
    }

    var fallbackText = findBestInlineTextTarget(fallback, clientX, clientY);
    if (fallbackText && canEdit(fallbackText)) {
      return normalizeSelectionTarget(fallbackText);
    }
    var bestInlineText = fallbackText || earlyText || null;

    var normalized = [];
    if (typeof document.elementsFromPoint === "function") {
      var stack = document.elementsFromPoint(clientX, clientY) || [];
      for (var index = 0; index < stack.length; index += 1) {
        var node = stack[index];
        if (!canEdit(node)) continue;
        var resolved = normalizeSelectionTarget(node);
        if (!resolved || !canEdit(resolved)) continue;
        if (normalized.indexOf(resolved) === -1) {
          normalized.push(resolved);
        }
      }
    }

    var fallbackTarget = normalizeSelectionTarget(fallback);
    if (fallbackTarget && canEdit(fallbackTarget) && normalized.indexOf(fallbackTarget) === -1) {
      normalized.push(fallbackTarget);
    }

    var best = null;
    var bestScore = -999999;

    for (var scoreIndex = 0; scoreIndex < normalized.length; scoreIndex += 1) {
      var candidate = normalized[scoreIndex];
      if (!candidate || !canEdit(candidate)) continue;
      var score = 0;
      var nodeType = getNodeType(candidate);
      var rect = candidate.getBoundingClientRect();
      var area = Math.max(1, (rect.width || 1) * (rect.height || 1));
      if (isImportRootEl(candidate)) score -= 100000;
      if (nodeType === "icon" || isIconCandidate(candidate)) score += 900;
      else if (nodeType === "image" || isImageEl(candidate)) score += 820;
      else if (nodeType === "field" || isFieldEl(candidate)) score += 780;
      else if (nodeType === "button" || isActionableEl(candidate) || looksLikeButtonContainerEl(candidate)) score += 740;
      else if (nodeType === "text" || isTextEl(candidate) || looksLikeTextContainerEl(candidate)) score += 700;
      else score += 500;
      if (coarsePointer && nodeType === "container") {
        score += hasVisualChromeEl(candidate) ? 220 : 110;
      }
      if (coarsePointer && (nodeType === "text" || looksLikeTextContainerEl(candidate))) {
        score -= 120;
      }
      score += Math.max(0, 320 - Math.log(area + 1) * 26);

      var depth = 0;
      var current = candidate;
      while (current && current !== document.body && current !== document.documentElement) {
        depth += 1;
        current = current.parentElement;
      }
      score += Math.min(depth, 24) * 3;

      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (best) {
      if (!coarsePointer && getNodeType(best) === "container" && bestInlineText && canEdit(bestInlineText)) {
        return normalizeSelectionTarget(bestInlineText);
      }
      return best;
    }

    for (var contentIndex = 0; contentIndex < normalized.length; contentIndex += 1) {
      if (!isImportRootEl(normalized[contentIndex])) return normalized[contentIndex];
    }

    return normalized[0] || fallbackTarget || fallback;
  }

  function isTextEl(el) {
    return TEXT_TAGS.indexOf((el.tagName || "").toLowerCase()) !== -1;
  }

  function isLinkEl(el) {
    return (el.tagName || "").toLowerCase() === "a";
  }

  function isButtonEl(el) {
    var tag = (el.tagName || "").toLowerCase();
    return tag === "button" || el.getAttribute("role") === "button" || el.getAttribute("type") === "button" || el.getAttribute("type") === "submit";
  }

  function isActionableEl(el) {
    return isLinkEl(el) || isButtonEl(el);
  }

  function isNativeInteractiveTarget(el) {
    if (!el || !el.tagName) return false;
    var tag = (el.tagName || "").toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      tag === "option" ||
      tag === "button" ||
      tag === "a" ||
      tag === "label" ||
      el.getAttribute("contenteditable") === "true"
    );
  }

  function isImageLikeEl(el) {
    return isImageEl(el) || isIconCandidate(el);
  }

  function getNumericComputed(el, prop, fallback) {
    var value = window.getComputedStyle(el)[prop];
    var parsed = parseFloat(value || "");
    return isNaN(parsed) ? fallback : parsed;
  }

  function applyStyleQuery(el, selector, prop, value) {
    if (!el || !selector) return;
    if (el.matches && el.matches(selector) && el.style) {
      el.style[prop] = value;
    }
    el.querySelectorAll(selector).forEach(function (node) {
      if (node && node.style) {
        node.style[prop] = value;
      }
    });
  }

  function getPrimaryIconStrokeSource(el) {
    var host = getIconHost(el) || el;
    if (!host) return null;
    if (host.querySelector) {
      var shape = host.querySelector("path,rect,circle,line,polyline,polygon,ellipse");
      if (shape) return shape;
      var svg = host.querySelector("svg");
      if (svg) return svg;
    }
    return host;
  }

  function getIconStrokeWidthValue(el) {
    var source = getPrimaryIconStrokeSource(el);
    if (!source) return "";
    if (source.style && source.style.strokeWidth) {
      return source.style.strokeWidth;
    }
    if (source.getAttribute) {
      var attrValue = source.getAttribute("stroke-width") || source.getAttribute("strokeWidth");
      if (attrValue) return attrValue;
    }
    return window.getComputedStyle(source).strokeWidth || "";
  }

  function applyIconPatch(el, patch) {
    if (!el || !canEdit(el)) return null;
    var host = getIconHost(el) || el;
    var target = host && canEdit(host) ? host : el;
    if (target.setAttribute) {
      target.setAttribute("data-he-node-type", "icon");
    }
    if (target.style) {
      target.style.display = "inline-flex";
      target.style.alignItems = "center";
      target.style.justifyContent = "center";
      target.style.verticalAlign = "middle";
      target.style.lineHeight = "0";
      target.style.flexShrink = "0";
    }
    var svgNodes = [];

    if (target.tagName && target.tagName.toLowerCase() === "svg") {
      svgNodes.push(target);
    }
    if (target.querySelectorAll) {
      target.querySelectorAll("svg").forEach(function (node) {
        if (node && svgNodes.indexOf(node) === -1) {
          svgNodes.push(node);
        }
      });
    }

    svgNodes.forEach(function (svg) {
      if (!svg || !svg.style) return;
      svg.style.display = "block";
      svg.style.stroke = "currentColor";
      svg.style.fill = "none";
      svg.style.vectorEffect = "non-scaling-stroke";
      svg.style.strokeLinecap = "round";
      svg.style.strokeLinejoin = "round";
      if (svg.setAttribute) {
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("fill", "none");
        svg.setAttribute("vector-effect", "non-scaling-stroke");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
      }
    });
    if (target.querySelectorAll) {
      target.querySelectorAll("path,rect,circle,line,polyline,polygon,ellipse,g,use").forEach(function (node) {
        if (!node || !node.style) return;
        node.style.stroke = "currentColor";
        node.style.fill = "none";
        node.style.vectorEffect = "non-scaling-stroke";
        node.style.strokeLinecap = "round";
        node.style.strokeLinejoin = "round";
        if (node.setAttribute) {
          node.setAttribute("stroke", "currentColor");
          node.setAttribute("fill", "none");
          node.setAttribute("vector-effect", "non-scaling-stroke");
          node.setAttribute("stroke-linecap", "round");
          node.setAttribute("stroke-linejoin", "round");
        }
      });
    }

    if (patch.color) {
      if (target.style) {
        target.style.color = patch.color;
      }
      if (target.setAttribute) {
        target.setAttribute("data-he-icon-color", patch.color);
      }
      svgNodes.forEach(function (svg) {
        if (!svg || !svg.style) return;
        svg.style.display = "block";
        svg.style.color = patch.color;
        svg.style.stroke = "currentColor";
        svg.style.fill = "none";
        if (svg.setAttribute) {
          svg.setAttribute("stroke", "currentColor");
          svg.setAttribute("fill", "none");
          svg.setAttribute("color", patch.color);
        }
      });
      if (target.querySelectorAll) {
        target.querySelectorAll("path,rect,circle,line,polyline,polygon,ellipse,g,use").forEach(function (node) {
          if (!node || !node.style) return;
          node.style.stroke = "currentColor";
          node.style.color = patch.color;
          node.style.fill = "none";
          if (node.setAttribute) {
            node.setAttribute("stroke", "currentColor");
            node.setAttribute("fill", "none");
          }
        });
      }
    }

    if (patch.strokeWidth) {
      var rawStrokeWidth = parseFloat(String(patch.strokeWidth || ""));
      var nextStrokeWidth = Math.round(clampValue(isNaN(rawStrokeWidth) ? 1.9 : rawStrokeWidth, 0.75, 4) * 100) / 100;
      var strokeWidthValue = String(nextStrokeWidth);
      if (target.style) {
        target.style.strokeWidth = strokeWidthValue;
      }
      if (target.setAttribute) {
        target.setAttribute("data-he-icon-stroke-width", strokeWidthValue);
      }
      svgNodes.forEach(function (svg) {
        if (!svg || !svg.style) return;
        svg.style.strokeWidth = strokeWidthValue;
        if (svg.setAttribute) {
          svg.setAttribute("stroke-width", strokeWidthValue);
        }
      });
      if (target.querySelectorAll) {
        target.querySelectorAll("path,rect,circle,line,polyline,polygon,ellipse,g,use").forEach(function (node) {
          if (!node || !node.style) return;
          node.style.strokeWidth = strokeWidthValue;
          if (node.setAttribute) {
            node.setAttribute("stroke-width", strokeWidthValue);
          }
        });
      }
    }

    if (patch.size) {
      var rawSize = parseFloat(String(patch.size || ""));
      var nextSize = clampValue(isNaN(rawSize) ? 20 : rawSize, 12, 220);
      var nextSizePx = nextSize + "px";
      if (target.style) {
        target.style.fontSize = nextSizePx;
        target.style.width = nextSizePx;
        target.style.height = nextSizePx;
        target.style.maxWidth = nextSizePx;
        target.style.maxHeight = nextSizePx;
        target.style.minWidth = nextSizePx;
        target.style.minHeight = nextSizePx;
      }
      if (target.setAttribute) {
        target.setAttribute("data-he-icon-size", String(nextSize));
      }
      svgNodes.forEach(function (svg) {
        if (!svg || !svg.style) return;
        svg.style.width = nextSizePx;
        svg.style.height = nextSizePx;
        svg.style.maxWidth = nextSizePx;
        svg.style.maxHeight = nextSizePx;
        svg.style.minWidth = nextSizePx;
        svg.style.minHeight = nextSizePx;
        svg.style.fontSize = nextSizePx;
        if (svg.setAttribute) {
          svg.setAttribute("width", String(nextSize));
          svg.setAttribute("height", String(nextSize));
        }
      });
    }

    normalizeStandaloneIconElement(target);
    return target;
  }

  function markDraggable(el) {
    if (!el || !canEdit(el)) return;
    el.setAttribute("draggable", "true");
    el.dataset.draggable = "1";
    el.style.cursor = "grab";
  }

  function ensureEids(root) {
    var scope = root || document.body;
    scope.querySelectorAll("*").forEach(function (node) {
      if (!node || !node.tagName) return;
      var tag = (node.tagName || "").toLowerCase();
      if (EID_SKIP.indexOf(tag) !== -1) return;
      if (isInsideIconRoot(node) && isIconStructuralTag(tag)) {
        node.removeAttribute("data-eid");
        node.removeAttribute("data-he-node-type");
        return;
      }
      if (!node.dataset.eid) {
        node.dataset.eid = "he-" + eidCounter;
        eidCounter += 1;
      }
    });
    markEditableNodeTypes(scope);
  }

  function getInfo(el) {
    ensureEids(document.body);
    var resolvedEl = getIconHost(el) || el;
    var cs = window.getComputedStyle(resolvedEl);
    var nodeType = getNodeType(resolvedEl) || inferEditorNodeType(resolvedEl);
    var iconHost = getIconHost(resolvedEl);
    var resolvedDataIcon = resolvedEl.getAttribute("data-he-icon") || (iconHost && iconHost.getAttribute ? iconHost.getAttribute("data-he-icon") : null);
    var resolvedIsButton = nodeType === "button" || isButtonEl(resolvedEl) || looksLikeButtonContainerEl(resolvedEl);
    var resolvedIsActionable = nodeType === "button" || isActionableEl(resolvedEl) || looksLikeButtonContainerEl(resolvedEl);
    var resolvedIsText = nodeType === "text" || isTextEl(resolvedEl) || looksLikeTextContainerEl(resolvedEl);
    var parent = resolvedEl.parentElement && canEdit(resolvedEl.parentElement) ? resolvedEl.parentElement : null;
    var children = [];
    if (resolvedEl.children && resolvedEl.children.length) {
      for (var childIndex = 0; childIndex < resolvedEl.children.length; childIndex += 1) {
        var child = resolvedEl.children[childIndex];
        if (!canEdit(child)) continue;
        children.push({
          eid: child.dataset.eid || null,
          tag: child.tagName.toLowerCase(),
          label: ((child.innerText || child.textContent || child.tagName.toLowerCase()) + "").replace(/\s+/g, " ").trim().slice(0, 40),
        });
      }
    }
    return {
      eid: resolvedEl.dataset.eid || null,
      nodeType: nodeType,
      tag: resolvedEl.tagName.toLowerCase(),
      id: resolvedEl.id || null,
      classes: resolvedEl.className || null,
      parentEid: parent?.dataset?.eid || null,
      parentTag: parent?.tagName?.toLowerCase() || null,
      children: children,
      text: (resolvedEl.innerText || "").slice(0, 200),
      html: (resolvedEl.innerHTML || "").slice(0, 1200),
      isText: resolvedIsText,
      isLink: isLinkEl(resolvedEl),
      isButton: resolvedIsButton,
      isActionable: resolvedIsActionable,
      attrs: {
        id: resolvedEl.getAttribute("id"),
        href: resolvedEl.getAttribute("href"),
        target: resolvedEl.getAttribute("target"),
        placeholder: resolvedEl.getAttribute("placeholder"),
        src: resolvedEl.getAttribute("src"),
        type: resolvedEl.getAttribute("type"),
        name: resolvedEl.getAttribute("name"),
        autocomplete: resolvedEl.getAttribute("autocomplete"),
        min: resolvedEl.getAttribute("min"),
        max: resolvedEl.getAttribute("max"),
        step: resolvedEl.getAttribute("step"),
        rows: resolvedEl.getAttribute("rows"),
        multiple: !!resolvedEl.hasAttribute("multiple"),
        value: isFieldEl(resolvedEl) ? ((resolvedEl.value != null ? String(resolvedEl.value) : resolvedEl.getAttribute("value")) || "") : resolvedEl.getAttribute("value"),
        alt: resolvedEl.getAttribute("alt"),
        title: resolvedEl.getAttribute("title"),
        required: !!resolvedEl.hasAttribute("required"),
        disabled: !!resolvedEl.hasAttribute("disabled"),
        checked: !!resolvedEl.hasAttribute("checked"),
        dataIcon: resolvedDataIcon,
      },
      styles: {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
        fontStyle: cs.fontStyle,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textDecoration: cs.textDecoration,
        textTransform: cs.textTransform,
        padding: cs.padding,
        margin: cs.margin,
        borderRadius: cs.borderRadius,
        textAlign: cs.textAlign,
        display: cs.display,
      width: cs.width,
      maxWidth: cs.maxWidth,
      height: cs.height,
      maxHeight: cs.maxHeight,
        objectFit: cs.objectFit,
        borderWidth: cs.borderWidth,
        borderColor: cs.borderColor,
        boxShadow: cs.boxShadow,
        strokeWidth: getIconStrokeWidthValue(resolvedEl) || cs.strokeWidth,
        accentColor: cs.accentColor,
        gap: cs.gap,
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
      }
    };
  }

  function reportHeight() {
    var h = document.documentElement.scrollHeight || document.body.scrollHeight;
    if (h > 0) emitToParent({ __hei_resize: h });
  }

  function serializeDocument() {
    ensureEids(document.body);
    var clone = document.documentElement.cloneNode(true);
    if (clone && clone.removeAttribute) {
      clone.removeAttribute("data-he-editor-runtime");
      clone.removeAttribute("data-he-editor-runtime-version");
    }
    clone.querySelectorAll("[data-he-editor-overlay],[data-he-runtime]").forEach(function (node) {
      node.remove();
    });
    clone.querySelectorAll("[contenteditable='true']").forEach(function (node) {
      node.removeAttribute("contenteditable");
    });
    clone.querySelectorAll("[data-draggable]").forEach(function (node) {
      node.removeAttribute("data-draggable");
      node.removeAttribute("draggable");
      if (node.style && node.style.opacity) node.style.opacity = "";
    });
    return "<!DOCTYPE html>\\n" + clone.outerHTML;
  }

  function queueSnapshot() {
    if (snapshotTimer) window.clearTimeout(snapshotTimer);
    snapshotTimer = window.setTimeout(function () {
      emitToParent({ __editor_snapshot: true, html: serializeDocument() });
      reportHeight();
    }, 180);
  }

  function refreshSelectionUi() {
    if (multiSelectMode) {
      setMultiSelection(multiSelectedEls);
    }
    if (hasGroupedSelection()) {
      var groupedBounds = placeGroupBox(multiSelectedEls);
      selBox.style.display = "none";
      moveHitBox.style.display = "none";
      placeResizeHandle(null);
      placeToolbarForRect(groupedBounds);
      syncMoveUi();
      primeSelectionUiLayout();
      return;
    }
    groupBox.style.display = "none";
    if (!selectedEl || !selectedEl.isConnected || !canEdit(selectedEl)) {
      selectedEl = null;
      clearMultiSelection();
      setFreeMove(null, false);
      hideSelectionUi();
      return;
    }
    placeSelectionBox(selectedEl);
    placeMoveHitBox(selectedEl);
    placeToolbar(selectedEl);
    placeResizeHandle(selectedEl);
    syncMoveUi();
    primeSelectionUiLayout();
  }

  function selectElement(el) {
    if (!canEdit(el)) return;
    ensureEids(document.body);
    if (freeMoveEl && freeMoveEl !== el && !freeMoveIsGroup) {
      setFreeMove(null, false);
    }
    selectedEl = el;
    if (multiSelectMode) {
      setMultiSelection([el]);
    } else {
      clearMultiSelection();
    }
    if (dragEnabled) {
      markDraggable(el);
    }
    hoverBox.style.display = "none";
    refreshSelectionUi();
    emitToParent({ __editor_select: true, info: getInfo(el) });
  }

  function beginInlineEdit(el, clientX, clientY) {
    var nodeType = getNodeType(el);
    if (!canEdit(el) || (nodeType !== "text" && nodeType !== "button" && !isTextEl(el) && !looksLikeTextContainerEl(el) && !looksLikeButtonContainerEl(el))) return false;
    if (freeMoveEl) {
      setFreeMove(null, false);
      freeMoveState = null;
    }
    if (multiSelectMode) {
      multiSelectMode = false;
      clearMultiSelection();
    }
    editingEl = el;
    el.contentEditable = "true";
    el.focus();

    if (document.caretRangeFromPoint && typeof clientX === "number" && typeof clientY === "number") {
      var range = document.caretRangeFromPoint(clientX, clientY);
      if (range) {
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    hideSelectionUi();
    hoverBox.style.display = "none";
    place(editBox, el);
    emitToParent({ __editor_editing: true, eid: el.dataset.eid || null });
    return true;
  }

  function moveSelected(direction) {
    if (hasGroupedSelection()) return;
    if (!selectedEl || !selectedEl.parentNode || isImportRootEl(selectedEl)) return;
    var parent = selectedEl.parentNode;
    var sibling = direction < 0 ? selectedEl.previousElementSibling : selectedEl.nextElementSibling;
    if (!sibling) return;

    if (direction < 0) {
      parent.insertBefore(selectedEl, sibling);
    } else {
      parent.insertBefore(selectedEl, sibling.nextSibling);
    }

    queueSnapshot();
    emitToParent({
      __editor_moved: true,
      eid: selectedEl.dataset.eid || null,
      targetEid: sibling.dataset ? sibling.dataset.eid || null : null,
      position: direction < 0 ? "before" : "after",
    });
    selectElement(selectedEl);
  }

  function toggleFreeMove() {
    if (hasGroupedSelection()) {
      var groupedSelection = getUniqueEditableElements(multiSelectedEls);
      var allSimple = groupedSelection.length > 1 && groupedSelection.every(function (node) {
        return canUseFreeMove(node);
      });
      if (!allSimple) return;
      if (freeMoveEl && freeMoveIsGroup) {
        setFreeMove(null, false);
        freeMoveState = null;
        return;
      }
      setFreeMove(groupedSelection[0] || selectedEl, true);
      refreshSelectionUi();
      return;
    }
    if (!selectedEl || isImportRootEl(selectedEl) || !canUseFreeMove(selectedEl)) return;
    if (freeMoveEl === selectedEl && !freeMoveIsGroup) {
      setFreeMove(null, false);
      freeMoveState = null;
      return;
    }
    setFreeMove(selectedEl, false);
    selectElement(selectedEl);
  }

  function deleteSelected() {
    if (hasGroupedSelection()) {
      var selection = getUniqueEditableElements(multiSelectedEls);
      if (!selection.length) return;
      if (freeMoveEl && freeMoveIsGroup) {
        setFreeMove(null, false);
        freeMoveState = null;
      }
      selection.forEach(function (node) {
        if (node && node.parentNode && !isImportRootEl(node)) {
          node.remove();
        }
      });
      clearMultiSelection();
      selectedEl = null;
      queueSnapshot();
      hideSelectionUi();
      emitToParent({ __editor_select: true, info: null });
      return;
    }
    if (!selectedEl || !selectedEl.parentNode || isImportRootEl(selectedEl)) return;
    var parentRoot = getFreeMoveRoot(selectedEl);
    var fallback = selectedEl.nextElementSibling || selectedEl.previousElementSibling || selectedEl.parentElement;
    if (freeMoveEl === selectedEl) {
      setFreeMove(null, false);
      freeMoveState = null;
    }
    selectedEl.remove();
    recalculateRootMoveCapacity(parentRoot);
    queueSnapshot();
    if (fallback && canEdit(fallback)) {
      selectElement(fallback);
      return;
    }
    selectedEl = null;
    setFreeMove(null, false);
    hideSelectionUi();
    emitToParent({ __editor_select: true, info: null });
  }

  ensureEids(document.body);
  var normalizedOnBoot = normalizePersistedEditorLayout();
  reportHeight();
  if (window.ResizeObserver) {
    new ResizeObserver(reportHeight).observe(document.body);
  }
  if (normalizedOnBoot) {
    window.setTimeout(function () {
      queueSnapshot();
      reportHeight();
    }, 80);
  }
  window.addEventListener("scroll", refreshSelectionUi, true);
  window.addEventListener("resize", refreshSelectionUi, true);

  selToolbar.addEventListener("mousedown", function (event) {
    event.preventDefault();
    event.stopPropagation();
  }, true);
  selToolbar.addEventListener("touchstart", function (event) {
    stopGestureEvent(event);
  }, { passive: false, capture: true });
  selToolbar.addEventListener("pointerdown", function (event) {
    if (!isNonMousePointerEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);

  groupBox.addEventListener("mousedown", function (event) {
    event.preventDefault();
    event.stopPropagation();
    startGroupMove(event.clientX, event.clientY, null);
  }, true);
  groupBox.addEventListener("touchstart", function (event) {
    var point = getEventClientPoint(event);
    if (!point) return;
    stopGestureEvent(event);
    startGroupMove(point.x, point.y, point.id);
  }, { passive: false, capture: true });
  groupBox.addEventListener("pointerdown", function (event) {
    if (!isNonMousePointerEvent(event)) return;
    var point = getEventClientPoint(event);
    if (!point) return;
    event.preventDefault();
    event.stopPropagation();
    startGroupMove(point.x, point.y, point.id);
  }, true);

  selBox.addEventListener("mousedown", function (event) {
    if (!selectedEl || !canUseFreeMove(selectedEl) || (freeMoveEl !== selectedEl && coarsePointer)) return;
    event.preventDefault();
    event.stopPropagation();
    beginSingleFreeMove(selectedEl, event.clientX, event.clientY, null);
  }, true);
  selBox.addEventListener("touchstart", function (event) {
    if (!selectedEl || !canUseFreeMove(selectedEl)) return;
    var point = getEventClientPoint(event);
    if (!point) return;
    stopGestureEvent(event);
    beginSingleFreeMove(selectedEl, point.x, point.y, point.id);
  }, { passive: false, capture: true });
  selBox.addEventListener("pointerdown", function (event) {
    if (!isNonMousePointerEvent(event)) return;
    if (!selectedEl || !canUseFreeMove(selectedEl)) return;
    var point = getEventClientPoint(event);
    if (!point) return;
    event.preventDefault();
    event.stopPropagation();
    beginSingleFreeMove(selectedEl, point.x, point.y, point.id);
  }, true);

  moveHitBox.addEventListener("mousedown", function (event) {
    if (!selectedEl || !canUseFreeMove(selectedEl) || (freeMoveEl !== selectedEl && coarsePointer)) return;
    event.preventDefault();
    event.stopPropagation();
    beginSingleFreeMove(selectedEl, event.clientX, event.clientY, null);
  }, true);
  moveHitBox.addEventListener("touchstart", function (event) {
    if (!selectedEl || !canUseFreeMove(selectedEl)) return;
    var point = getEventClientPoint(event);
    if (!point) return;
    stopGestureEvent(event);
    beginSingleFreeMove(selectedEl, point.x, point.y, point.id);
  }, { passive: false, capture: true });
  moveHitBox.addEventListener("pointerdown", function (event) {
    if (!isNonMousePointerEvent(event)) return;
    if (!selectedEl || !canUseFreeMove(selectedEl)) return;
    var point = getEventClientPoint(event);
    if (!point) return;
    event.preventDefault();
    event.stopPropagation();
    beginSingleFreeMove(selectedEl, point.x, point.y, point.id);
  }, true);

  resizeHandle.addEventListener("mousedown", function (event) {
    event.preventDefault();
    event.stopPropagation();
    startSelectedResize(event.clientX, event.clientY, null);
  }, true);
  resizeHandle.addEventListener("touchstart", function (event) {
    var point = getEventClientPoint(event);
    if (!point) return;
    stopGestureEvent(event);
    startSelectedResize(point.x, point.y, point.id);
  }, { passive: false, capture: true });
  resizeHandle.addEventListener("pointerdown", function (event) {
    if (!isNonMousePointerEvent(event)) return;
    var point = getEventClientPoint(event);
    if (!point) return;
    event.preventDefault();
    event.stopPropagation();
    startSelectedResize(point.x, point.y, point.id);
  }, true);

  function handleToolbarAction(event) {
    var sourceType = typeof event.type === "string" ? event.type : "";
    var now = Date.now();
    if (sourceType === "click" && now - lastToolbarTouchTs < 450) {
      stopGestureEvent(event);
      return;
    }
    if (sourceType === "touchend" || sourceType === "pointerup") {
      lastToolbarTouchTs = now;
    }
    var button = event.target && event.target.closest ? event.target.closest("button[data-tool]") : null;
    if (!button) return;
    stopGestureEvent(event);
    var tool = button.getAttribute("data-tool");

    if (tool === "group") {
      multiSelectMode = !multiSelectMode;
      if (multiSelectMode) {
        setMultiSelection(selectedEl ? [selectedEl] : []);
      } else {
        clearMultiSelection();
        if (freeMoveIsGroup) {
          setFreeMove(null, false);
          freeMoveState = null;
        }
      }
      refreshSelectionUi();
      return;
    }

    if (tool === "edit" && selectedEl) {
      var started = beginInlineEdit(selectedEl);
      if (!started) {
        // Non-text element: signal parent to open the inspector panel
        emitToParent({ __editor_open_inspector: true });
      }
      return;
    }

    if (tool === "drag" && selectedEl) {
      toggleFreeMove();
      return;
    }

    if (tool === "up") {
      moveSelected(-1);
      return;
    }

    if (tool === "down") {
      moveSelected(1);
      return;
    }

    if (tool === "delete") {
      deleteSelected();
    }
  }

  selToolbar.addEventListener("click", handleToolbarAction, true);
  selToolbar.addEventListener("touchend", handleToolbarAction, { passive: false, capture: true });
  selToolbar.addEventListener("pointerup", function (event) {
    if (!isNonMousePointerEvent(event)) return;
    handleToolbarAction(event);
  }, true);

  document.addEventListener("mousedown", function (event) {
    if (event.button !== 0) return;
    if (editingEl || resizeState || freeMoveState) return;
    if (isRuntimeUiTarget(event.target)) return;
    var el = getSelectionTargetFromPoint(event.clientX, event.clientY, event.target);
    if (!canEdit(el)) return;
    if (!multiSelectMode && selectedEl && canUseFreeMove(selectedEl) && ((freeMoveEl && !freeMoveIsGroup) || coarsePointer)) {
      var dragTarget = event.target instanceof Element ? event.target : null;
      var dragOwner = dragTarget ? getEditableOwner(dragTarget) : null;
      var selectedRect = selectedEl.getBoundingClientRect ? selectedEl.getBoundingClientRect() : null;
      var pointerInsideSelected = isPointInsideRect(event.clientX, event.clientY, selectedRect);
      var isSelectedTarget =
        el === selectedEl ||
        dragOwner === selectedEl ||
        !!(dragTarget && (dragTarget === selectedEl || selectedEl.contains(dragTarget))) ||
        pointerInsideSelected;
      if (isSelectedTarget) {
        event.preventDefault();
        event.stopPropagation();
        suppressSelectionClick = true;
        beginSingleFreeMove(selectedEl, event.clientX, event.clientY, null);
        return;
      }
    }
    var shouldCapture =
      isNativeInteractiveTarget(event.target) ||
      isNativeInteractiveTarget(el) ||
      isFieldEl(el) ||
      isActionableEl(el) ||
      looksLikeButtonContainerEl(el) ||
      isTextEl(el) ||
      looksLikeTextContainerEl(el) ||
      isIconCandidate(el) ||
      isImageEl(el);
    if (shouldCapture) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (multiSelectMode) {
      toggleMultiSelection(el);
      suppressSelectionClick = true;
      refreshSelectionUi();
      emitToParent({ __editor_select: true, info: selectedEl ? getInfo(selectedEl) : null });
      return;
    }
    suppressSelectionClick = true;
    selectElement(el);
  }, true);

  document.addEventListener("touchstart", function (event) {
    var point = getEventClientPoint(event);
    if (!point) return;
    if (editingEl || resizeState || freeMoveState) return;
    if (isRuntimeUiTarget(event.target)) return;
    var el = getSelectionTargetFromPoint(point.x, point.y, event.target);
    if (!canEdit(el)) return;
    if (!multiSelectMode && selectedEl && canUseFreeMove(selectedEl) && ((freeMoveEl && !freeMoveIsGroup) || coarsePointer)) {
      var dragTarget = event.target instanceof Element ? event.target : null;
      var dragOwner = dragTarget ? getEditableOwner(dragTarget) : null;
      var selectedRect = selectedEl.getBoundingClientRect ? selectedEl.getBoundingClientRect() : null;
      var pointerInsideSelected = isPointInsideRect(point.x, point.y, selectedRect);
      var isSelectedTarget =
        el === selectedEl ||
        dragOwner === selectedEl ||
        !!(dragTarget && (dragTarget === selectedEl || selectedEl.contains(dragTarget))) ||
        pointerInsideSelected;
      if (isSelectedTarget) {
        stopGestureEvent(event);
        suppressSelectionClick = true;
        beginSingleFreeMove(selectedEl, point.x, point.y, point.id);
        return;
      }
    }
    var shouldCapture =
      isNativeInteractiveTarget(event.target) ||
      isNativeInteractiveTarget(el) ||
      isFieldEl(el) ||
      isActionableEl(el) ||
      looksLikeButtonContainerEl(el) ||
      isTextEl(el) ||
      looksLikeTextContainerEl(el) ||
      isIconCandidate(el) ||
      isImageEl(el);
    if (shouldCapture) {
      stopGestureEvent(event);
    }
    if (multiSelectMode) {
      toggleMultiSelection(el);
      suppressSelectionClick = true;
      refreshSelectionUi();
      emitToParent({ __editor_select: true, info: selectedEl ? getInfo(selectedEl) : null });
      return;
    }
    suppressSelectionClick = true;
    selectElement(el);
  }, { passive: false, capture: true });

  document.addEventListener("focusin", function (event) {
    if (editingEl) return;
    if (isRuntimeUiTarget(event.target)) return;
    var target = event.target;
    if (!target || !isNativeInteractiveTarget(target)) return;
    window.setTimeout(function () {
      try {
        if (document.activeElement === target && target.blur) {
          target.blur();
        }
      } catch (_err) {}
    }, 0);
  }, true);

  function handleCanvasPointerMove(clientX, clientY, target, buttonsMask, allowAutoStart, touchIdentifier) {
    setInteractionPoint(clientX, clientY, touchIdentifier);
    if (
      allowAutoStart &&
      !freeMoveState &&
      !resizeState &&
      !editingEl &&
      !multiSelectMode &&
      selectedEl &&
      canUseFreeMove(selectedEl) &&
      ((freeMoveEl && !freeMoveIsGroup && freeMoveEl === selectedEl) || coarsePointer) &&
      buttonsMask === 1
    ) {
      var moveTarget = target instanceof Element ? target : null;
      var moveOwner = moveTarget ? getEditableOwner(moveTarget) : null;
      var moveRect = selectedEl.getBoundingClientRect ? selectedEl.getBoundingClientRect() : null;
      var pointerInsideMoveSelection = isPointInsideRect(clientX, clientY, moveRect);
      var moveSelectionMatch =
        moveOwner === selectedEl ||
        !!(moveTarget && (moveTarget === selectedEl || selectedEl.contains(moveTarget))) ||
        pointerInsideMoveSelection;
      if (moveSelectionMatch) {
        beginSingleFreeMove(selectedEl, clientX, clientY, touchIdentifier);
      }
    }
    if (
      !freeMoveState &&
      freeMoveEl &&
      !freeMoveIsGroup &&
      selectedEl &&
      freeMoveEl === selectedEl &&
      getNodeType(selectedEl) === "icon"
    ) {
      var hoverTarget = target instanceof Element ? target : null;
      var hoverInsideSelected =
        !!(hoverTarget && (hoverTarget === selectedEl || selectedEl.contains(hoverTarget))) ||
        isPointInsideRect(clientX, clientY, selectedEl.getBoundingClientRect());
      if (hoverInsideSelected) {
        primeFreeMoveLayout(selectedEl);
      }
    }
    if (isRuntimeUiTarget(target)) {
      hoverBox.style.display = "none";
      return false;
    }
    if (resizeState && resizeState.el && resizeState.el.isConnected) {
      var deltaX = clientX - resizeState.startX;
      var deltaY = clientY - resizeState.startY;
      var nextWidth = Math.max(18, resizeState.startWidth + deltaX);
      var nextHeight = Math.max(18, resizeState.startHeight + deltaY);
      var resizeBounds = getFreeMoveBounds(resizeState.el);
      var currentLeft = resizeState.anchorLeft + resizeState.startLeft;
      var currentTop = resizeState.anchorTop + resizeState.startTop;

      if (resizeState.keepRatio) {
        var ratio = resizeState.ratio || 1;
        var primary = Math.max(nextWidth, nextHeight * ratio);
        nextWidth = Math.max(18, primary);
        nextHeight = Math.max(18, nextWidth / ratio);
      }

      nextWidth = clampValue(nextWidth, 18, Math.max(18, resizeBounds.width - currentLeft));
      nextHeight = clampValue(nextHeight, 18, Math.max(18, resizeBounds.height - currentTop));

      resizeState.el.style.width = nextWidth + "px";
      resizeState.el.style.height = nextHeight + "px";

      if (getNodeType(resizeState.el) === "text") {
        var textGrowth = Math.max(nextWidth - resizeState.startWidth, nextHeight - resizeState.startHeight);
        var nextFontSize = Math.max(12, Math.round(resizeState.startFontSize + textGrowth * 0.18));
        resizeState.el.style.fontSize = nextFontSize + "px";
        resizeState.el.style.lineHeight = "1.1";
        resizeState.el.style.height = "";
      }

      if (isIconCandidate(resizeState.el)) {
        var nextIconSize = Math.max(12, Math.round(clampValue(Math.max(nextWidth, nextHeight), 12, Math.min(resizeBounds.width, resizeBounds.height, 220))));
        resizeState.el.style.fontSize = nextIconSize + "px";
        resizeState.el.querySelectorAll("svg,[data-he-icon-root='1']").forEach(function (node) {
          if (node && node.style) {
            node.style.width = nextIconSize + "px";
            node.style.height = nextIconSize + "px";
            node.style.fontSize = nextIconSize + "px";
          }
        });
        resizeState.el.querySelectorAll("svg").forEach(function (node) {
          if (node && node.style) {
            node.style.width = nextIconSize + "px";
            node.style.height = nextIconSize + "px";
          }
        });
      }

      selectedEl = resizeState.el;
      hoverBox.style.display = "none";
      placeSelectionBox(resizeState.el);
      placeMoveHitBox(resizeState.el);
      placeToolbar(resizeState.el);
      placeResizeHandle(resizeState.el);
      updateMoveFeedback(getFreeMoveRoot(resizeState.el), currentLeft, currentTop, nextWidth, nextHeight, null, null);
      syncMoveUi();
      return true;
    }

    if (freeMoveState && freeMoveState.isGroup && freeMoveState.items && freeMoveState.items.length) {
      var deltaX = clientX - freeMoveState.startX;
      var deltaY = clientY - freeMoveState.startY;
      var minDeltaX = -Infinity;
      var maxDeltaX = Infinity;
      var minDeltaY = -Infinity;
      var maxDeltaY = Infinity;

      freeMoveState.items.forEach(function (item) {
        var minDx = -item.anchorLeft - item.startLeft;
        var maxDx = item.bounds.width - (item.anchorLeft + item.width) - item.startLeft;
        var minDy = -item.anchorTop - item.startTop;
        var maxDy = item.bounds.height - (item.anchorTop + item.height) - item.startTop;
        minDeltaX = Math.max(minDeltaX, minDx);
        maxDeltaX = Math.min(maxDeltaX, maxDx);
        minDeltaY = Math.max(minDeltaY, minDy);
        maxDeltaY = Math.min(maxDeltaY, maxDy);
      });

      var clampedDx = clampValue(deltaX, minDeltaX, maxDeltaX);
      var clampedDy = clampValue(deltaY, minDeltaY, maxDeltaY);

      freeMoveState.items.forEach(function (item) {
        applyFreeMoveTransform(item.el, item.startLeft + clampedDx, item.startTop + clampedDy);
      });

      var groupedBounds = placeGroupBox(multiSelectedEls);
      selBox.style.display = "none";
      placeResizeHandle(null);
      placeToolbarForRect(groupedBounds);
      if (groupedBounds) {
        var groupRoot = getEditorRoot(freeMoveState.items[0].el);
        var groupRootRect = groupRoot.getBoundingClientRect();
        var groupLeft = groupedBounds.left - groupRootRect.left + (groupRoot.scrollLeft || 0);
        var groupTop = groupedBounds.top - groupRootRect.top + (groupRoot.scrollTop || 0);
        updateMoveFeedback(groupRoot, groupLeft, groupTop, groupedBounds.width, groupedBounds.height, null, null);
      }
      syncMoveUi();
      return true;
    }

    if (freeMoveState && freeMoveState.el && freeMoveState.el.isConnected) {
      var moveBounds = getFreeMoveBounds(freeMoveState.el);
      var moveRoot = freeMoveState.root || moveBounds.parent;
      var rootRect = moveRoot.getBoundingClientRect();
      var rootScrollLeft = moveRoot.scrollLeft || 0;
      var rootScrollTop = moveRoot.scrollTop || 0;
      var moveWidth = Math.max(18, freeMoveState.el.getBoundingClientRect().width || getLengthValue(freeMoveState.el, "width"));
      var moveHeight = Math.max(18, freeMoveState.el.getBoundingClientRect().height || getLengthValue(freeMoveState.el, "height"));
      var pointerLeftInRoot = clientX - rootRect.left + rootScrollLeft - freeMoveState.pointerOffsetX;
      var pointerTopInRoot = clientY - rootRect.top + rootScrollTop - freeMoveState.pointerOffsetY;
      var nextLeft = pointerLeftInRoot - freeMoveState.anchorLeft;
      var nextTop = pointerTopInRoot - freeMoveState.anchorTop;
      var desiredLeft = freeMoveState.anchorLeft + nextLeft;
      var desiredTop = freeMoveState.anchorTop + nextTop;
      var snapX = resolveSnapGuide(desiredLeft, moveWidth, moveBounds.width, 8);
      var snapY = resolveSnapGuide(desiredTop, moveHeight, moveBounds.height, 8);

      if (snapX) {
        nextLeft = snapX.start - freeMoveState.anchorLeft;
      }
      if (snapY) {
        nextTop = snapY.start - freeMoveState.anchorTop;
      }
      nextLeft = clampValue(
        nextLeft,
        -freeMoveState.anchorLeft,
        Math.max(-freeMoveState.anchorLeft, moveBounds.width - (freeMoveState.anchorLeft + moveWidth))
      );
      nextTop = clampValue(
        nextTop,
        -freeMoveState.anchorTop,
        Math.max(-freeMoveState.anchorTop, moveBounds.height - (freeMoveState.anchorTop + moveHeight))
      );
      var actualLeft = freeMoveState.anchorLeft + nextLeft;
      var actualTop = freeMoveState.anchorTop + nextTop;
      var guideX = snapX && Math.abs(actualLeft - snapX.start) <= 0.5 ? snapX.guide : null;
      var guideY = snapY && Math.abs(actualTop - snapY.start) <= 0.5 ? snapY.guide : null;
      applyFreeMoveTransform(freeMoveState.el, nextLeft, nextTop);
      selectedEl = freeMoveState.el;
      hoverBox.style.display = "none";
      placeSelectionBox(freeMoveState.el);
      placeMoveHitBox(freeMoveState.el);
      placeToolbar(freeMoveState.el);
      placeResizeHandle(freeMoveState.el);
      updateMoveFeedback(moveRoot, actualLeft, actualTop, moveWidth, moveHeight, guideX, guideY);
      syncMoveUi();
      return true;
    }
    if (editingEl) return;
    var el = getSelectionTargetFromPoint(clientX, clientY, target);
    if (!canEdit(el) || el === selectedEl) {
      hoverBox.style.display = "none";
      return false;
    }
    place(hoverBox, el);
    hoverTag.textContent = el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.dataset.eid ? " [" + el.dataset.eid + "]" : "");
    return false;
  }

  document.addEventListener("mousemove", function (event) {
    handleCanvasPointerMove(event.clientX, event.clientY, event.target, (event.buttons & 1) === 1 ? 1 : 0, true, null);
  });

  document.addEventListener("touchmove", function (event) {
    var point = getEventClientPoint(event);
    if (!point) return;
    var handled = handleCanvasPointerMove(point.x, point.y, event.target, 1, true, point.id);
    if (handled) {
      stopGestureEvent(event);
    }
  }, { passive: false, capture: true });
  document.addEventListener("pointermove", function (event) {
    if (!isNonMousePointerEvent(event)) return;
    var point = getEventClientPoint(event);
    if (!point) return;
    var handled = handleCanvasPointerMove(point.x, point.y, event.target, 1, true, point.id);
    if (handled) {
      stopGestureEvent(event);
    }
  }, true);

  document.addEventListener("mouseleave", function () {
    hoverBox.style.display = "none";
  });

  function finishCanvasPointerInteraction() {
    if (resizeState && resizeState.el) {
      var resizedEl = resizeState.el;
      resizeState = null;
      cancelAutoScrollLoop();
      clearInteractionPoint();
      endInteractionLock();
      emitToParent({ __editor_interaction_lock: true, active: false, kind: null });
      hideMoveFeedback();
      recalculateRootMoveCapacity(getFreeMoveRoot(resizedEl));
      queueSnapshot();
      selectElement(resizedEl);
      return true;
    }
    if (freeMoveState && freeMoveState.isGroup && freeMoveState.items && freeMoveState.items.length) {
      var movedItems = freeMoveState.items.slice();
      freeMoveState = null;
      cancelAutoScrollLoop();
      clearInteractionPoint();
      endInteractionLock();
      emitToParent({ __editor_interaction_lock: true, active: false, kind: null });
      hideMoveFeedback();
      movedItems.forEach(function (item) {
        recalculateRootMoveCapacity(getFreeMoveRoot(item.el));
      });
      queueSnapshot();
      refreshSelectionUi();
      return true;
    }
    if (!freeMoveState || !freeMoveState.el) return false;
    var movedEl = freeMoveState.el;
    freeMoveState = null;
    cancelAutoScrollLoop();
    clearInteractionPoint();
    endInteractionLock();
    emitToParent({ __editor_interaction_lock: true, active: false, kind: null });
    hideMoveFeedback();
    recalculateRootMoveCapacity(getFreeMoveRoot(movedEl));
    queueSnapshot();
    selectElement(movedEl);
    return true;
  }

  document.addEventListener("mouseup", function () {
    finishCanvasPointerInteraction();
  }, true);

  document.addEventListener("touchend", function (event) {
    if (resizeState || freeMoveState) {
      stopGestureEvent(event);
    }
    finishCanvasPointerInteraction();
  }, { passive: false, capture: true });
  document.addEventListener("touchcancel", function (event) {
    if (resizeState || freeMoveState) {
      stopGestureEvent(event);
    }
    finishCanvasPointerInteraction();
  }, { passive: false, capture: true });
  document.addEventListener("pointerup", function (event) {
    if (!isNonMousePointerEvent(event)) return;
    if (resizeState || freeMoveState) {
      stopGestureEvent(event);
    }
    finishCanvasPointerInteraction();
  }, true);
  document.addEventListener("pointercancel", function (event) {
    if (!isNonMousePointerEvent(event)) return;
    if (resizeState || freeMoveState) {
      stopGestureEvent(event);
    }
    finishCanvasPointerInteraction();
  }, true);

  window.addEventListener("blur", abortActiveInteraction, true);
  window.addEventListener("pagehide", abortActiveInteraction, true);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") {
      abortActiveInteraction();
    }
  }, true);

  document.addEventListener("click", function (event) {
    if (editingEl) return;
    if (isRuntimeUiTarget(event.target)) return;
    if (suppressSelectionClick) {
      suppressSelectionClick = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (multiSelectMode) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    var el = getSelectionTargetFromPoint(event.clientX, event.clientY, event.target);
    if (!canEdit(el)) return;
    event.preventDefault();
    event.stopPropagation();
    selectElement(el);
  }, true);

  document.addEventListener("dblclick", function (event) {
    if (isRuntimeUiTarget(event.target)) return;
    if (multiSelectMode) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    var el = getSelectionTargetFromPoint(event.clientX, event.clientY, event.target);
    if (!canEdit(el)) return;
    event.preventDefault();
    event.stopPropagation();
    if (isTextEl(el) || looksLikeTextContainerEl(el) || looksLikeButtonContainerEl(el)) {
      selectElement(el);
      beginInlineEdit(el, event.clientX, event.clientY);
      return;
    }
    selectElement(el);
  }, true);

  document.addEventListener("blur", function (event) {
    var el = event.target;
    if (el !== editingEl) return;
    el.contentEditable = "false";
    editBox.style.display = "none";

    emitToParent({
      __editor_text_change: true,
      eid: el.dataset.eid || null,
      text: el.innerText || "",
      html: el.innerHTML || "",
    });

    queueSnapshot();

    var saved = el;
    window.setTimeout(function () {
      editingEl = null;
      selectElement(saved);
    }, 40);
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && editingEl) {
      editingEl.contentEditable = "false";
      editingEl.blur();
      return;
    }
    if (event.key === "Escape" && freeMoveEl) {
      freeMoveState = null;
      cancelAutoScrollLoop();
      clearInteractionPoint();
      endInteractionLock();
      emitToParent({ __editor_interaction_lock: true, active: false, kind: null });
      hideMoveFeedback();
      setFreeMove(null);
    }
    if (event.key === "Escape" && resizeState) {
      resizeState = null;
      cancelAutoScrollLoop();
      clearInteractionPoint();
      endInteractionLock();
      emitToParent({ __editor_interaction_lock: true, active: false, kind: null });
      hideMoveFeedback();
    }
  }, true);

  function enableDrag() {
    dragEnabled = true;
    ensureEids(document.body);
    BLOCK_TAGS.forEach(function (tag) {
      document.querySelectorAll(tag).forEach(function (el) {
        if (!el.dataset.draggable) markDraggable(el);
      });
    });
    if (selectedEl) markDraggable(selectedEl);
  }

  document.addEventListener("dragstart", function (event) {
    if (!dragEnabled) return;
    dragEl = event.target;
    if (dragEl && dragEl.style) dragEl.style.opacity = "0.4";
    event.dataTransfer.effectAllowed = "move";
  });

  document.addEventListener("dragend", function () {
    if (dragEl && dragEl.style) {
      dragEl.style.opacity = "";
      dragEl.style.cursor = "grab";
    }
    dragEl = null;
    dropLine.style.display = "none";
  });

  document.addEventListener("dragover", function (event) {
    if (!dragEl) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    var target = event.target;
    if (!target || target === dragEl || !canEdit(target)) return;
    var rect = target.getBoundingClientRect();
    var mid = rect.top + rect.height / 2;
    dropLine.style.display = "block";
    dropLine.style.left = rect.left + "px";
    dropLine.style.width = rect.width + "px";
    dropLine.style.top = (event.clientY < mid ? rect.top - 1 : rect.bottom - 1) + "px";
  });

  document.addEventListener("drop", function (event) {
    event.preventDefault();
    dropLine.style.display = "none";
    var target = event.target;
    if (!dragEl || !target || target === dragEl) return;

    var rect = target.getBoundingClientRect();
    var mid = rect.top + rect.height / 2;
    var position = event.clientY < mid ? "before" : "after";

    if (position === "before") {
      target.parentNode && target.parentNode.insertBefore(dragEl, target);
    } else {
      target.parentNode && target.parentNode.insertBefore(dragEl, target.nextSibling);
    }

    queueSnapshot();
    emitToParent({
      __editor_moved: true,
      eid: dragEl.dataset.eid || null,
      targetEid: target.dataset.eid || null,
      position: position,
    });
    if (dragEl) selectElement(dragEl);
  });

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || !data.__editor_cmd) return;

    ensureEids(document.body);
    var el = data.eid ? document.querySelector("[data-eid='" + data.eid + "']") : null;

    if (data.cmd === "style" && el) {
      el.style[data.prop] = data.value;
      selectElement(el);
      queueSnapshot();
    }

    if (data.cmd === "style_query" && el) {
      applyStyleQuery(el, data.selector, data.prop, data.value);
      selectElement(el);
      queueSnapshot();
    }

    if (data.cmd === "style_batch" && el && Array.isArray(data.updates)) {
      data.updates.forEach(function (update) {
        if (!update || !update.prop) return;
        if (update.selector) {
          applyStyleQuery(el, update.selector, update.prop, update.value);
        } else if (el.style) {
          el.style[update.prop] = update.value;
        }
      });
      selectElement(el);
      queueSnapshot();
    }

    if (data.cmd === "icon_patch" && el) {
      var patchedIcon = applyIconPatch(el, data);
      if (patchedIcon && canEdit(patchedIcon)) {
        selectElement(patchedIcon);
        queueSnapshot();
      }
    }

    if (data.cmd === "text" && el) {
      el.innerText = data.value;
      selectElement(el);
      queueSnapshot();
    }

    if (data.cmd === "html" && el) {
      el.innerHTML = data.value;
      ensureEids(el);
      markEditableNodeTypes(el);
      selectElement(el);
      queueSnapshot();
    }

    if (data.cmd === "replace" && el) {
      var oldEid = el.dataset ? el.dataset.eid || null : null;
      var replaceRange = document.createRange();
      replaceRange.selectNode(el);
      var replaceFragment = replaceRange.createContextualFragment(data.value || "");
      var replacementNodes = Array.prototype.slice.call(replaceFragment.childNodes || []);
      var firstReplacement = null;

      for (var replacementIndex = 0; replacementIndex < replacementNodes.length; replacementIndex += 1) {
        var candidate = replacementNodes[replacementIndex];
        if (candidate && candidate.nodeType === 1) {
          firstReplacement = candidate;
          break;
        }
      }

      if (el.parentNode) {
        el.parentNode.insertBefore(replaceFragment, el);
        el.remove();
        ensureEids(document.body);
        markEditableNodeTypes(document.body);
        if (firstReplacement && firstReplacement.nodeType === 1) {
          if (oldEid && firstReplacement.dataset && !firstReplacement.dataset.eid) {
            firstReplacement.dataset.eid = oldEid;
          }
          copyPersistedLayoutState(el, firstReplacement);
          normalizeStandaloneIconElement(firstReplacement);
          normalizeFreeMoveElement(firstReplacement);
        }
        queueSnapshot();
        if (firstReplacement && canEdit(firstReplacement)) {
          selectElement(firstReplacement);
        } else if (el.parentElement && canEdit(el.parentElement)) {
          selectElement(el.parentElement);
        } else {
          selectedEl = null;
          setFreeMove(null);
          freeMoveState = null;
          hideSelectionUi();
          emitToParent({ __editor_select: true, info: null });
        }
      }
    }

    if (data.cmd === "attr" && el) {
      if (data.value === "") el.removeAttribute(data.attr);
      else el.setAttribute(data.attr, data.value);
      if (data.attr === "value" && "value" in el) {
        try {
          el.value = data.value;
        } catch (_err) {}
      }
      if ((data.attr === "checked" || data.attr === "disabled" || data.attr === "required" || data.attr === "multiple") && data.attr in el) {
        try {
          el[data.attr] = data.value !== "";
        } catch (_err) {}
      }
      if (data.attr === "rows" && "rows" in el) {
        try {
          var parsedRows = parseInt(data.value || "0", 10);
          if (!isNaN(parsedRows) && parsedRows > 0) {
            el.rows = parsedRows;
          }
        } catch (_err) {}
      }
      if (data.attr === "data-he-free-move" && data.value === "") {
        resetFreeMoveState(el);
      }
      if (data.attr === "data-he-free-move-mode" && data.value === "") {
        el.removeAttribute("data-he-free-move-mode");
      }
      if ((data.attr === "data-he-move-x" || data.attr === "data-he-move-y") && data.value === "") {
        clearFreeMoveTransform(el);
      }
      if (data.attr === "data-he-base-transform" && data.value === "") {
        clearFreeMoveTransform(el);
      }
      selectElement(el);
      queueSnapshot();
    }

    if (data.cmd === "insert" && el) {
      var range = document.createRange();
      range.selectNode(el);
      var fragment = range.createContextualFragment(data.value || "");
      var insertedNodes = Array.prototype.slice.call(fragment.childNodes || []);
      var firstElement = null;
      for (var i = 0; i < insertedNodes.length; i += 1) {
        if (insertedNodes[i] && insertedNodes[i].nodeType === 1) {
          firstElement = insertedNodes[i];
          break;
        }
      }

      if (data.position === "beforebegin" && el.parentNode) {
        el.parentNode.insertBefore(fragment, el);
      } else if (data.position === "afterbegin") {
        el.insertBefore(fragment, el.firstChild);
      } else if (data.position === "beforeend") {
        el.appendChild(fragment);
      } else if (data.position === "afterend" && el.parentNode) {
        el.parentNode.insertBefore(fragment, el.nextSibling);
      }

      ensureEids(document.body);
      markEditableNodeTypes(document.body);
      queueSnapshot();
      if (firstElement && canEdit(firstElement)) {
        selectElement(firstElement);
      } else {
        selectElement(el);
      }
    }

    if (data.cmd === "enable_drag") {
      enableDrag();
    }

    if (data.cmd === "highlight" && el) {
      selectElement(el);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (data.cmd === "move_up" && el) {
      selectElement(el);
      moveSelected(-1);
    }

    if (data.cmd === "move_down" && el) {
      selectElement(el);
      moveSelected(1);
    }

    if (data.cmd === "delete" && el) {
      selectElement(el);
      deleteSelected();
    }

    if (data.cmd === "cleanup_layout") {
      var cleanupRoot = el || (selectedEl ? getEditorRoot(selectedEl) : document.querySelector("[data-he-import-root='1']"));
      if (cleanupRoot && cleanupLayout(cleanupRoot)) {
        queueSnapshot();
        if (selectedEl && selectedEl.isConnected) {
          selectElement(selectedEl);
        } else if (cleanupRoot && canEdit(cleanupRoot)) {
          selectElement(cleanupRoot);
        }
      }
    }

    if (data.cmd === "deselect") {
      selectedEl = null;
      setFreeMove(null);
      freeMoveState = null;
      hideSelectionUi();
    }
  });
})();
`.trim()
}
