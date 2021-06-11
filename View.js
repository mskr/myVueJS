// Interface class

// Usage: new View( )
// Usage: new View( [ '<i>Child</i>', '<i>Child</i>' ] )
// Usage: new View( [ document.createElement('i'), document.createElement('i') ] )
// Usage: new View( [ new View( ), new View( ) ] )
// Usage: new View( 'fixed bottom flex' )

export default class View {
  constructor(arg) {

    this.view = document.createElement('div');

    if (Array.isArray(arg)) {

      switch (typeof arg[0]) {
        case 'string':
          this.view.innerHTML = arg.join('\n');
          break;
        case 'object':
          arg.forEach(child => 
            child.view ? this.view.appendChild(child.view) : this.view.appendChild(child));
          break;
        default:
          break;
      }

    } else if (typeof arg === 'string') {

      for (let cls in arg.split(' ')) {
        for (let prp in styles[cls]) {
          this.view.style[prp] = styles[cls][prp]; 
        }
      }

    }
  }
}

const styles = {
  flex: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    alignItems: 'center'
  },
  child: {
    flex: 'auto'
  },
  fixed: {
    position: 'fixed'
  },
  bottom: {
    bottom: '0',
    width: '100%'
  },
  left: {
    left: '0',
    height: '100%'
  },
  right: {
    right: '0',
    height: '100%'
  },
  top: {
    top: '0',
    width: '100%'
  },
  fullscreen: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    width: '100%',
    height: '100%'
  }
}