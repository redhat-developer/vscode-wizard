let wizardMap = new Map();
const cssColorRegex = /^(?:(#?)([0-9a-f]{3}|[0-9a-f]{6})|((?:rgb|hsl)a?)\((-?\d+%?)[,\s]+(-?\d+%?)[,\s]+(-?\d+%?)[,\s]*(-?[\d.]+%?)?\))$/i;

function initEventListener(fn) {
  window.addEventListener('message', event => {
    const message = event.data;
    if (message.command.match(/Response$/) && message.contents) {
      message.contents.forEach(content => {
        let element = document.getElementById(content.id);
        if (element === null) {
          console.error(content.id + " is null");
        } else {
          element.innerHTML = content.body;
        }
      });
    } else if (message.command === "openFileDialogResponse") {
      const returnObject = message.result.returnObject;
      const { fieldId, fsPath } = returnObject;
      if (fsPath) {
        const htmlInput = document.getElementById(fieldId);
        htmlInput.value = fsPath;
        // set the value doesn't fire oninput listener, the fieldChanged must be called here
        fieldChanged(htmlInput);
      }
    } else {
      if (fn) {
        fn(message);
      }
    }
    // Update focused field
    const focusedField = message?.focusedField;
    if (focusedField) {
      const elt = document.getElementById(focusedField);
      if (elt !== null) {
        elt.focus();
      }
    }
  });
}

function loadWizard() {

  initEventListener(function (msg) {
    if (msg && msg.result) {
      // Receive InitializeData command, initialize fields value
      const map = new Map(Object.entries(msg.result));
      wizardMap = map;
      // Notify that the first page can be displayed
      postCommandWithMap("ready");
    }
  });

  initializeAndWatchThemeColors();
}

function fieldChanged(elt, val) {
  const value = val !== undefined ? val : elt.value;
  wizardMap.set(elt.id, value);
  postCommandWithMap("validate");
}

function nextPressed() {
  // Open the next page
  postCommandWithMap("nextPressed");
}

function backPressed() {
  // Open the previous page
  postCommandWithMap("backPressed");
}

function finishPressed() {
  postCommandWithMap("finishPressed");
}

function openFileDialog(fieldId, options) {
  vscode.postMessage({
    command: "openFileDialog",
    parameters: {
      fieldId: fieldId,
      options: options
    }
  });
}

function postCommandWithMap(cmdid) {
  vscode.postMessage({
    command: cmdid,
    parameters: Object.fromEntries(wizardMap)
  });
}

function adjustLight(color, amount) {
  const cc = color + amount;
  const c = amount < 0 ? cc < 0 ? 0 : cc : cc > 255 ? 255 : cc;
  return Math.round(c);
}

function darken(color, percentage) {
  return lighten(color, -percentage);
}

function lighten(color, percentage) {
  const rgba = toRgba(color);
  if (rgba === null) {
    return color;
  }
  const [r, g, b, a] = rgba;
  const amount = 255 * percentage / 100;
  return `rgba(${adjustLight(r, amount)}, ${adjustLight(g, amount)}, ${adjustLight(b, amount)}, ${a})`;
}

function opacity(color, percentage) {
  const rgba = toRgba(color);
  if (rgba === null) {
    return color;
  }
  const [r, g, b, a] = rgba;
  return `rgba(${r}, ${g}, ${b}, ${a * (percentage / 100)})`;
}

function toRgba(color) {
  color = color.trim();
  const result = cssColorRegex.exec(color);
  if (result === null) {
    return null;
  }
  if (result[1] === "#") {
    const hex = result[2];
    switch (hex.length) {
      case 3:
        return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16), 1];
      case 6:
        return [
          parseInt(hex.substring(0, 2), 16),
          parseInt(hex.substring(2, 4), 16),
          parseInt(hex.substring(4, 6), 16),
          1
        ];
    }
    return null;
  }
  switch (result[3]) {
    case "rgb":
      return [parseInt(result[4], 10), parseInt(result[5], 10), parseInt(result[6], 10), 1];
    case "rgba":
      return [parseInt(result[4], 10), parseInt(result[5], 10), parseInt(result[6], 10), parseFloat(result[7])];
    default:
      return null;
  }
}

function initializeAndWatchThemeColors() {
  const onColorThemeChanged = () => {
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    const bodyStyle = body.style;
    const font = computedStyle.getPropertyValue("--vscode-font-family").trim();
    if (font) {
      bodyStyle.setProperty("--font-family", font);
      bodyStyle.setProperty("--font-size", computedStyle.getPropertyValue("--vscode-font-size").trim());
      bodyStyle.setProperty("--font-weight", computedStyle.getPropertyValue("--vscode-font-weight").trim());
    } else {
      bodyStyle.setProperty("--font-family", computedStyle.getPropertyValue("--vscode-editor-font-family").trim());
      bodyStyle.setProperty("--font-size", computedStyle.getPropertyValue("--vscode-editor-font-size").trim());
      bodyStyle.setProperty("--font-weight", computedStyle.getPropertyValue("--vscode-editor-font-weight").trim());
    }
    let color = computedStyle.getPropertyValue("--vscode-editor-background").trim();
    bodyStyle.setProperty("--color-background", color);
    bodyStyle.setProperty("--color-background--lighten-05", lighten(color, 5));
    bodyStyle.setProperty("--color-background--darken-05", darken(color, 5));
    bodyStyle.setProperty("--color-background--lighten-075", lighten(color, 7.5));
    bodyStyle.setProperty("--color-background--darken-075", darken(color, 7.5));
    bodyStyle.setProperty("--color-background--lighten-15", lighten(color, 15));
    bodyStyle.setProperty("--color-background--darken-15", darken(color, 15));
    bodyStyle.setProperty("--color-background--lighten-30", lighten(color, 30));
    bodyStyle.setProperty("--color-background--darken-30", darken(color, 30));
    bodyStyle.setProperty("--color-background--lighten-50", lighten(color, 50));
    bodyStyle.setProperty("--color-background--darken-50", darken(color, 50));
    color = computedStyle.getPropertyValue("--vscode-button-background").trim();
    bodyStyle.setProperty("--color-button-background", color);
    bodyStyle.setProperty("--color-button-background--darken-30", darken(color, 30));
    color = computedStyle.getPropertyValue("--vscode-button-secondaryBackground").trim();
    bodyStyle.setProperty("--color-button-secondary-background", color);
    bodyStyle.setProperty("--color-button-secondary-background--darken-30", darken(color, 30));
    color = computedStyle.getPropertyValue("--vscode-button-background").trim();
    bodyStyle.setProperty("--color-highlight", color);
    bodyStyle.setProperty("--color-highlight--75", opacity(color, 75));
    bodyStyle.setProperty("--color-highlight--50", opacity(color, 50));
    bodyStyle.setProperty("--color-highlight--25", opacity(color, 25));
    color = computedStyle.getPropertyValue("--vscode-button-foreground").trim();
    bodyStyle.setProperty("--color-button-foreground", color);
    color = computedStyle.getPropertyValue("--vscode-editor-foreground").trim();
    if (!color) {
      color = computedStyle.getPropertyValue("--vscode-foreground").trim();
    }
    bodyStyle.setProperty("--color-foreground", color);
    bodyStyle.setProperty("--color-foreground--85", opacity(color, 85));
    bodyStyle.setProperty("--color-foreground--75", opacity(color, 75));
    bodyStyle.setProperty("--color-foreground--65", opacity(color, 65));
    bodyStyle.setProperty("--color-foreground--50", opacity(color, 50));
    color = computedStyle.getPropertyValue("--vscode-focusBorder").trim();
    bodyStyle.setProperty("--color-focus-border", color);
    color = computedStyle.getPropertyValue("--vscode-textLink-foreground").trim();
    bodyStyle.setProperty("--color-link-foreground", color);
    bodyStyle.setProperty("--color-link-foreground--darken-20", darken(color, 20));
    bodyStyle.setProperty("--color-link-foreground--lighten-20", lighten(color, 20));
  };
  const observer = new MutationObserver(onColorThemeChanged);
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  onColorThemeChanged();
  return observer;
}
