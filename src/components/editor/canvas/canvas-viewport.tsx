"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Application, Container, Graphics, Text, TextStyle, FederatedPointerEvent } from "pixi.js";
import { useEditorStore } from "@/store/editor-store";
import { usePlaybackStore } from "@/store/playback-store";
import { useSelectionStore } from "@/store/selection-store";
import { useUIStore, type ToolId } from "@/store/ui-store";
import { getEffectiveParallaxFactor, sampleScene } from "@/engine/keyframe-engine";
import { hexToNumber, drawShapeBody, drawFace, drawLimbs, drawAccessories, drawShapePattern } from "@/lib/draw-character";
import type { SceneNode } from "@/engine/types";

function syncSceneViewport(app: Application, sceneContainer: Container, zoom: number) {
  // Keep scene origin centered in the current viewport after any resize.
  sceneContainer.x = app.screen.width / 2;
  sceneContainer.y = app.screen.height / 2;
  sceneContainer.scale.set(zoom);
  app.stage.hitArea = app.screen;
}

export function CanvasViewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const sceneContainerRef = useRef<Container | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [penPoints, setPenPoints] = useState<Array<{ x: number; y: number }>>([]);
  const canvasZoomRef = useRef(1);
  const activeToolRef = useRef<ToolId>("select");
  const penPointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const finalizePenPathRef = useRef<() => boolean>(() => false);
  const dragStateRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    startNodeX: number;
    startNodeY: number;
  } | null>(null);

  const document = useEditorStore((s) => s.document);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const durationMs = useEditorStore((s) => s.durationMs);
  const addShapeNode = useEditorStore((s) => s.addShapeNode);
  const updateNodeTransform = useEditorStore((s) => s.updateNodeTransform);
  const currentTimeMs = usePlaybackStore((s) => s.currentTimeMs);
  const selectedNodeIds = useSelectionStore((s) => s.selectedNodeIds);
  const selectNode = useSelectionStore((s) => s.selectNode);
  const clearNodeSelection = useSelectionStore((s) => s.clearNodeSelection);
  const clearSelectionRef = useRef(clearNodeSelection);
  const canvasZoom = useUIStore((s) => s.canvasZoom);
  const activeTool = useUIStore((s) => s.activeTool);
  const setCanvasZoom = useUIStore((s) => s.setCanvasZoom);

  useEffect(() => {
    canvasZoomRef.current = canvasZoom;
  }, [canvasZoom]);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);
  useEffect(() => {
    penPointsRef.current = penPoints;
  }, [penPoints]);
  useEffect(() => {
    clearSelectionRef.current = clearNodeSelection;
  }, [clearNodeSelection]);

  const finalizePenPath = useCallback(() => {
    const points = penPointsRef.current;
    if (points.length < 3) return false;

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    const width = Math.max(12, maxX - minX);
    const height = Math.max(12, maxY - minY);
    const cx = minX + width / 2;
    const cy = minY + height / 2;
    const customPath = points.map((p) => ({ x: p.x - cx, y: p.y - cy }));

    const nodeId = addShapeNode(
      "Pen Shape",
      {
        shapeType: "custom-path",
        width: Math.round(width),
        height: Math.round(height),
        fill: "#58a6ff",
        customPath,
      },
      { x: cx, y: cy }
    );
    selectNode(nodeId);
    setPenPoints([]);
    return true;
  }, [addShapeNode, selectNode]);

  useEffect(() => {
    finalizePenPathRef.current = finalizePenPath;
  }, [finalizePenPath]);

  useEffect(() => {
    if (activeTool !== "pen") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setPenPoints([]);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        finalizePenPath();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTool, finalizePenPath]);

  // Initialize PixiJS
  useEffect(() => {
    if (!containerRef.current) return;

    const app = new Application();
    let destroyed = false;
    let handleRendererResize: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const initPromise = app.init({
      background: "#d8dee6",
      resizeTo: containerRef.current,
      antialias: true,
    }).then(() => {
      if (destroyed || !containerRef.current) return;
      containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      const containerEl = containerRef.current;

      // Make stage interactive for pointer events
      app.stage.eventMode = "static";
      app.stage.hitArea = app.screen;

      // Scene container
      const sceneContainer = new Container();
      sceneContainer.label = "scene";
      app.stage.addChild(sceneContainer);
      sceneContainerRef.current = sceneContainer;

      syncSceneViewport(app, sceneContainer, canvasZoomRef.current);

      // Background fill for the canvas area (centered on origin)
      const bg = new Graphics();
      bg.label = "canvas-bg";
      bg.rect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
      bg.fill({ color: 0xf8fafc });
      bg.stroke({ width: 1, color: 0xcfd8e3 });
      sceneContainer.addChild(bg);

      // Pointer up on stage to end drag
      app.stage.on("pointerup", () => {
        dragStateRef.current = null;
      });
      app.stage.on("pointerupoutside", () => {
        dragStateRef.current = null;
      });
      app.stage.on("pointerdown", (e: FederatedPointerEvent) => {
        if (activeToolRef.current === "pen") {
          const localPos = sceneContainer.toLocal(e.global);
          const points = penPointsRef.current;
          if (points.length >= 3) {
            const first = points[0];
            const closeRadius = 12 / Math.max(0.1, canvasZoomRef.current);
            const dx = localPos.x - first.x;
            const dy = localPos.y - first.y;
            if (dx * dx + dy * dy <= closeRadius * closeRadius) {
              finalizePenPathRef.current();
              return;
            }
          }
          setPenPoints((prev) => [...prev, { x: localPos.x, y: localPos.y }]);
          return;
        }

        if (penPointsRef.current.length > 0) {
          setPenPoints([]);
        }

        // Only clear when user clicks empty stage/background, not a node.
        if (e.target === app.stage || e.target === bg) {
          clearSelectionRef.current();
        }
      });

      // Pointer move on stage for drag
      app.stage.on("pointermove", (e: FederatedPointerEvent) => {
        const drag = dragStateRef.current;
        if (!drag) return;

        const localPos = sceneContainer.toLocal(e.global);
        const dx = localPos.x - drag.startX;
        const dy = localPos.y - drag.startY;

        updateNodeTransform(drag.nodeId, {
          x: drag.startNodeX + dx,
          y: drag.startNodeY + dy,
        });
      });

      // Keep scene centered when layout panels resize.
      handleRendererResize = () => {
        syncSceneViewport(app, sceneContainer, canvasZoomRef.current);
      };
      app.renderer.on("resize", handleRendererResize);

      resizeObserver = new ResizeObserver(() => {
        // Ensure center sync even if panel/layout changes race renderer resize timing.
        handleRendererResize?.();
      });
      if (containerEl) {
        resizeObserver.observe(containerEl);
      }

      setCanvasReady(true);
    });

    return () => {
      destroyed = true;
      setCanvasReady(false);
      initPromise.then(() => {
        if (handleRendererResize) {
          app.renderer.off("resize", handleRendererResize);
        }
        resizeObserver?.disconnect();
        app.destroy(true, { children: true });
        appRef.current = null;
        sceneContainerRef.current = null;
      });
    };
  }, [canvasWidth, canvasHeight, updateNodeTransform]);

  // Update scene container position when zoom changes
  useEffect(() => {
    const app = appRef.current;
    const sc = sceneContainerRef.current;
    if (!app || !sc) return;

    syncSceneViewport(app, sc, canvasZoom);
  }, [canvasZoom, canvasWidth, canvasHeight]);

  // Render scene nodes
  useEffect(() => {
    if (!canvasReady) return;
    const container = sceneContainerRef.current;
    if (!container) return;

    const transforms = sampleScene(document, currentTimeMs);

    // Remove all children except background (index 0)
    while (container.children.length > 1) {
      container.removeChildAt(container.children.length - 1);
    }

    const rootNode = document.nodes[document.rootNodeId];
    if (!rootNode) return;

    // Helper to get layer sort order
    const layerOrder = (nodeId: string): number => {
      const node = document.nodes[nodeId];
      switch (node?.layer) {
        case "background": return 0;
        case "normal": return 1;
        case "foreground": return 2;
        default: return 1;
      }
    };

    function renderNode(nodeId: string) {
      const node = document.nodes[nodeId];
      if (!node || !node.visible || nodeId === document.rootNodeId) return;

      const transform = transforms[nodeId];
      if (!transform) return;

      const nodeContainer = new Container();
      const parallaxFactor = getEffectiveParallaxFactor(document, nodeId, currentTimeMs);
      nodeContainer.x = transform.x + getParallaxOffset(parallaxFactor, currentTimeMs, durationMs);
      nodeContainer.y = transform.y;
      nodeContainer.rotation = (transform.rotation * Math.PI) / 180;
      nodeContainer.scale.set(transform.scaleX, transform.scaleY);
      nodeContainer.alpha = transform.opacity;
      nodeContainer.eventMode = "static";
      nodeContainer.cursor = activeToolRef.current === "pen" ? "crosshair" : "pointer";
      nodeContainer.label = nodeId;

      const isSelected = selectedNodeIds.has(nodeId);
      const { w, h } = drawNodeBody(nodeContainer, node, isSelected, currentTimeMs);

      // Selection outline for visible nodes
      if (isSelected && node.type !== "container") {
        drawSelectionOutline(nodeContainer, w, h);
      }

      // Pointer interactions
      nodeContainer.on("pointerdown", (e: FederatedPointerEvent) => {
        if (activeToolRef.current === "pen") {
          return;
        }
        e.stopPropagation();
        selectNode(nodeId, e.shiftKey);

        // Start drag
        const localPos = sceneContainerRef.current!.toLocal(e.global);
        dragStateRef.current = {
          nodeId,
          startX: localPos.x,
          startY: localPos.y,
          startNodeX: transform.x,
          startNodeY: transform.y,
        };
      });

      container!.addChild(nodeContainer);

      // Render children sorted by layer
      const sortedChildren = [...node.childIds].sort((a, b) => layerOrder(a) - layerOrder(b));
      for (const childId of sortedChildren) {
        renderNode(childId);
      }
    }

    // Sort root children by layer before rendering
    const sortedRootChildren = [...rootNode.childIds].sort((a, b) => layerOrder(a) - layerOrder(b));
    for (const childId of sortedRootChildren) {
      renderNode(childId);
    }

    if (activeTool === "pen" && penPoints.length > 0) {
      const guide = new Graphics();
      guide.label = "pen-guide";
      guide.eventMode = "none";

      const strokeWidth = Math.max(1.2, 2 / Math.max(0.1, canvasZoomRef.current));
      const pointRadius = Math.max(2.2, 4 / Math.max(0.1, canvasZoomRef.current));
      const first = penPoints[0];

      guide.moveTo(first.x, first.y);
      for (let i = 1; i < penPoints.length; i += 1) {
        guide.lineTo(penPoints[i].x, penPoints[i].y);
      }
      guide.stroke({ width: strokeWidth, color: 0x0ea5e9, alpha: 0.95 });

      for (let i = 0; i < penPoints.length; i += 1) {
        const p = penPoints[i];
        const isFirst = i === 0;
        guide.circle(p.x, p.y, pointRadius * (isFirst ? 1.35 : 1));
        guide.fill({ color: isFirst ? 0x22d3ee : 0x38bdf8, alpha: 0.95 });
      }

      container.addChild(guide);
    }
  }, [canvasReady, document, currentTimeMs, durationMs, selectedNodeIds, selectNode, activeTool, penPoints]);

  // Zoom with mouse wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setCanvasZoom(canvasZoom + delta);
      }
    },
    [canvasZoom, setCanvasZoom]
  );

  return (
    <div id="editor-canvas-viewport" className="relative w-full h-full bg-[#dfe5eb] overflow-hidden rounded-2xl border border-[#cfd8e3]">
      <div
        ref={containerRef}
        className="w-full h-full"
        onWheel={handleWheel}
      />
      {activeTool === "pen" && (
        <div className="absolute top-3 left-3 text-[11px] text-cyan-900 bg-cyan-100/95 px-2.5 py-1.5 rounded border border-cyan-300">
          {penPoints.length >= 3
            ? "Pen: click first point or press Enter to close shape. Esc cancels."
            : "Pen: click to place points. Need at least 3 points."}
        </div>
      )}
      <div className="absolute bottom-3 right-3 text-xs text-gray-600 bg-white/85 px-2 py-1 rounded">
        {Math.round(canvasZoom * 100)}%
      </div>
    </div>
  );
}

// ─── Drawing helpers ──────────────────────────────────────────

function drawNodeBody(
  nodeContainer: Container,
  node: SceneNode,
  isSelected: boolean,
  timeMs: number
): { w: number; h: number } {
  if (node.type === "shape" && node.shape) {
    return drawShape(nodeContainer, node, isSelected, timeMs);
  }

  if (node.type === "text" && node.text) {
    return drawTextNode(nodeContainer, node);
  }

  if (node.type === "sprite") {
    return drawSpritePlaceholder(nodeContainer, node, isSelected);
  }

  if (node.type === "container") {
    const icon = new Graphics();
    icon.roundRect(-15, -15, 30, 30, 3);
    icon.stroke({ width: 1, color: 0x888888, alpha: 0.4 });
    nodeContainer.addChild(icon);
    return { w: 30, h: 30 };
  }

  return { w: 0, h: 0 };
}

function getParallaxOffset(factor: number, timeMs: number, durationMs: number): number {
  if (Math.abs(factor) < 0.001) return 0;

  const cycleMs = Math.max(3000, durationMs || 6000);
  const angle = (timeMs / cycleMs) * Math.PI * 2;
  const amplitude = 48;
  return Math.sin(angle) * amplitude * factor;
}

function drawShape(
  nodeContainer: Container,
  node: SceneNode,
  isSelected: boolean,
  timeMs: number
): { w: number; h: number } {
  const shape = node.shape!;

  // Draw limbs behind the body
  if (node.limbs) {
    drawLimbs(nodeContainer, node.limbs, shape.width, shape.height);
  }

  const body = new Graphics();
  const { w, h } = drawShapeBody(body, shape);
  nodeContainer.addChild(body);
  drawShapePattern(nodeContainer, shape, w, h);

  const sampledFace = sampleFaceAtTime(node, timeMs);
  if (sampledFace) {
    drawFace(nodeContainer, sampledFace, w, h, timeMs);
  }

  if (node.accessories && node.accessories.length > 0) {
    drawAccessories(nodeContainer, node.accessories, w, h);
  }

  if (node.showLabel) {
    const label = new Text({
      text: node.name,
      style: new TextStyle({
        fontSize: 11,
        fill: isSelected ? 0x88bbff : 0xaaaaaa,
        fontFamily: "system-ui, sans-serif",
      }),
    });
    label.anchor.set(0.5);
    label.y = h / 2 + 14;
    nodeContainer.addChild(label);
  }

  return { w, h };
}

function sampleFaceAtTime(node: SceneNode, timeMs: number) {
  if (!node.face) return undefined;
  const keyframes = node.faceKeyframes;
  if (!keyframes || keyframes.length === 0) return node.face;

  let activeFace = node.face;
  let bestTime = -1;
  for (const kf of keyframes) {
    if (kf.timeMs <= timeMs && kf.timeMs >= bestTime) {
      activeFace = kf.face;
      bestTime = kf.timeMs;
    }
  }
  return activeFace;
}

function drawTextNode(
  nodeContainer: Container,
  node: SceneNode
): { w: number; h: number } {
  const tp = node.text!;
  const textObj = new Text({
    text: tp.content,
    style: new TextStyle({
      fontSize: tp.fontSize,
      fill: hexToNumber(tp.fill),
      fontFamily: tp.fontFamily,
      fontWeight: tp.fontWeight ?? "normal",
      align: tp.textAlign ?? "left",
      wordWrap: true,
      wordWrapWidth: 400,
    }),
  });
  textObj.anchor.set(0.5);
  nodeContainer.addChild(textObj);

  return {
    w: Math.max(textObj.width, 40),
    h: Math.max(textObj.height, 20),
  };
}

function drawSpritePlaceholder(
  nodeContainer: Container,
  node: SceneNode,
  isSelected: boolean
): { w: number; h: number } {
  const w = 100;
  const h = 100;
  const body = new Graphics();
  body.roundRect(-w / 2, -h / 2, w, h, 6);
  body.fill({ color: isSelected ? 0x3366cc : 0x555588 });
  nodeContainer.addChild(body);

  // Sprite icon (image placeholder)
  const icon = new Graphics();
  icon.moveTo(-16, -8);
  icon.lineTo(16, -8);
  icon.lineTo(16, 12);
  icon.lineTo(-16, 12);
  icon.closePath();
  icon.stroke({ width: 1.5, color: 0xaaaacc });
  // Mountain shape inside
  icon.moveTo(-12, 8);
  icon.lineTo(-4, -2);
  icon.lineTo(2, 4);
  icon.lineTo(8, -4);
  icon.lineTo(12, 8);
  icon.stroke({ width: 1, color: 0xaaaacc });
  nodeContainer.addChild(icon);

  if (node.showLabel) {
    const label = new Text({
      text: node.name,
      style: new TextStyle({
        fontSize: 11,
        fill: isSelected ? 0x88bbff : 0xaaaaaa,
        fontFamily: "system-ui, sans-serif",
      }),
    });
    label.anchor.set(0.5);
    label.y = h / 2 + 14;
    nodeContainer.addChild(label);
  }

  return { w, h };
}

function drawSelectionOutline(
  nodeContainer: Container,
  w: number,
  h: number
) {
  const outline = new Graphics();
  outline.roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 4);
  outline.stroke({ width: 2, color: 0x4488ff, alpha: 0.9 });

  const handleSize = 6;
  const corners = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [-w / 2, h / 2],
    [w / 2, h / 2],
  ];
  for (const [cx, cy] of corners) {
    outline.rect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    outline.fill({ color: 0x4488ff });
  }

  nodeContainer.addChild(outline);
}
