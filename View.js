import { validate, validateURL } from '../core/validateInput.js';

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

class View extends PageLifecycle {
  
  constructor(arg) {

    super();

    if (arg instanceof Node) {
      this.view = arg;
    } else {
      this.view = document.createElement('div');
    }

    this.view.classList.add('view');

    if (Array.isArray(arg)) {

      this.children(arg);

    } else if (typeof arg === 'string') {

      // Analyze CSS selector syntax
      // Currently only dot syntax
      // E.g. "tag.class"

      const dotSyntax = arg.split('.');

      if (dotSyntax.length > 1) {
        
        this.view = document.createElement(dotSyntax[0]);
        this.css(dotSyntax.slice(1).join(' '));

      } else {

        this.css(dotSyntax.join(' '));

      }

    }

    this.i18n = {};

  }

  // Simple jQuery alternative
  
  $(selector) {
    return Array.prototype.slice.call(this.view.querySelectorAll(selector));
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
          this.view.innerHTML += child;
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

  fromJSON(json) {

    if (Array.isArray(json)) {

      // Pretty presentation

      this.children(json.map(data => '<div>' + View.choosePresentation(this.i18n[data] || data) + '</div>'));

    } else if (typeof json === 'object') {

      if (this.view.nodeName.toLowerCase() === 'form') {

        // Pretty presentation

        this.children( Object.entries(json).map(data => 
          '<label>' + View.choosePresentation(this.i18n[data[0]] || data[0]) + 
            '<input name="' + data[0] + '" value="' + View.choosePresentation(this.i18n[data[1]] || data[1]) + '" type="text">' +
          '</label>').concat([ 
          '<input type="submit">'
          ]) );

        this.view.onsubmit = event => event.preventDefault();

      } else {

        // Raw presentation

        this.children( Object.entries(json).map(data => 
          '<pre>' + data[0] + ': ' + data[1] + '</pre>') );

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

  height(arg) {
    this.view.style.height = arg;
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
    return string.substring(string.lastIndexOf('/') + 1);
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

export default View;