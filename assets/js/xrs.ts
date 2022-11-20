interface ISystem {
  name: string;
  init: (xrs: XRS) => void;
  buildComponent: () => IComponent;
}

interface IComponent {
  add: (target: Entity) => void;
  update: (data: any) => void;
  remove: () => void;
}

export class XRS {
  public systems: ISystem[] = [];
  public entities: Record<string, Entity> = {};
  constructor() {}
  registerSystem(sys: ISystem) {
    sys.init(this);
    this.systems.push(sys);
  }
  getSystem(name: string) {
    const result = this.systems.filter((sys) => sys.name === name);
    if (result.length > 0) {
      return result[0];
    }
  }
  createEntity(name: string) {
    const entity = new Entity(name, this);
    this.entities[name] = entity;
    return entity;
  }
  getEntity(name: string) {
    return this.entities[name];
  }
  deleteEntity(name: string) {
    const entity = this.getEntity(name);
    if (entity) {
      entity.dispose();
      delete this.entities[name];
    }
  }
}

export class Entity {
  constructor(public name: string, public xrs: XRS) {}
  components: Record<string, IComponent> = {};
  addComponent(componentName: string, componentData) {
    const system = this.xrs.getSystem(componentName);
    if (system) {
      const component = system.buildComponent();
      this.components[componentName] = component;
      component.add(this);
      component.update(componentData);
    } else {
      console.error("Unregistered System", componentName);
    }
  }
  updateComponent(componentName: string, componentData) {
    const component = this.components[componentName];
    if (component) {
      component.update(componentData);
    }
  }
  removeComponent(componentName: string) {
    const component = this.components[componentName];
    if (component) {
      component.remove();
    }
    delete this.components[componentName];
  }
  dispose() {
    Object.keys(this.components).forEach((componentName) =>
      this.removeComponent(componentName)
    );
  }
}
