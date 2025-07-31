// Plugin: PerformanceBooster
// Author: Nebula-6
// Description: Disable typing, GIFs, animations, and other UI bloat to improve speed — now with settings toggle!

export default {
  name: "PerformanceBooster",
  description: "Disables heavy UI effects to speed up Discord. Includes a toggle for hiding typing indicators.",
  settings: {
    hideTyping: {
      type: "switch",
      default: true,
      description: "Hide typing indicators from other users."
    }
  },

  onStart(plugin) {
    // Inject style to kill animations and blur
    const css = `
      * {
        backdrop-filter: none !important;
        animation: none !important;
        transition: none !important;
      }
    `;
    const style = document.createElement("style");
    style.innerText = css;
    style.id = "performanceBooster-style";
    document.head.appendChild(style);

    // Observe DOM to hide stickers/GIFs
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === 1 &&
            (node.innerText?.includes("Sticker") || node.innerText?.includes("GIF"))
          ) {
            node.style.display = "none";
          }
        });
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });

    // Patch typing indicator if toggle is on
    if (plugin.settings.hideTyping) {
      this._patchTyping();
    }

    // Patch animated emoji rendering
    const origCreateElement = React.createElement;
    React.createElement = (...args) => {
      const [type, props] = args;
      if (type?.displayName?.includes("Emoji") && props?.animated) {
        return null;
      }
      return origCreateElement(...args);
    };
    this._unpatchCreateElement = () => {
      React.createElement = origCreateElement;
    };
  },

  _patchTyping() {
    if (!this._originalTyping) {
      this._originalTyping = Object.getOwnPropertyDescriptor(Object.prototype, "isTyping");
      Object.defineProperty(Object.prototype, "isTyping", {
        get: () => false,
        configurable: true
      });
    }
  },

  _unpatchTyping() {
    if (this._originalTyping) {
      Object.defineProperty(Object.prototype, "isTyping", this._originalTyping);
      this._originalTyping = null;
    }
  },

  onSettingsUpdate(plugin, key, value) {
    if (key === "hideTyping") {
      if (value) {
        this._patchTyping();
      } else {
        this._unpatchTyping();
      }
    }
  },

  onStop() {
    // Clean up
    document.getElementById("performanceBooster-style")?.remove();
    this.observer?.disconnect();
    this._unpatchTyping?.();
    this._unpatchCreateElement?.();
  }
};
