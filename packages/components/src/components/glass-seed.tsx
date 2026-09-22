import * as React from "react";

import { GLASS_REFERENCE_VARIABLE } from "@/lib/glass";
import { supportsGlassRefraction } from "@/lib/glass-capabilities";

/**
 * Stable id of the shared refraction filter definition.
 *
 * The material's CSS is generated from the Token package and cannot import a
 * JavaScript constant, so `glass.css` repeats this id. Keep the two in step.
 */
export const GLASS_FILTER_ID = "exui-glass-distortion-v1";

const FILTER_REFERENCE = `url("#${GLASS_FILTER_ID}")`;

/**
 * What one document currently owes the mounted seeds.
 *
 * `count` is how many seeds are live, and the captured value is what the
 * document held before the first of them wrote anything. Counting is what makes
 * an unordered teardown safe: with two seeds and only a save/restore pair, the
 * one that unmounts first would either clear the variable while the other is
 * still live or leave the value behind once the last one goes.
 */
type DocumentReferenceState = {
  count: number;
  previous: string;
  previousPriority: string;
};

const documentReferenceStates = new WeakMap<Document, DocumentReferenceState>();

/** Register one live seed against its document and return its cleanup. */
function attachDocumentReference(root: HTMLElement): () => void {
  const { ownerDocument } = root;
  const existing = documentReferenceStates.get(ownerDocument);

  if (existing === undefined) {
    const previous = root.style.getPropertyValue(GLASS_REFERENCE_VARIABLE);
    const previousPriority = root.style.getPropertyPriority(
      GLASS_REFERENCE_VARIABLE,
    );

    documentReferenceStates.set(ownerDocument, {
      count: 1,
      previous,
      previousPriority,
    });

    // Write with the priority the host used rather than dropping it, so a seed
    // mounted into a document that marks the variable important does not
    // downgrade the host's own declaration.
    root.style.setProperty(
      GLASS_REFERENCE_VARIABLE,
      FILTER_REFERENCE,
      previousPriority,
    );
  } else {
    existing.count += 1;
  }

  // Detach synchronously rather than through an effect, so a Strict Mode
  // setup/cleanup/setup cycle and a real unmount both leave the document
  // exactly as they found it and no surface keeps a dangling reference.
  return () => {
    const state = documentReferenceStates.get(ownerDocument);
    if (state === undefined) {
      return;
    }

    state.count -= 1;
    if (state.count > 0) {
      return;
    }

    documentReferenceStates.delete(ownerDocument);

    if (state.previous === "") {
      root.style.removeProperty(GLASS_REFERENCE_VARIABLE);
      return;
    }

    root.style.setProperty(
      GLASS_REFERENCE_VARIABLE,
      state.previous,
      state.previousPriority,
    );
  };
}

/**
 * Declares the shared SVG refraction filter once per document.
 *
 * Mounting the seed is the only host setup the material needs. The component
 * renders static markup, so a server render is safe; the enhancement turns on
 * in the ref callback once the browser has confirmed it accepts the filter
 * chain, and turns off again when the last seed in the document unmounts.
 *
 * It is not a provider: it renders no children, reads no context, and the
 * material works without it, just without refraction.
 */
function GlassSeed(): React.ReactElement {
  const attachSeed = React.useCallback((node: SVGSVGElement | null) => {
    if (node === null) {
      return;
    }

    const view = node.ownerDocument.defaultView;
    if (view === null || !supportsGlassRefraction(view, FILTER_REFERENCE)) {
      return;
    }

    const root = node.ownerDocument.documentElement;
    return attachDocumentReference(root);
  }, []);

  return (
    <svg
      ref={attachSeed}
      data-slot="glass-seed"
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <defs>
        <filter
          id={GLASS_FILTER_ID}
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.02"
            numOctaves="2"
            seed="92"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2" result="smooth-noise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="smooth-noise"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
            result="distorted"
          />
        </filter>
      </defs>
    </svg>
  );
}

export { GlassSeed };
