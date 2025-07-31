import { Plugin, registerPlugin } from "enmity/managers/plugins";
import { createSettings } from "enmity/api/settings";
import { React } from "enmity/metro/common";

// Settings
const settings = createSettings({
  hideTyping: {
    type: "switch",
    default: true,
    label: "Hide Typing Indicators",
    description: "Hide 'User is typing...' indicators."
  }
});

let observer: MutationObserver | null = null;
let styleElement: HTMLStyleElement | null = null;
let originalTypingDescriptor: PropertyDescriptor | null = null;
let unpatchCreateElement: (() => void) | null = null;

const patchTyping = () => {
  if (!originalTypingDescriptor) {
    originalTypingDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, "isTyping");
    Object.defineProperty(Object.prototype, "isTyping", {
      get: () => false,
      configurable: true
    });
  }
};

const unpatchTyping = () => {
  if (originalTypingDescriptor) {
    Object.defineProperty(Object.prototype, "isTyping", originalTypingDescriptor);
    originalTypingDescriptor = null;
  }
};

const PerformanceBooster: Plugin = {
  name: "PerformanceBooster",
  description: "Disables Discord animations and effects to boost performance. Includes typing indicator toggle.",
  authors: [{ name: "Nebula-6", id: "0" }],
  version: "1.0.0",

  onStart() {
    // Remove animations and transitions
    styleElement = document.createElement("style");
    styleElement.id = "performanceBooster-style";
    styleElement.innerText = `
      * {
        backdrop-filter: none !important;
        animation: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(styleElement);

    // Observe for sticker/GIF banners
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === 1 &&
            (node.textContent?.includes("Sticker") || node.textContent?.includes("GIF"))
          ) {
            (node as HTMLElement).style.display = "none";
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Hide typing indicator if enabled
    if (settings.get("hideTyping")) patchTyping();

    // Block animated emoji
    const origCreateElement = React.createElement;
    React.createElement = (...args) => {
      const [type, props] = args;
      if (type?.displayName?.includes("Emoji") && props?.animated) return null;
      return origCreateElement(...args);
    };
    unpatchCreateElement = () => {
      React.createElement = origCreateElement;
    };
  },

  onSettingsUpdate(_, key, value) {
    if (key === "hideTyping") {
      value ? patchTyping() : unpatchTyping();
    }
  },

  onStop() {
    styleElement?.remove();
    observer?.disconnect();
    unpatchTyping();
    unpatchCreateElement?.();
  },

  getSettingsPanel() {
    return settings.render();
  }
};

registerPlugin(PerformanceBooster);
