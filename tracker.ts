import { Atom } from 'mobx';

let nextComputationId = 0;
let currentComputation = null;
let _computations = {};
let active = true;

class Dependency {
  private atom: Atom;
  private _dependentsById: {[id: string]: Computation} = {};

  constructor() {
    this.atom = new Atom('Tracker');
  }

  changed(): void {
    this.atom.reportChanged();
  }

  depend(computation?: Computation): boolean {
    if (! computation) {
      if (! Tracker.active)
        return false;

      computation = Tracker.currentComputation;
    }
    var id = computation._id;
    if (! (id in this._dependentsById)) {
      this._dependentsById[id] = computation;
      computation.onInvalidate(() => {
        delete this._dependentsById[id];
      });
      return true;
    }
    return false;
  }

  hasDependents(): boolean {
    return true;
  }
}

class Computation {
  stopped: boolean;
  firstRun: boolean = true;
  _id: number;

  constructor() {
    this._id = nextComputationId++;
    _computations[this._id] = this;
  }

  onInvalidate(callback: (computation?: Computation) => void) {

  }
}

function autorun() {

}

export const Tracker = {
  Dependency,
  Computation,
  autorun,
  currentComputation,
  active
};
