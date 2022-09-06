"use strict";
exports.__esModule = true;
exports.Entity = void 0;
/**
 * An Entity is a reference to some item in the scene, be it a door, a wall,
 * a key or an enemy.  Anything the user might need to interact with, or cause
 * an effect in the scene is an entity.
 *
 * Usually an Entity will have a direct relation to a mesh so that it can be
 * drawn in the scene.  The mesh may be hidden in (non-edit) mode so that gizmos such
 * as sound emitters do not need to be visible all the time.
 */
var Entity = /** @class */ (function () {
    function Entity(name, componentObj, scene) {
        this.name = name;
        this.componentObj = componentObj;
        this.scene = scene;
        // systems.initEntityAll(this);
    }
    Entity.prototype.dispose = function () {
        if (this.transformNode) {
            this.transformNode.dispose();
        }
    };
    return Entity;
}());
exports.Entity = Entity;
