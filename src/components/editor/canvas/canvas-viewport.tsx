"use client";

import { useRef, useEffect, useCallback } from "react";
import { Application, Container, Graphics, Text, TextStyle, FederatedPointerEvent } from "pixi.js";
import { useEditorStore } from "@/store/editor-store";
import { usePlaybackStore } from "@/store/playback-store";
import { useSelectionStore } from "@/store/selection-store";
import { useUIStore } from "@/store/ui-store";
import { getEffectiveParallaxFactor, sampleScene } from "@/engine/keyframe-engine";
import { hexToNumber, drawShapeBody, drawFace, drawLimbs } from "@/lib/draw-character";
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
  const canvasZoomRef = useRef(1);
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
  const updateNodeTransform = useEditorStore((s) => s.updateNodeTransform);
  const currentTimeMs = usePlaybackStore((s) => s.currentTimeMs);
  const selectedNodeIds = useSelectionStore((s) => s.selectedNodeIds);
  const selectNode = useSelectionStore((s) => s.selectNode);
  const clearNodeSelection = useSelectionStore((s) => s.clearNodeSelection);
  const clearSelectionRef = useRef(clearNodeSelection);
  const canvasZoom = useUIStore((s) => s.canvasZoom);
  const setCanvasZoom = useUIStore((s) => s.setCanvasZoom);

  useEffect(() => {
    canvasZoomRef.current = canvasZoom;
  }, [canvasZoom]);
  useEffect(() => {
    clearSelectionRef.current = clearNodeSelection;
  }, [clearNodeSelection]);

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
        // Only clear when user clicks empty stage/background, not a node.
        if (e.target === app.stage) {
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
    });

    return () => {
      destroyed = true;
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
      nodeContainer.cursor = "pointer";
      nodeContainer.label = nodeId;

      const isSelected = selectedNodeIds.has(nodeId);
      const { w, h } = drawNodeBody(nodeContainer, node, isSelected, currentTimeMs);

      // Selection outline for visible nodes
      if (isSelected && node.type !== "container") {
        drawSelectionOutline(nodeContainer, w, h);
      }

      // Pointer interactions
      nodeContainer.on("pointerdown", (e: FederatedPointerEvent) => {
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
  }, [document, currentTimeMs, durationMs, selectedNodeIds, selectNode]);

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
    <div className="relative w-full h-full bg-[#dfe5eb] overflow-hidden rounded-2xl border border-[#cfd8e3]">
      <div
        ref={containerRef}
        className="w-full h-full"
        onWheel={handleWheel}
      />
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

  const sampledFace = sampleFaceAtTime(node, timeMs);
  if (sampledFace) {
    drawFace(nodeContainer, sampledFace, w, h, timeMs);
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
