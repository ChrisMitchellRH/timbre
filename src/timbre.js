/**
 *  timbre / JavaScript Library for Objective Sound Programming
 */
"use strict";

// __BEGIN__

var timbre = function() {
    return timbre.fn.init.apply(timbre, arguments);
};
timbre.VERSION    = "${VERSION}";
timbre.BUILD      = "${DATE}";
timbre.env        = "";
timbre.platform   = "";
timbre.samplerate = 0;
timbre.channels   = 2;
timbre.cellsize   = 128;
timbre.streamsize = 1024;
timbre.dacs       = [];
timbre.timers     = [];
timbre.listeners  = [];
timbre.sys        = null;
timbre.context    = {};
timbre._ = { ev:{}, amp:0.8,
             autorun:true, verbose:true, workerpath:"",
             none: new Float32Array(timbre.cellsize) };

Object.defineProperty(timbre, "amp", {
    set: function(value) {
        if (typeof value === "number") {
            timbre._.amp = value;
        }
    },
    get: function() { return timbre._.amp; }
});
Object.defineProperty(timbre, "autorun", {
    set: function(value) {
        timbre._.autorun = !!value;
    },
    get: function() { return timbre._.autorun; }
});
Object.defineProperty(timbre, "workerpath", {
    set: function(value) {
        if (typeof value === "string") {
            timbre._.workerpath = value;
        }
    },
    get: function() { return timbre._.workerpath; }
});
Object.defineProperty(timbre, "verbose", {
    set: function(value) {
        timbre._.verbose = !!value;
    },
    get: function() { return timbre._.verbose; }
});
Object.defineProperty(timbre, "isOn", {
    get: function() { return timbre.sys._.ison; }
});
Object.defineProperty(timbre, "isOff", {
    get: function() { return !timbre.sys._.ison; }
});

timbre.setup = function(params) {
    var samplerate, channels, cellsize, streamsize;
    
    if (!Object.isFrozen(timbre)) {
        params = params || {};
        if (typeof params.samplerate === "number") {
            timbre.samplerate = params.samplerate;
        }
        if (typeof params.channels === "number") {
            timbre.channels = params.channels;
        }
        if (typeof params.cellsize === "number") {
            timbre.cellsize = params.cellsize;
        }
        if (typeof params.streamsize === "number") {
            timbre.cellsize = params.streamsize;
        }
        timbre.sys.setup();
        Object.freeze(timbre);
    }
};

timbre.on = function() {
    if (!timbre.sys._.ison) {
        timbre.setup();
        timbre.sys.on();
        timbre.fn.do_event(this, "on");
    }
    return timbre;
};

timbre.off = function() {
    if (timbre.sys._.ison) {
        timbre.sys.off();
        timbre.fn.do_event(this, "off");
    }
    return timbre;
};

timbre.addEventListener = function(name, func) {
    var list, rm, i;
    if (typeof func === "function") {
        if (name[0] === "~") {
            name = name.substr(1);
            func.rm = true;
        }
        list = this._.ev[name];
        if (list === undefined) {
            this._.ev[name] = list = [];
        }
        if ((i = list.indexOf(func)) === -1) {
            list.push(func);
        }
    }
    return this;
};
timbre.removeEventListener = function(name, func) {
    var list, i;
    if (typeof name === "string" && name !== "") {
        list = this._.ev[name];
        if (list !== undefined) {
            if ((i = list.indexOf(func)) !== -1) {
                list.splice(i, 1);
            }
        }
    }
    return this;
};
timbre.removeAllEventListeners = function(name) {
    if (typeof name === "string" && name !== "") {
        delete this._.ev[name];
        delete this["on" + name];
    }
    return this;
};


(function() {
    var append = function() {
        var args, p, b, i, imax;
        args = timbre.fn.valist(arguments);
        for (i = 0, imax = args.length, b = false; i < imax; ++i) {
            p = Object.getPrototypeOf(args[i]);
            if (p._.type === this.type) {
                if (this.indexOf(args[i]) === -1) {
                    this.push(args[i]);
                    b = true;
                }
            }
        }
        if ( b && timbre._.autorun && this !== timbre.listeners ) timbre.on();
        return this;
    };
    var remove = function() {
        var i, j;
        for (i = arguments.length; i--; ) {
            if ((j = this.indexOf(arguments[i])) !== -1) {
                this.splice(j, 1);
            }
        }
        if ( timbre._.autorun &&
             timbre.dacs.length   === 0 &&
             timbre.timers.length === 0 ) timbre.off();
        return this;
    };
    var removeAll = function() {
        while (this.length > 0) this.pop();
        if ( timbre._.autorun &&
             timbre.dacs.length   === 0 &&
             timbre.timers.length === 0 ) timbre.off();
        return this;
    };
    
    var i, x;
    for (i = arguments.length; i--; ) {
        x = arguments[i];
        x.append    = append;
        x.remove    = remove;
        x.removeAll = removeAll;
    }
}(timbre.dacs, timbre.timers, timbre.listeners));

timbre.dacs.type      = 1;
timbre.timers.type    = 2;
timbre.listeners.type = 3;

// __END__
global.T = global.timbre = timbre;
module.exports = timbre;

require("./core/soundsystem");
require("./core/fn");
require("./timbre/number");
require("./timbre/boolean");
require("./timbre/array");
require("./timbre/function");

// setting for tests
timbre.samplerate = 1000;
timbre.streamsize =   32;
timbre.cellsize   =    8;

var should = require("should");
global.object_test = function(klass) {
    var klassname = klass.prototype._.klassname;
    var args = Array.prototype.slice.call(arguments, 1);
    describe("timbre(" + klassname + ")", function() {
        it("should return new instance", function() {
            var instance = timbre.apply(null, args);
            should.exist(instance);
            instance.should.be.an.instanceOf(klass);
        });
    });
    describe("#args", function() {
        it("should be an instance of Array", function() {
            var instance = timbre.apply(null, args);
            instance.args.should.be.an.instanceOf(Array);
        });
    });
    describe("#cell", function() {
        it("should be an Float32Array(timbre.cellsize)", function() {
            var instance = timbre.apply(null, args);
            instance.cell.should.be.an.instanceOf(Float32Array);
            instance.cell.should.have.length(timbre.cellsize);
        });
    });
    describe("#seq()", function() {
        it("should return Float32Array(timbre.cellsize)", function() {
            var instance = timbre.apply(null, args), _;
            instance.seq.should.be.an.instanceOf(Function);
            _ = instance.seq(0);
            _.should.be.an.instanceOf(Float32Array);
            _.should.have.length(timbre.cellsize);
        });
    });
    describe("#on()", function() {
        it("should return self", function() {
            var instance = timbre.apply(null, args);
            instance.on.should.be.an.instanceOf(Function);
            instance.on().should.equal(instance);
        });
        it("should call 'on' event", function(done) {
            var instance = timbre.apply(null, args);
            instance.addEventListener("on", done);
            instance.on();
        });
    });
    describe("#off()", function() {
        it("should return self", function() {
            var instance = timbre.apply(null, args);
            instance.off.should.be.an.instanceOf(Function);
            instance.off().should.equal(instance);
        });
        it("should call 'off' event", function(done) {
            var instance = timbre.apply(null, args);
            instance.addEventListener("off", done);
            instance.off();
        });
    });
    describe("#play()", function() {
        it("should return self", function() {
            var instance = timbre.apply(null, args);
            instance.play.should.be.an.instanceOf(Function);
            instance.play().should.equal(instance);
        });
    });
    describe("#pause()", function() {
        it("should return self", function() {
            var instance = timbre.apply(null, args);
            instance.pause.should.be.an.instanceOf(Function);
            instance.pause().should.equal(instance);
        });
    });
    describe("#bang()", function() {
        it("should return self", function() {
            var instance = timbre.apply(null, args);
            instance.bang.should.be.an.instanceOf(Function);
            instance.bang().should.equal(instance);
        });
        it("should call 'bang' event", function(done) {
            var instance = timbre.apply(null, args);
            instance.addEventListener("bang", done);
            instance.on().bang();
        });
    });
    describe("#clone()", function() {
        it("should return an instance of a same class", function() {
            var instance = timbre.apply(null, args), _;
            instance.clone.should.be.an.instanceOf(Function);
            _ = instance.clone();
            instance.should.be.an.instanceOf(klass);
        });
    });
};

if (module.parent && !module.parent.parent) {
    describe("Through out", function() {
        var instance = timbre();
        instance.should.equal(timbre(instance));
    });
    describe("EventListener", function() {
        it("onbang", function(done) {
            var x = 0, instance = timbre();
            instance.onbang = function() {
                if (++x === 2) done();
            };
            instance.bang();
            instance.bang();
        });
        it("addEventListener", function(done) {
            var x = 0, instance = timbre();
            instance.addEventListener("bang", function() {
                if (++x === 2) done();
            });
            instance.bang();
            instance.bang();
        });
        it("onbang & addEventListener", function(done) {
            var x = 0, instance = timbre();
            instance.onbang = function() {
                ++x;
            };
            instance.addEventListener("bang", function() {
                if (++x === 4) done();
            });
            instance.bang();
            instance.bang();
        });
        it("Once Time", function(done) {
            var instance = timbre();
            instance.addEventListener("~bang", done);
            instance.bang();
            instance.bang();
        });
    });
}
