import View from './View.js';

// Reusable UI components

// This file is a little dynamic reactive UI library based on HTML.
// Except for the View dependency it should be self contained.
// Other design goals
// - optimization for Fitt's law
// - representation of user flow in code
// - encourage user-initiated code changes (self-modifying software)

// Button represents a pair of label and function.
// Events:
// click: Trigger function with event parameter.

export class Button extends View {

  constructor(label, fn) {

    super([ '<button>' + View.choosePresentation(label) + '</button>' ]);
    this.label = label;

    if (fn) {
      this.fn = fn;
      this.fn = this.fn.bind(this);
      this.children()[0].addEventListener('click', this.fn);
      this.children()[0].style.cursor = 'pointer';
    }
  }

  // User-flow-oriented click function

  click(text1, text2, fn) {
    const f = async event => {
      this.children()[0].removeEventListener('click', f);
      this.children()[0].style.cursor = 'default';
      this.children()[0].disabled = true;
      this.children()[0].textContent = text1;
      try {
        await fn(event);
        this.children()[0].textContent = text2;
      } catch (e) {
        console.error(e);
        const error = typeof e === 'string' ? e : 'Error';
        this.children()[0].textContent = error;
      } finally {
        setTimeout(() => {
          this.children()[0].addEventListener('click', f);
          this.children()[0].style.cursor = 'pointer';
          this.children()[0].disabled = false;
          this.children()[0].textContent = View.choosePresentation(this.label);
        }, 500);
      }
    }
    this.children()[0].addEventListener('click', f);
    this.children()[0].style.cursor = 'pointer';
    return this;
  }

}

// Toggle is like a button but saves its state in a checkbox.
// Events:
// click: Trigger function with boolean parameter.

export class Toggle extends View {

  constructor(label, fn) {

    const a = label.substring(0, 3) === '[x]';
    if (a) label = label.substring(3).trim();

    super([
      '<label>' +
      '<input type="checkbox"' +
      ' name="' + label + '"' + (a ? ' checked>' : '>') +
      '<span>' + label + '  </span>' +
      '</label>'
    ]);


    if (fn) {
      this.fn = fn;
      this.fn = this.fn.bind(this);
      const input = this.view.querySelector('input');
      input.addEventListener( 'click', event => this.fn(Boolean(input.checked)) );
      this.children()[0].style.cursor = 'pointer';
    }
      
  }

}

// Link is like a button but represents a way to get to another place in the web.
// It has an URL that can be absolute or relative (see docs of href).
// Events:
// click: Prevents reload of page.

export class Link extends View {
  constructor(name, urlOrParams, fn) {
    let url = urlOrParams;
    if (typeof urlOrParams === 'object') {
      const search = new URLSearchParams(window.location.search);
      for (let k in urlOrParams) search.set(k, urlOrParams[k]);
      url = '?' + search.toString();
    }
    super([ '<a target="_blank" href="' + url + '">' + View.choosePresentation(name) + '</a>' ]);
    this.children()[0].addEventListener('click', event => {
      if (fn) {
        event.preventDefault();
        fn(url);
      }
    });
  }
}

// Slider represents a pair of number and range. Number is kept by reference, not value.
// Events:
// input: Triggers continuously while dragging and updates the number value.

export class Slider extends View {
  constructor(name, reference, fn) {
    super([
      '<label>' +
      '<div>' + name + '  </div>' +
      '<input type="range"' +
      ' min="' + reference.min + '" max="' + reference.max + '"' +
      ' step="' + (reference.max - reference.min) / 1000 + '"' +
      ' name="' + name + '"' +
      ' value="' + reference.value + '">' +
      '</label>'
    ]);
    if (fn) {
      this.$$('input').addEventListener('input', event => fn(Number(event.target.value)));
      fn(reference.value);
    }
  }
}

// Textfield is for a small piece of editable text.
// It can also send data to the current URL via native form submit (enter press).
// Todo: submit on enter or tab press.
// Events:
// input: Triggers for every entered character
// change: Triggers only for commited changes
// submit: Triggers on enter press
export class Textfield extends View {
  constructor(text, fn, changeFn, inputFn) {
    super(document.createElement('form'));
    this.css({ display: 'inline' });
    this.children(['<input type="text" value="' + text + '" name="' + text + '">']);
    if (fn) {
      const i = this.$$('input');
      this.view.addEventListener('submit', event => {
        fn(i.value);
        event.preventDefault();
      });
      if (changeFn) {
        i.addEventListener('change', () => changeFn(i.value));
        if (inputFn) i.addEventListener('input', () => inputFn(i.value));
      }
    }
  }
}

// Modal is a screenfilling window with custom content.
// Events:
// pointerdown: Stop propagation so that nothing can trigger anywhere else.
// pointerup: Stop propagation so that nothing can trigger anywhere else.
// touchstart: Stop propagation so that nothing can trigger anywhere else.
// touchend: Stop propagation so that nothing can trigger anywhere else.
// touchmove: Stop propagation so that nothing can trigger anywhere else.

export class Modal extends View {

  constructor(content) {

    const id = View.hash();

    super([
      '<input type="checkbox" id="' + id + '" class="editor-modal-checkbox">',
      '<label for="' + id + '" class="editor-modal-backdrop"></label>',
      '<div class="editor-modal-content">' +
        '<label for="' + id + '" class="editor-modal-header"></label>' +
      '</div>'
    ]);

    this.id = id;
    this.css('editor-modal-container');
    this.content = content;
    
    for (let i in content) {
      this.view.children[2].appendChild(content[i].view ? content[i].view : content[i]);
    }

    this.view.addEventListener('pointerdown', event => event.stopPropagation());
    this.view.addEventListener('pointerup', event => event.stopPropagation());
    this.view.addEventListener('touchstart', event => event.stopPropagation(), { passive: false } );
    this.view.addEventListener('touchend', event => event.stopPropagation() );
    this.view.addEventListener('touchmove', event => event.stopPropagation(), { passive: false } );

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.toggle = this.toggle.bind(this);

  }

  isModal() {
    return true;
  }

  isOpen() {
    return this.view.children[0].checked;
  }

  // Open returns promise that resolves on close to concisely represent user flows

  open() {
    this.view.children[0].checked = true;
    return new Promise(resolve => {
      const f = event => {
        resolve();
        this.view.children[0].removeEventListener('change', f);
      }
      this.view.children[0].addEventListener('change', f);
    });
  }

  close() {
    this.view.children[0].checked = false;
  }

  toggle() {
    const box = this.view.children[0];
    box.checked = !box.checked;
  }

  setContent(content) {

    while (this.view.children[2].children.length > 1) {
      this.view.children[2].removeChild(this.view.children[2].lastChild);
    }

    this.content = content;

    for (let i in content) {
      const c = content[i].view ? content[i].view : content[i];
      this.view.children[2].appendChild(c);
    }

    return this;

  }

}

// Dropdown is a radio-button group in a modal.
// It includes a button to open the modal.
// Events:
// click: Trigger function with value of the radio button as parameter.
// see Modal

export class Dropdown extends View {

  constructor(label = 'Dropdown', list, fn) {

    const modal = new Modal( list.map( v => new View([
      '<input type="radio" id="' + v + '" name="' + label + '" value="' + v + '">' +
      '<label for="' + v + '">' +
      '<span>' + View.choosePresentation(v) + '</span>' +
      '</label>'
    ]).css('option').view ) );

    label = label.toString();

    //

    //Fixme: Modal ends up as global node, not a child.
    // We can't clean it up without keeping a reference.
    // Don't place this burden on users of Dropdown:
    // Handle this inside View base class (e.g. with mutation observers) or
    // even better, add/remove Modal from DOM on open/close, so that
    // Views can spread out while used and don't create pollution while not.
    super([new Button(label, modal.toggle), modal]);

    //

    modal.$('.option input').forEach(e => e.checked = e.value === label);

    modal.view.classList.add('dropdown');

    if (fn) {
      modal.content.forEach(label => 
        label.querySelector('input').addEventListener( 'click', event => {

          fn(event.target.value);
          this.setLabel(event.target.value);
          modal.toggle();

      }));
    }

  }

  setLabel(label) {
    this.$('button')[0].textContent = View.choosePresentation(label);
  }

}

// Tooltip gives contextual hints for another view.
// Events:
// pointerenter: Check if window is focussed and if so show tooltip.
// pointerleave: Hide tooltip.

export class Tooltip extends View {

  constructor(view) {

    super();

    this.font('menu');

    this.children([
      new View('strong.title'),
      new View('em.description'),
      new View('span.detail'),
      new View('span.detail'),
      new View('span.detail')
    ]);

    this.color('black', 'white');
    this.css('tooltip');
    this.css({ width: '200px' });

    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);

    view.addEventListener('pointerenter', _ => {
      if (document.hasFocus()) {
        this.show();
      }
    });

    view.addEventListener('pointerleave', _ => {
      if (document.hasFocus()) {
        this.hide();
      }
    });

    this.hide();
    
  }

  title(text) {
    if (typeof text === 'undefined') return this.view.children[0].textContent;
    this.view.children[0].textContent = text;
    this.view.children[1].textContent = ' ';
    this.view.children[2].textContent = ' ';
    this.view.children[3].textContent = ' ';
    this.view.children[4].textContent = ' ';
    return this;
  }

  description(text) {
    if (typeof text === 'undefined') return this.view.children[1].textContent;
    this.view.children[1].textContent = text;
    return this;
  }

  detail(i, text) {
    if (typeof text === 'undefined') return this.view.children[2 + i].textContent;
    this.view.children[2 + i].textContent = text;
    return this;
  }

  update(event) {
    const calcX = (event.clientX - 20) + 'px - ' + this.view.style.width
    this.view.style.left = 'calc(' + calcX + ')';
    this.view.style.top = event.clientY + 'px';
    window.clearTimeout(this.timeoutID);
    this.timeoutID = window.setTimeout(this.hide, 5000);
    return this;
  }

  show() {
    this.view.style.transform = 'translateX(0)';
    this.view.style.opacity = 1;
    return this;
  }

  hide() {
    this.view.style.transform = 'translateX(-50px)';
    this.view.style.opacity = 0;
    return this;
  }

}

// Viewport overlay enables interaction for a WebGL viewport. 

export class ViewportOverlay extends View {
  constructor(type) {
    switch (type) {
      case 'none':
      super('div.viewport-overlay-none');
      this.css({ 'pointer-events': 'none', 'display': 'none' });
      break;
      case 'events-only':
      super('div.viewport-overlay-events-only');
      this.css({ 'background-color': 'transparent' });
      break;
      case 'color-only':
      super('div.viewport-overlay-color-only');
      this.css({ 'pointer-events': 'none', 'opacity': '1' });
      break;
      case 'text-only':
      super('div.viewport-overlay-events-only');
      this.css({ 'pointer-events': 'none', 'background-color': 'transparent' });
      break;
      case 'full':
      super('div.viewport-overlay-full');
      this.css({ 'opacity': '1' });
      break;
      default:
      super('div.viewport-overlay-default');
    }
    this.css({ 'position': 'fixed' });
    document.body.appendChild(this.view);
  }
}

// Browser is a UI for hierarchical data.
// It uses textfields (see above) to edit leaf pieces of the data.
// Events:
// click: show children of clicked item.

export class Browser extends View {

  constructor(json, fn) {
    const a = new View();
    const b = new View();
    super([a, b]);
    this.json = json;
    this.fn = fn;
    this.css({ display: 'flex' });
    a.css({ flexDirection:'column', marginRight: '1em' });
    a.fromJSON(json, (c, k, v) => {
      if (typeof fn === 'function') {
        c.style.cursor = 'pointer';
        c.addEventListener( 'click', (v => event => this.fn(v))(v) );
      } else {
        if (typeof v === 'object') {
          c.style.cursor = 'pointer';
          c.addEventListener( 'click', (v => event => this.deeper(new Browser(v)))(v) );
        } else {
          c.lastChild.addEventListener( 'click', (v => event => event.target.replaceWith(new Textfield(v, v => this.refresh(k, v)).view))(v) );
        }
      }
    }).children().forEach(c => c.style.paddingBottom = '.5em');
  }

  deeper(ui) {
    this.children()[1].replaceWith(ui.view);
  }

  refresh(k, v) {
    if (typeof k !== 'undefined') this.json[k] = v;
    this.view.replaceWith(new Browser(this.json, this.fn).view);
  }

  async fromURL(url) {
    this.json = await (await fetch(url)).json();
    return this;
  }

}

// ScrollContainer enables advanced scroll interactions.
// It provides scroll callbacks and can execute a render function.
// Todo: Determine if the domElement is causing overflow or containing it.
// Assume that it is causing overflow, for now.
// Assume a single global scrollbar.
// Events:
// scroll: Call and await user functions, check if first visible element changed

export class ScrollContainer extends View {
  constructor(domElement = document.body) {
    super(domElement);
    this.css({ flexDirection: 'column' });
    this.functions = [];
    this.renderFunction = y => console.log('no render function');
    this.currentElementFunctions = [];
    this.currentElement = undefined;
    this.currentIndex = 0;
    this.currentElementViewStartTime = Date.now();
    this.clear = this.clear.bind(this);
    this.reset = this.reset.bind(this);
    this.clear();
    document.addEventListener('scroll', event => {
      this.lastKnownScrollPosition = window.scrollY;
      if (!this.hot) {
        this.hot = true;
        Promise.all(this.functions.map(f => f(this.lastKnownScrollPosition)))
        .then(() => this.renderFunction(this.lastKnownScrollPosition))
        .then(() => this.hot = false);
      }
      if (!this.warm) {
        this.warm = true;
        setTimeout(() => {
          const els = this.inView();
          const newIndex = Number(els[0] ? els[0].id : 0);
          if (newIndex !== this.currentIndex) {
            const opaqueEl = els.filter(e => Number(e.style.opacity) !== 0)[0];
            const newElement = opaqueEl !== this.currentElement ? opaqueEl : undefined;
            const t = Date.now();
            this.currentElementFunctions.forEach(f => f(newElement, newIndex, this.view.children.length, this.currentElement, this.currentIndex, t - this.currentElementViewStartTime));
            this.currentElement = newElement;
            this.currentIndex = newIndex;
            this.currentElementViewStartTime = t;
          }
          this.warm = false;
        }, 200);
      }
    });
    this.template = null;
  }
  fill(dataSOA) {
    if (this.template === null) return;
    let length = 0;
    for (let k in dataSOA) {
      if (length > 0) console.assert(length === dataSOA[k].length);
      length = dataSOA[k].length;
      console.assert(length > 0, 'Please pass data as struct of arrays (SOA)');
    }
    const nodes = [];
    for (let i = 0; i < length; i++) {
      const clone = this.template.cloneNode(true);
      clone.id = i;
      clone.style.display = null;
      for (let k in dataSOA) {
        if (typeof clone.style[k] !== 'undefined') {
          clone.style[k] = dataSOA[k][i];
        }
        const slot = clone.querySelector('.' + k);
        const toggle = clone.querySelector('.' + k + '-toggle');
        let remove = false;
        if (slot) {
          const mediaSource = slot.querySelector('source');
          if (mediaSource) {
            if (View.validateURL(dataSOA[k][i])) mediaSource.src = dataSOA[k][i];
            else remove = true;
          } else {
            if (!!String(dataSOA[k][i]) && View.validateSecurityXSS(dataSOA[k][i])) slot.innerHTML = dataSOA[k][i];
            else remove = true;
          }
        }
        if (remove) {
          slot.parentElement.removeChild(slot);
          if (toggle) toggle.parentElement.removeChild(toggle);
        }
      }
      nodes.push(clone);
    }
    this.replace(nodes);
  }
  clear() {
    while (this.view.lastChild) this.view.removeChild(this.view.lastChild);
    if (this.currentElement !== null) {
      this.currentElementFunctions.forEach(f => f(null));
      this.currentElement = null;
    }
    this.yMax = 0;
  }
  reset() {
    this.clear();
  }
  inView() {
    return this.children().filter(c => {
      const a = c.getBoundingClientRect();
      return a.y < window.innerHeight && a.y > 0;
    });
  }
  disableUntil(promise, keepstate) {
    return new Promise(resolve => {
      this.disabled = true;
      document.body.style.overflow = 'hidden';
      if (!keepstate) document.documentElement.style.overflow = 'hidden';
      promise.finally( () => {
        document.body.style.overflow = null; // Clearing the property
        // prevents Chrome from scrolling to top after leaving fullscreen video.
        document.documentElement.style.overflow = null;
        this.disabled = false;
        resolve();
      });
    });
  }
}

// Shortcut is a button with keyboard shortcut
// Events:
// click:
// keydown:
// keyup:
export class Shortcut extends View {
  constructor(key, fnOrDescription) {
    super([ '<span>' + key.toUpperCase() + '</span>' ]);
    this.css({
      border: '2px solid rgba(0,0,0,.5)',
      borderRadius: '8px',
      padding: '.5em 1em'
    });

    if (typeof fnOrDescription === 'string') {
      this.view.title = fnOrDescription;
    }

    if (typeof fnOrDescription === 'function') {
      this.fn = fnOrDescription;
      this.fn = this.fn.bind(this);
      this.children()[0].addEventListener('click', this.fn);
      this.children()[0].style.cursor = 'pointer';
    }

    document.addEventListener('keydown', event => {
      if (event.key === key) {
        this.css({ background: 'rgba(0,0,0,.5)' });
      }
    });

    document.addEventListener('keyup', event => {
      if (event.key === key) {
        this.css({ background: null });
      }
    });
  }
}

// Text is just a text.

export class Text extends View {
  constructor(text) {
    super();
    this.view.textContent = text;
    this.css({
      flexDirection: 'column',
      justifyContent: 'center'
    });
  }
}

// Contextmenu is a transient menu overlaying another view in the moment where the user has the exploration mindset.
// Events:
// contextmenu: Triggers the menu, on right click or long press.

export class Contextmenu extends View {

  constructor() {

  }

  fromButton(button) {

  }

}

// Progressbar represents a background task.
// Events:
// load: Changes the percentual length of the progressbar.

export class Progressbar extends View {

  constructor(total) {

  }

  update(loaded) {

  }

  // ThreeJS loader to progressbar

  fromLoader(loader) {

  }

}

// Hero is like a modal that moves and guides user focus.
// Events:
// pointermove: Trigger animation of the hero element.

export class Hero extends View {

  constructor() {

  }

  // Transfer content from modal to hero

  fromModal(modal) {
    
  }

}

// Drawer is like a modal that can dynamically slide in and out from any screen edge.
// Note that this drawer cannot be half open, because a compact and expanded state are enough.
// Events:
// pointermove: Trigger slide in or out of drawer based on distance.
// click: Slide in or out.

export class Drawer extends View {

  constructor() {

  }

  // Transfer content from modal to drawer

  fromModal(modal) {
    
  }

}

// Sidebar is a fixed view at the left or right screen edge.
// Events:
// see Modal

export class Sidebar extends View {

  constructor() {

  }

  // Transfer content from modal to sidebar

  fromModal(modal) {

  }

  // Make a drawer fixed to one side

  fromDrawer(drawer) {
    
  }

}

// Highlight is like a modal but shows underlying UI through a "hole" in the backdrop.
// Events:
// see Modal

export class Highlight extends View {

  constructor() {

  }

}

// Callout is the same as highlight, allowing other UI to announce something.
// The announcement should be contextual and of temporary high relevance.
// Events:
// see Modal

export class Callout extends View {

  constructor() {

  }

}

// Long term:

// Make it easier for non-coders to make changes.
// Make code part of the user interface.
// Display link to location of the button function.

// Generate Readme.md with docs from comments.
// Write package.json.
// Publish on npm.
