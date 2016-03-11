"use strict";
var mobx_1 = require('mobx');
var nextComputationId = 0;
var currentComputation = null;
var _computations = {};
var active = true;
var Dependency = (function () {
    function Dependency() {
        this._dependentsById = {};
        this.atom = new mobx_1.Atom('Tracker');
    }
    Dependency.prototype.changed = function () {
        this.atom.reportChanged();
    };
    Dependency.prototype.depend = function (computation) {
        var _this = this;
        if (!computation) {
            if (!exports.Tracker.active)
                return false;
            computation = exports.Tracker.currentComputation;
        }
        var id = computation._id;
        if (!(id in this._dependentsById)) {
            this._dependentsById[id] = computation;
            computation.onInvalidate(function () {
                delete _this._dependentsById[id];
            });
            return true;
        }
        return false;
    };
    Dependency.prototype.hasDependents = function () {
        return true;
    };
    return Dependency;
}());
var Computation = (function () {
    function Computation() {
        this.firstRun = true;
        this._id = nextComputationId++;
        _computations[this._id] = this;
    }
    Computation.prototype.onInvalidate = function (callback) {
    };
    return Computation;
}());
function autorun() {
}
exports.Tracker = {
    Dependency: Dependency,
    Computation: Computation,
    autorun: autorun,
    currentComputation: currentComputation,
    active: active
};
