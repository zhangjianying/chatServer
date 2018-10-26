"use strict";

/**
 * 策略模式
 */
(function(global, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    global.Strategies = factory();
  }
})(window, function() {
  class Strategies {
    constructor() {
      this.collection = {};
    }

    get() {
      return this.collection;
    }

    add(name, callback) {
      this.collection[name] = callback;
    }

    execute(name, resData) {
      if (this.collection[name]) {
        this.collection[name](resData);
      }
    }
  }

  return Strategies;
});
