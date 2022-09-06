"use strict";
exports.__esModule = true;
exports.createContext = void 0;
var typed_rx_emitter_1 = require("typed-rx-emitter");
var createContext = function () {
    return {
        my_member_id: null,
        scene: null,
        signalHub: {
            local: new typed_rx_emitter_1.Emitter(),
            incoming: new typed_rx_emitter_1.Emitter(),
            outgoing: new typed_rx_emitter_1.Emitter(),
            menu: new typed_rx_emitter_1.Emitter(),
            movement: new typed_rx_emitter_1.Emitter()
        }
    };
};
exports.createContext = createContext;
