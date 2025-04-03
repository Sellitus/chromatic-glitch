// Base container class for inheritance
class Container {
    constructor() {
        this.children = [];
        this.addChild = jest.fn(child => {
            this.children.push(child);
            if (child.depthOfChildModified) {
                child.depthOfChildModified();
            }
        });
        this.removeChild = jest.fn();
        this.removeChildren = jest.fn();
        this.destroy = jest.fn();
        this.position = { 
            set: jest.fn(),
            copyFrom: jest.fn()
        };
        this.scale = { 
            set: jest.fn(),
            x: 1,
            y: 1
        };
        this.x = 0;
        this.y = 0;
        this.width = 800;
        this.height = 200;
        this.interactive = false;
        this.buttonMode = false;
        this.visible = true;
        this.zIndex = 0;
    }

    emit() {}
}

// Factory functions for PIXI object creation
const createMockContainer = () => new Container();

const createMockGraphics = () => {
    const graphics = new Container();
    graphics.beginFill = jest.fn().mockReturnThis();
    graphics.drawRect = jest.fn().mockReturnThis();
    graphics.endFill = jest.fn().mockReturnThis();
    graphics.lineStyle = jest.fn().mockReturnThis();
    return graphics;
};

const createMockText = (text, style) => {
    const textObj = new Container();
    textObj.text = text;
    textObj.style = style;
    textObj.anchor = { set: jest.fn() };
    return textObj;
};

// PIXI namespace mock
const PIXI = {
    Container,
    Graphics: jest.fn().mockImplementation(createMockGraphics),
    Text: jest.fn().mockImplementation(createMockText),
    Application: jest.fn().mockImplementation(() => ({
        stage: createMockContainer(),
        renderer: {
            resize: jest.fn(),
            view: {
                getContext: () => null
            }
        },
        ticker: {
            add: jest.fn(),
            destroy: jest.fn()
        },
        destroy: jest.fn()
    }))
};

// Set up inheritance
PIXI.Graphics.prototype = Object.create(Container.prototype);
PIXI.Graphics.prototype.constructor = PIXI.Graphics;

PIXI.Text.prototype = Object.create(Container.prototype);
PIXI.Text.prototype.constructor = PIXI.Text;

// Export both namespace and factory functions
module.exports = {
    PIXI,
    createMockContainer,
    createMockGraphics,
    createMockText
};
