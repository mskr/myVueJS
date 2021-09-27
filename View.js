import { validateURL, validateSecurityXSS } from '../core/validateInput.js';

// Interface class

class PageLifecycle {

  constructor() {

  }

  async domLoaded() {

  }

  async jsLoaded() {

  }

  async cssLoaded() {

  }

  async mediaLoaded() {

  }

  async xhrLoaded() {

  }

  async init() {
    // Tasks:
    // bind event handlers to this object
    // add event handlers that are known at this stage
  }

  async update() {

  }

  async dispose() {
    // Tasks:
    // remove all event handlers, also the ones added later
  }

}

// View is an interface class and utility for dynamic CSS

// Usage: new View( ) for a div
// Usage: new View( document.getElementById('myView') ) to wrap a native DOM Node
// Usage: new View( [ '<i>Child</i>', '<i>Child</i>' ] ) to create a tree
// Usage: new View( [ new View( ), new View( ) ] )
// Usage: new View( [ document.createElement('i'), document.createElement('i') ] )
// Usage: new View( 'fixed bottom flex' )
// Usage: new View( 'fullscreen' )
// Usage: new View( 'myclass' )
// Usage: new View( { hue: 360, saturation: 100, lightness: 87.5, opacity: 0.5 } )
// Usage: myView.css({ border: '1px dashed red' })

// Create views by extending this interface.
// Those subclasses may then use models to update the view.
// Thus they may be called controllers.
// Note that you need to add view objects to the DOM yourself.
// Note that View does not care about event handling. This is done in Button.js.

class View extends PageLifecycle {
  
  constructor(arg) {

    super();

    if (arg instanceof Node) {
      this.view = arg;
    } else {
      this.view = document.createElement('div');
    }

    if (arg instanceof DocumentFragment) {
      // https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
    } else {
      this.view.classList.add('view');
    }

    if (Array.isArray(arg)) {

      this.children(arg);

    } else if (typeof arg === 'string') {

      // Analyze CSS selector syntax
      // E.g. "tag.class"
      // Currently only dot syntax

      const dotSyntax = arg.split('.');
      const gtSyntax = arg.split('>');

      if (dotSyntax.length > 1) {
        
        this.view = document.createElement(dotSyntax[0]);
        this.css(dotSyntax.slice(1).join(' '));

      } else {

        this.css(dotSyntax.join(' '));

      }

    }

    this.i18n = {};
    this.inputTypes = {};

  }

  // Simple jQuery alternative
  
  $(selector) {
    return Array.prototype.slice.call(this.view.querySelectorAll(selector));
  }

  $$(selector) {
    return this.view.querySelector(selector);
  }

  // CSS can take class string or object with styles

  css(arg) {
    if (typeof arg === 'string') {
      const cls = arg.split(' ');
      for (let i in cls) {
        this.view.classList.add(cls[i]);
      }
    } else if (typeof arg === 'object') {
      for (let i in arg) {
        this.view.style[i] = arg[i];
      }
    }
    return this;
  }

  // Add or get children

  children(arg) {

    if (!arg) {
      // Return array of children
      return Array.prototype.slice.call(this.view.children);
    }

    arg.forEach(child => {
      switch (typeof child) {

        // Add child as HTML string
        case 'string':
          if (validateSecurityXSS) {
            this.view.innerHTML += child;
          }
          break;

        // Add child as DOMNode or View object
        case 'object':

          if (child.isModal && child.isModal()) {

            document.body.appendChild(child.view);

          } else if (child.view) {

            this.view.appendChild(child.view);

          } else {

            this.view.appendChild(child);

          }

          break;

        default:
          break;

      }
    });

    return this;

  }

  // Children from JSON

  fromJSON(json, nodeFn) {

    if (Array.isArray(json)) {

      // Pretty presentation

      this.children(json.map(data => '<div title="' + data + '">' + View.choosePresentation(this.i18n[data] || data) + '</div>'));
      if (nodeFn) for (let i in json) nodeFn(this.children()[i], i, json[i]);

    } else if (typeof json === 'object') {

      if (this.view.nodeName.toLowerCase() === 'form') {

        // Pretty presentation

        this.children( Object.entries(json).map(data => 
          '<label>' + View.choosePresentation(this.i18n[data[0]] || data[0]) + 
            '<input name="' + data[0] + '" value="' + data[1] + '"' +
            ' type="' + (this.inputTypes[data[0]] || 'text') + '">' +
          '</label>').concat([ 
          '<input type="submit">'
        ]) );

        this.view.onsubmit = event => event.preventDefault();

      } else {

        // Raw presentation

        const ent = Object.entries(json);
        this.children( ent.map(data => '<div><pre style="display:inline">' + data[0] + ': </pre><pre style="display:inline">' + data[1] + '</pre></div>') );
        if (nodeFn) for (let i in ent) nodeFn(this.children()[i], ent[i][0], ent[i][1]);

      }

    } else {

      // Raw presentation

      this.children(['<pre>' + JSON.stringify(json, null, 4) + '</pre>']);

    }

    return this;

  }

  // Set a dictionary to translate content

  setInternationalDictionary(dict) {
    this.i18n = dict || {};
    return this;
  }

  //

  setInputTypes(dict) {
    this.inputTypes = dict;
    return this;
  }

  // Color can take CSS color strings or HSL objects like:
  // { hue: 0..360, saturation: 0..100, lightness: 0..100, opacity: 0..1 }

  color(background, foreground) {

    if (typeof background === 'string') {

      this.view.style.background = background;

    } else if (background) {

      let h = 360, s = 100, l = 50, a = 1;
      if (background.hue) h = Number.parseFloat(background.hue);
      if (background.saturation) s = Number.parseFloat(background.saturation);
      if (background.lightness) l = Number.parseFloat(background.lightness);
      if (!isNaN(Number(background.opacity))) a = Number.parseFloat(background.opacity);
      this.view.style.background = 'hsl(' + h + ',' + s + '%,' + l + '%)';
      this.view.style.opacity = a;

    }

    if (typeof foreground === 'string') {

      this.view.style.color = foreground;

    } else if (foreground) {

      let h = 360, s = 100, l = 50;
      if (foreground.hue) h = Number.parseFloat(foreground.hue);
      if (foreground.saturation) s = Number.parseFloat(foreground.saturation);
      if (foreground.lightness) l = Number.parseFloat(foreground.lightness);
      this.view.style.color = 'hsl(' + h + ',' + s + '%,' + l + '%)';

    }

    return this;

  }

  // Remove child at front

  shift() {
    this.view.removeChild(this.view.firstChild);
    return this;
  }

  // Add child at front

  unshift(arg) {
    if (Array.isArray(arg)) {
      this.view.insertBefore(new View(arg).view, this.view.firstChild);
    } else {
      this.view.insertBefore(arg.view ? arg.view : arg, this.view.firstChild);
    }
    return this;
  }

  // Add child at back

  push(arg) {
    if (Array.isArray(arg)) {
      this.view.appendChild(new View(arg).view);
    } else {
      this.view.appendChild(arg.view ? arg.view : arg);
    }
    return this;
  }

  // Remove child at back

  pop() {
    this.view.removeChild(this.view.lastChild);
    return this;
  }

  // Set CSS width

  width(arg) {
    this.view.style.width = arg;
    return this;
  }

  // Set CSS height

  height(arg, padding, margin, border, outline) {
    this.view.style.height = arg;
    if (typeof padding === 'object') {
      if (padding.left) this.view.style.paddingLeft = padding.left;
      if (padding.right) this.view.style.paddingRight = padding.right;
      if (padding.top) this.view.style.paddingTop = padding.top;
      if (padding.bottom) this.view.style.paddingBottom = padding.bottom;
    }
    if (typeof margin === 'object') {
      //...
    }
    return this;
  }

  // Set font

  font(font) {
    this.view.style.font = font;
    return this;
  }

  // Modal overrides this

  isModal() {
    return false;
  }

  //

  hasFocus() {
    return document.hasFocus() && this.view.contains(document.activeElement);
  }

}

//

View.hash = function() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

//

View.choosePresentation = function(data) {
  const string = data.toString();
  if (validateURL(string)) {
    const url = string;
    const qmarkIndex = url.indexOf('?');
    if (qmarkIndex > 0) url = url.substring(0, qmarkIndex);
    const dotIndex = url.lastIndexOf('.');
    const slashIndex = url.lastIndexOf('/');
    const slashIndex2 = url.substring(0, slashIndex).lastIndexOf('/');
    if (dotIndex > slashIndex) return url.substring(slashIndex + 1);
    else if (slashIndex === url.length - 1) return url.substring(slashIndex2 + 1, slashIndex);
    else return url.substring(slashIndex);
  }
  return string;
}

//

View.getAllRulesRecursive = function(styleSheet) {
  let rules = [];
  for (let i = 0; i < styleSheet.rules.length; i++) {
    if (styleSheet.rules.item(i) instanceof CSSImportRule) {
      View.getAllRulesRecursive(styleSheet.rules.item(i).styleSheet).forEach(r => rules.push(r));
    } else {
      rules.push(styleSheet.rules.item(i));
    }
  }
  return rules;
}

//

View.getAllRules = function() {
  let rules = [];
  for (let i = 0; i < document.styleSheets.length; i++) {
    View.getAllRulesRecursive(document.styleSheets.item(i)).forEach(r => rules.push(r));
  }
  return rules;
}

//

View.validateSecurityXSS = validateSecurityXSS;
View.validateURL = validateURL;

//

export default View;

//Todo:
// Expose new and cool CSS features
// Scroll behavior: https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior
// Pointer events: https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
