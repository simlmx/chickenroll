export default class Profiler {
  _start: any;
  _data: any;

  constructor() {
    this.reset();
  }

  start(name: string): void {
    this._start[name] = new Date().getTime();
  }

  stop(name: string): void {
    const delta = new Date().getTime() - this._start[name];

    if (this._data[name] == null) {
      this._data[name] = 0;
    }
    this._data[name] += delta;
  }

  stopStart(stop_name: string, start_name: string): void {
    this.stop(stop_name);
    this.start(start_name);
  }

  getData() {
    return this._data;
  }

  reset() {
    this._start = {};
    this._data = {};
  }
}
