# myVueJS

Build UI in JavaScript, see it in HTML directly, no virtual DOM involved.

```
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
```
