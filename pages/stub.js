let wizardMap = new Map();
const cssColorRegex = /^(?:(#?)([0-9a-f]{3}|[0-9a-f]{6})|((?:rgb|hsl)a?)\((-?\d+%?)[,\s]+(-?\d+%?)[,\s]+(-?\d+%?)[,\s]*(-?[\d.]+%?)?\))$/i;

function initEventListener(fn) {
  window.addEventListener('message', event => {
    const message = event.data;
    if (message.command.match(/Response$/) && message.contents) {
      let contentSectionModified = false;
      message.contents.forEach(content => {
        if( content.id === 'content') {
          contentSectionModified = true;
        }
        let element = document.getElementById(content.id);
        if (element === null) {
          console.error(content.id + " is null");
        } else {
          element.innerHTML = content.body;
        }
      });
      if( contentSectionModified ) {
        var onloads = document.querySelectorAll('[data-onload]');
        for( onloadsIterator = 0; onloadsIterator < onloads.length; onloadsIterator++ ) {
          const asId = onloads[onloadsIterator]["id"];
          const onloadVal = findDataOnloadValue(onloads[onloadsIterator]);
          if( onloadVal ) {
            try {
              eval(onloadVal);
            } catch( error ) {
              console.log(error);
            }
          }
        }
      }
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

function findDataOnloadValue(el) {
  for (i = 0, atts = el.attributes, n = atts.length; i < n; i++){
    if( atts[i].nodeName === "data-onload") {
      return atts[i].nodeValue;
    }
  }
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

function fieldChangedKeyVal(key, val) {
  wizardMap.set(key, val);
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

/* Combo Functions Below */
function comboFieldChanged(id) {
  const comboTextField = document.getElementById(id);
  if (comboTextField.value) {
    comboDropDownForTags(id, comboTextField.value);
  } else {
    hideComboList(id);
  }
  fieldChangedKeyVal(id, comboTextField.value);
}

function initComboField(comboId) {
  const comboTextField = document.getElementById(comboId);
  comboTextField.addEventListener('keypress', (e) => {
    if (e.code === 'Enter') {
      selectHighlightedCombo(comboId);
    }
    hideComboList(comboId);
    initComboList(comboId);
  });
  comboTextField.addEventListener('click', () => {
    comboDropDownForTags(comboTextField.id, (comboTextField.value || "").trim());
    //keyUpDown();
  });
  comboRegisterKeyUpDownListener(comboId);
}

function isComboListVisible(id) {
  const group = document.getElementById(id + "_innerUL");
  return group.getAttribute("data-toggle") === 'true';
}

function showComboList(id) {
  const group = document.getElementById(id + "_innerUL");
  group.setAttribute("data-toggle", 'true');
}

function selectHighlightedCombo(comboId) {
  const group = document.getElementById(comboId + "_listgroup");
  const listArray = group.querySelectorAll('li ul li');
  for (let i = 0; i < listArray.length; i++) {
    const highlighted = listArray[i].getAttribute("data-highlight");
    if( highlighted === 'true') {
      selectComboElement(comboId, listArray[i]);
      return;
    }
  }
}

function selectComboElement(comboId, listItem) {
  const textField = document.getElementById(comboId);
  textField.value = listItem.innerHTML;
  fieldChangedKeyVal(comboId, textField.value);
  hideComboList(comboId);
}

function highlightComboElement(comboId, listItem) {
  const group = document.getElementById(comboId + "_listgroup");
  const listArray = group.querySelectorAll('li ul li');
  for (let i = 0; i < listArray.length; i++) {
    const highlighted = listItem === listArray[i];
    listArray[i].setAttribute("data-highlight", highlighted);
  }
}

function hideComboList(id) {
  const group = document.getElementById(id + "_innerUL");
  group.setAttribute("data-toggle", 'false');
}

function initComboItem(id, item) {
  item.setAttribute("data-display", true);
  item.setAttribute("data-highlight", false);
}

function initComboList(id) {
  const group = document.getElementById(id + "_listgroup");
  const listArray = group.querySelectorAll('li ul li');
  for (let i = 0; i < listArray.length; i++) {
    initComboItem(id, listArray[i]);
    //listArray[i].addEventListener('click', comboCopyPasteFor(id));
  }
}

function comboCopyPasteFor(id) {
  return () => {
    const taskInput = document.getElementById(id);
    taskInput['value'] = this.innerHTML;
    initList();
    hideList(listGroup);
  }
}

function comboDropDownForTags(id, val) {
  const group = document.getElementById(id + "_listgroup");
  const listArray = group.querySelectorAll('li ul li');
  let firstFound = false;
  for (let i = 0; i < listArray.length; i++) {
    const highlighted = comboMatching(listArray[i], val.trim());
    if( !firstFound && highlighted === 'true') {
      listArray[i].setAttribute("data-highlight", true);
      firstFound = true;
    }
  }
  showComboList(id);
}

function comboMatching(item, input) {
  let v = 'false';
  if( !input || input === '' || (item && item.innerHTML && item.innerHTML.startsWith(input))) {
    v = 'true';
  }
  item.setAttribute("data-display", v);
  item.setAttribute("data-highlight", false);
  return v;
}

function comboRegisterKeyUpDownListener(comboId) {
  const comboTextField = document.getElementById(comboId);
  comboTextField.onkeydown = function (e) {
    if( e.code === 'Escape') {
      hideComboList(comboId);
    }
    if (e.code !== 'ArrowUp' && e.code !== 'ArrowDown') {
      return;
    }

    const isVisible = isComboListVisible(comboId);
    if( !isVisible) {
      comboDropDownForTags(comboTextField.id, (comboTextField.value || "").trim());
      return;
    }

    const group = document.getElementById(comboId + "_listgroup");
    const listArray = group.querySelectorAll('li ul li[data-display="true"]');
    let selectedIndex = -1;
    for( let i = 0; i < listArray.length; i++ ) {
      const highlighted = listArray[i].getAttribute("data-highlight") === 'true';
      if( highlighted ) {
        selectedIndex = i;
      }
    }
    
    const isArrowUp = e.code === 'ArrowUp';
    const oneUp = (selectedIndex <= 0 ? listArray.length - 1 : selectedIndex - 1);
    const oneDown = (selectedIndex >= listArray.length - 1 ? 0 : selectedIndex + 1);
    const newHighlight = isArrowUp ? oneUp : oneDown;

    if( !isVisible ) {
      comboDropDownForTags(comboId, document.getElementById(comboId).value);
    }
    for( let i = 0; i < listArray.length; i++ ) {
      listArray[i].setAttribute("data-highlight", i === newHighlight);
    }
  };
}