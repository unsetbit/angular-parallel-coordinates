!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.angularParallelCoordinates=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"8amN2b":[function(_dereq_,module,exports){
(function (global){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.parallelCoordinatesChart=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// Borrows heavily from http://bl.ocks.org/mbostock/7586334
_dereq_('./customEventPolyfill');


var defaultInterpolator = _dereq_('./interpolator'),
  defaultColorScaleGenerator = _dereq_('./defaultColorScaleGenerator');

function defaultDomainGenerator(dimension, data){
  return d3.extent(data, function(d) { return +d[dimension]; });
}

module.exports = function parallelCoordinatesChart(config){

  // Configurable variables
  var margin, 
    width, 
    height, 
    selectedProperty,
    colorGenerator,
    domainGenerator,
    dimensions,
    interpolator;

  // Generated variables
  var innerWidth,
    innerHeight,
    x,
    y, 
    dragging, 
    element, 
    data, 
    svg,
    line;

  var axis = d3.svg.axis().orient('left');

  function init(config){
    if('margin' in config) draw.margin(config.margin);
    else draw.margin([30, 10, 10, 10]); // default

    if('width' in config) draw.width(config.width);
    else draw.width(1560); // default

    if('height' in config) draw.height(config.height);
    else draw.width(500); // default;

    if('domain' in config) draw.domain(config.domain);
    else draw.domain(defaultDomainGenerator); // default

    if('highlight' in config) draw.highlight(config.highlight);
    else draw.highlight(''); // default

    if('interpolator' in config) draw.interpolator(config.interpolator);
    else draw.interpolator(defaultInterpolator); // default

    if('color' in config) draw.color(config.color);
    else draw.color(defaultColorScaleGenerator); // default

    if('select' in config) draw.select(config.select);
  }

  function updateHighlight(svg){
    if(!svg) return;

    svg.selectAll('.dimension.selected').classed('selected', false);
    svg.selectAll('.dimension')
      .each(function(d){
        if(d === selectedProperty){
          d3.select(this).classed('selected', true);
        }
      });

    var paths = svg.selectAll('g.datalines path');
    if(!selectedProperty) return paths.style('stroke', '');
    if(!paths || !paths.length) return;

    var color = colorGenerator(selectedProperty, svg.data()[0]);
    paths.style('stroke', function(d){ 
      return color(d[selectedProperty]);   
    });
  }


  function createDraggable(){
    return d3.behavior.drag()
      .on('dragstart', function(d) {
        dragging[d] = this.__origin__ = x(d);
      })
      .on('drag', function(d) {
        dragging[d] = Math.min(innerWidth, Math.max(0, this.__origin__ += d3.event.dx));
        svg.selectAll('g.datalines path').attr('d', path);
        dimensions.sort(function(a, b) { return position(a) - position(b); });
        x.domain(dimensions);
        svg.selectAll('g.dimension').attr('transform', function(d) { return 'translate(' + position(d) + ')'; });
      })
      .on('dragend', function(d) {
        delete this.__origin__;
        delete dragging[d];
        d3.select(this).attr('transform', 'translate(' + x(d) + ')');
        svg.selectAll('g.datalines path').attr('d', path);
    });
  }

  // When brushing, don’t trigger axis dragging.
  function brushStartHandler() { 
    d3.event.sourceEvent.stopPropagation(); 
  }

  // Handles a brush event, toggling the display of foreground lines.
  function brush() {
    var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
        extents = actives.map(function(p) { return y[p].brush.extent(); });

    var selected = [];
    svg.selectAll('g.datalines path').attr('class', function(d) {
      var visible = actives.every(function(p, i) {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      });

      if(visible){
        selected.push(d);
        return 'active';
      } else {
        return 'filtered';
      }
    });

    var filters = {};
    actives.forEach(function(dimension, i){
      filters[dimension] = extents[i];
    });

    var eventDetails = {
      element: element,
      selected: selected,
      filters: filters
    };

    var event = new CustomEvent('changefilter', {detail: eventDetails});
    element.dispatchEvent(event);
  }

  function position(d) {
    // if we're currently dragging the axis return the drag position
    // otherwise return the normal x-axis position
    var v = dragging[d];
    return v == null ? x(d) : v;
  }

  // Returns the path for a given data point.
  function path(d) {
    return line(dimensions.map(function(p) { 
      return [position(p), y[p](d[p])]; 
    }));
  }

  function draw(container){
    dragging = {};

    element = container.node();
    data = container.datum();

    // Extract the list of dimensions and create a scale for each.
    if(!dimensions) dimensions = Object.keys(data[0]);

    x.domain(dimensions);
    
    y = {};
    dimensions.forEach(function(d) {
      y[d] = d3.scale.linear()
        .range([innerHeight, 0])
        .domain(domainGenerator(d, data));
    });

    // base svg
    svg = container
      .selectAll('svg')
        .data([data])
      .enter()
        .append('svg')
          .classed('parallel-coordinates-chart', true)
          .attr('width', width)
          .attr('height', height);
    
    var body = svg          
      .append('g')
        .attr('transform', 'translate(' + margin[3] + ',' + margin[0] + ')');

    // create paths
    body.append('g')
      .classed('datalines', true)
      .selectAll('path')
      .data(data)
      .enter()
        .append('path')
        .attr('d', path);

    // Add a group element for each dimension.
    var dimensionGroup = body
      .selectAll('.dimension')
        .data(dimensions)
        .enter()
          .append('g')
            .classed('dimension', true)
            .attr('transform', function(d) { return 'translate(' + x(d) + ')'; })
            .call(createDraggable());
    
    // Add an axis and title.
    dimensionGroup.append('g')
        .attr('class', 'axis')
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
      .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -9)
        .text(String)
        .on('click', function(d){
          if (d3.event.defaultPrevented) return; // click suppressed
          if(d === selectedProperty) draw.highlight('');
          else draw.highlight(d);
        });

    // Add and store a brush for each axis.
    dimensionGroup.append('g')
        .attr('class', 'brush')
        .each(function(d) { 
          d3.select(this).call(
            y[d].brush = d3.svg.brush().y(y[d])
              .on('brushstart', brushStartHandler)
              .on('brush', brush)
          ); 
        })
      .selectAll('rect')
        .attr('x', -8)
        .attr('width', 16);

    draw.highlight(selectedProperty);

    return draw;
  }

  draw.width = function(_){
    if (!arguments.length) return width;
    width = _;
    innerWidth = width - margin[1] - margin[3];
    x = d3.scale.ordinal().rangePoints([0, innerWidth], 1);
    return draw;
  };

  draw.height = function(_){
    if (!arguments.length) return height;
    height = _;
    innerHeight = height - margin[0] - margin[2];
    return draw;
  };

  draw.margin = function(_){
    if (!arguments.length) return margin;
    margin = _;
    draw.width(width);
    draw.height(height);
    return draw;
  };

  draw.select = function(_){
    if (!arguments.length) return dimensions;
    dimensions = _;
    return draw;
  };

  draw.domain = function(_){
    if (!arguments.length) return domainGenerator;
    domainGenerator = _;
    return draw;
  };
  
  draw.color = function(_){
    if (!arguments.length) return colorGenerator;
    colorGenerator = _;
    return draw;
  };

  draw.interpolator = function(_){
    if (!arguments.length) return interpolator;
    interpolator = _;
    line = d3.svg.line().interpolate(interpolator);
    return draw;
  };

  draw.highlight = function(_){
    if (!arguments.length) return selectedProperty;
    selectedProperty = _;
    updateHighlight(svg);
    return draw;
  };

  draw.filter = function(dimension, extent){
    if(arguments.length === 0){
      var brushes = {};
      Object.keys(y).forEach(function(dimension){
        var extent = y[dimension].brush.extent();
        
        // skip unset filters
        if(extent[0] === extent[1]) return;
        
        brushes[dimension] = y[dimension].brush.extent();
      });

      return brushes;
    }

    if(arguments.length === 1){
      extent = y[dimension].brush.extent();
      if(extent[0] === extent[1]) return; // undefined if unset
      return extent;
    }

    if(!extent) extent = [0,0]; // this hides brush

    svg.selectAll(' .brush').filter(function(d){
      return d === dimension;
    }).call(y[dimension].brush.extent(extent)).call(brush);    
  };

  draw.redraw = function(container){
    if(svg) svg.remove();
    draw(container);
    return draw;
  };

  draw.draw = function(container){
    draw(container);
    return draw;
  };

  init(config || {});

  return draw;
};

},{"./customEventPolyfill":2,"./defaultColorScaleGenerator":3,"./interpolator":4}],2:[function(_dereq_,module,exports){
// For IE9+
(function () {
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();
},{}],3:[function(_dereq_,module,exports){
module.exports = function colorScaleGenerator(property, data){
  return d3.scale.linear()
    .domain(d3.extent(data, function(d) { return +d[property]; }))
    .range(['hsl(0, 60%, 50%)', 'hsl(255, 60%, 50%)']) // red to blue
    .interpolate(d3.interpolateHsl);
};
},{}],4:[function(_dereq_,module,exports){
module.exports = function interpolator(points){
  var point, 
    action = '', 
    lineBuilder = [];

  for(var i = 0; i < points.length - 1; i++){
    point = points[i];

    if(isNaN(point[1])){
      if(action !== '') action = 'M';
    } else {
      lineBuilder.push(action, point);
      action = 'L';
    }
  }
  
  point = points[points.length - 1];
  if(!isNaN(point[1])){
    lineBuilder.push(action, point);
  }

  return lineBuilder.join('');
};
},{}]},{},[1])
(1)
});
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"parallel-coordinates-chart":[function(_dereq_,module,exports){
module.exports=_dereq_('8amN2b');
},{}],3:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var debounce = _dereq_('lodash.debounce'),
    isFunction = _dereq_('lodash.isfunction'),
    isObject = _dereq_('lodash.isobject');

/** Used as an internal `_.debounce` options object */
var debounceOptions = {
  'leading': false,
  'maxWait': 0,
  'trailing': false
};

/**
 * Creates a function that, when executed, will only call the `func` function
 * at most once per every `wait` milliseconds. Provide an options object to
 * indicate that `func` should be invoked on the leading and/or trailing edge
 * of the `wait` timeout. Subsequent calls to the throttled function will
 * return the result of the last `func` call.
 *
 * Note: If `leading` and `trailing` options are `true` `func` will be called
 * on the trailing edge of the timeout only if the the throttled function is
 * invoked more than once during the `wait` timeout.
 *
 * @static
 * @memberOf _
 * @category Functions
 * @param {Function} func The function to throttle.
 * @param {number} wait The number of milliseconds to throttle executions to.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // avoid excessively updating the position while scrolling
 * var throttled = _.throttle(updatePosition, 100);
 * jQuery(window).on('scroll', throttled);
 *
 * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
 * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
 *   'trailing': false
 * }));
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (!isFunction(func)) {
    throw new TypeError;
  }
  if (options === false) {
    leading = false;
  } else if (isObject(options)) {
    leading = 'leading' in options ? options.leading : leading;
    trailing = 'trailing' in options ? options.trailing : trailing;
  }
  debounceOptions.leading = leading;
  debounceOptions.maxWait = wait;
  debounceOptions.trailing = trailing;

  return debounce(func, wait, debounceOptions);
}

module.exports = throttle;

},{"lodash.debounce":4,"lodash.isfunction":7,"lodash.isobject":8}],4:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isFunction = _dereq_('lodash.isfunction'),
    isObject = _dereq_('lodash.isobject'),
    now = _dereq_('lodash.now');

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeMax = Math.max;

/**
 * Creates a function that will delay the execution of `func` until after
 * `wait` milliseconds have elapsed since the last time it was invoked.
 * Provide an options object to indicate that `func` should be invoked on
 * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
 * to the debounced function will return the result of the last `func` call.
 *
 * Note: If `leading` and `trailing` options are `true` `func` will be called
 * on the trailing edge of the timeout only if the the debounced function is
 * invoked more than once during the `wait` timeout.
 *
 * @static
 * @memberOf _
 * @category Functions
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @param {Object} [options] The options object.
 * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
 * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
 * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // avoid costly calculations while the window size is in flux
 * var lazyLayout = _.debounce(calculateLayout, 150);
 * jQuery(window).on('resize', lazyLayout);
 *
 * // execute `sendMail` when the click event is fired, debouncing subsequent calls
 * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * });
 *
 * // ensure `batchLog` is executed once after 1 second of debounced calls
 * var source = new EventSource('/stream');
 * source.addEventListener('message', _.debounce(batchLog, 250, {
 *   'maxWait': 1000
 * }, false);
 */
function debounce(func, wait, options) {
  var args,
      maxTimeoutId,
      result,
      stamp,
      thisArg,
      timeoutId,
      trailingCall,
      lastCalled = 0,
      maxWait = false,
      trailing = true;

  if (!isFunction(func)) {
    throw new TypeError;
  }
  wait = nativeMax(0, wait) || 0;
  if (options === true) {
    var leading = true;
    trailing = false;
  } else if (isObject(options)) {
    leading = options.leading;
    maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
    trailing = 'trailing' in options ? options.trailing : trailing;
  }
  var delayed = function() {
    var remaining = wait - (now() - stamp);
    if (remaining <= 0) {
      if (maxTimeoutId) {
        clearTimeout(maxTimeoutId);
      }
      var isCalled = trailingCall;
      maxTimeoutId = timeoutId = trailingCall = undefined;
      if (isCalled) {
        lastCalled = now();
        result = func.apply(thisArg, args);
        if (!timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
      }
    } else {
      timeoutId = setTimeout(delayed, remaining);
    }
  };

  var maxDelayed = function() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    maxTimeoutId = timeoutId = trailingCall = undefined;
    if (trailing || (maxWait !== wait)) {
      lastCalled = now();
      result = func.apply(thisArg, args);
      if (!timeoutId && !maxTimeoutId) {
        args = thisArg = null;
      }
    }
  };

  return function() {
    args = arguments;
    stamp = now();
    thisArg = this;
    trailingCall = trailing && (timeoutId || !leading);

    if (maxWait === false) {
      var leadingCall = leading && !timeoutId;
    } else {
      if (!maxTimeoutId && !leading) {
        lastCalled = stamp;
      }
      var remaining = maxWait - (stamp - lastCalled),
          isCalled = remaining <= 0;

      if (isCalled) {
        if (maxTimeoutId) {
          maxTimeoutId = clearTimeout(maxTimeoutId);
        }
        lastCalled = stamp;
        result = func.apply(thisArg, args);
      }
      else if (!maxTimeoutId) {
        maxTimeoutId = setTimeout(maxDelayed, remaining);
      }
    }
    if (isCalled && timeoutId) {
      timeoutId = clearTimeout(timeoutId);
    }
    else if (!timeoutId && wait !== maxWait) {
      timeoutId = setTimeout(delayed, wait);
    }
    if (leadingCall) {
      isCalled = true;
      result = func.apply(thisArg, args);
    }
    if (isCalled && !timeoutId && !maxTimeoutId) {
      args = thisArg = null;
    }
    return result;
  };
}

module.exports = debounce;

},{"lodash.isfunction":7,"lodash.isobject":8,"lodash.now":5}],5:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = _dereq_('lodash._isnative');

/**
 * Gets the number of milliseconds that have elapsed since the Unix epoch
 * (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @category Utilities
 * @example
 *
 * var stamp = _.now();
 * _.defer(function() { console.log(_.now() - stamp); });
 * // => logs the number of milliseconds it took for the deferred function to be called
 */
var now = isNative(now = Date.now) && now || function() {
  return new Date().getTime();
};

module.exports = now;

},{"lodash._isnative":6}],6:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/** Used to detect if a method is native */
var reNative = RegExp('^' +
  String(toString)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/toString| for [^\]]+/g, '.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
 */
function isNative(value) {
  return typeof value == 'function' && reNative.test(value);
}

module.exports = isNative;

},{}],7:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * Checks if `value` is a function.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 */
function isFunction(value) {
  return typeof value == 'function';
}

module.exports = isFunction;

},{}],8:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = _dereq_('lodash._objecttypes');

/**
 * Checks if `value` is the language type of Object.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // check if the value is the ECMAScript language type of Object
  // http://es5.github.io/#x8
  // and avoid a V8 bug
  // http://code.google.com/p/v8/issues/detail?id=2291
  return !!(value && objectTypes[typeof value]);
}

module.exports = isObject;

},{"lodash._objecttypes":9}],9:[function(_dereq_,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="npm" -o ./npm/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to determine if values are of the language type Object */
var objectTypes = {
  'boolean': false,
  'function': true,
  'object': true,
  'number': false,
  'string': false,
  'undefined': false
};

module.exports = objectTypes;

},{}],10:[function(_dereq_,module,exports){
var parallelCoordinateChart = _dereq_('parallel-coordinates-chart');
var throttle = _dereq_('lodash.throttle');

angular.module('parallelCoordinatesChart', [])
.directive('parallelCoordinatesChart', function parallelCoordinatesChart(){
  return {
    restrict: 'E',
    scope: {
      'data': '=',
      'select': '=',
      'config': '=',
      'highlight': '@',
      'width': '@',
      'height': '@'
    },
    link: function(scope, element, attrs){
      var chart = parallelCoordinateChart();
      var d3Element = d3.select(element[0]);
      var data;

      // Prevent attempts to draw more than once a frame
      var throttledRedraw = throttle(chart.redraw, 16);

      function redraw(){
        if(!data) return;
        throttledRedraw(d3Element);
      }

      scope.$watch(attrs.select, function(value){
        if(value === undefined) return;
        chart.dimensions(value);
        redraw();
      });

      attrs.$observe('highlight', function(value){
        chart.highlight(value || '');
        redraw();
      });

      attrs.$observe('width', function(value){
        if(!value && value !== 0) return;
        chart.width(value);
        redraw();
      });

      attrs.$observe('height', function(value){
        if(!value && value !== 0) return;
        chart.height(value);
        redraw();
      });

      scope.$watch(attrs.config, function(value){
        if(!value) return;
        
        Object.keys(value).forEach(function(key){
          chart[key](value[key]);
        });
      });

      scope.$watch(attrs.data, function(value){
        if(!value) return;
        data = value;
        d3Element.datum(value).call(chart.draw);
      });
    }
  };
});
},{"lodash.throttle":3,"parallel-coordinates-chart":"8amN2b"}]},{},[10])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJjOlxcVXNlcnNcXG96YW5cXHdvcmtzcGFjZVxcYW5ndWxhci1wYXJhbGxlbC1jb29yZGluYXRlc1xcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJjOi9Vc2Vycy9vemFuL3dvcmtzcGFjZS9hbmd1bGFyLXBhcmFsbGVsLWNvb3JkaW5hdGVzL2Jvd2VyX2NvbXBvbmVudHMvcGFyYWxsZWwtY29vcmRpbmF0ZXMtY2hhcnQvZGlzdC9wYXJhbGxlbC1jb29yZGluYXRlcy1jaGFydC5qcyIsImM6L1VzZXJzL296YW4vd29ya3NwYWNlL2FuZ3VsYXItcGFyYWxsZWwtY29vcmRpbmF0ZXMvbm9kZV9tb2R1bGVzL2xvZGFzaC50aHJvdHRsZS9pbmRleC5qcyIsImM6L1VzZXJzL296YW4vd29ya3NwYWNlL2FuZ3VsYXItcGFyYWxsZWwtY29vcmRpbmF0ZXMvbm9kZV9tb2R1bGVzL2xvZGFzaC50aHJvdHRsZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlYm91bmNlL2luZGV4LmpzIiwiYzovVXNlcnMvb3phbi93b3Jrc3BhY2UvYW5ndWxhci1wYXJhbGxlbC1jb29yZGluYXRlcy9ub2RlX21vZHVsZXMvbG9kYXNoLnRocm90dGxlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVib3VuY2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5ub3cvaW5kZXguanMiLCJjOi9Vc2Vycy9vemFuL3dvcmtzcGFjZS9hbmd1bGFyLXBhcmFsbGVsLWNvb3JkaW5hdGVzL25vZGVfbW9kdWxlcy9sb2Rhc2gudGhyb3R0bGUvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWJvdW5jZS9ub2RlX21vZHVsZXMvbG9kYXNoLm5vdy9ub2RlX21vZHVsZXMvbG9kYXNoLl9pc25hdGl2ZS9pbmRleC5qcyIsImM6L1VzZXJzL296YW4vd29ya3NwYWNlL2FuZ3VsYXItcGFyYWxsZWwtY29vcmRpbmF0ZXMvbm9kZV9tb2R1bGVzL2xvZGFzaC50aHJvdHRsZS9ub2RlX21vZHVsZXMvbG9kYXNoLmlzZnVuY3Rpb24vaW5kZXguanMiLCJjOi9Vc2Vycy9vemFuL3dvcmtzcGFjZS9hbmd1bGFyLXBhcmFsbGVsLWNvb3JkaW5hdGVzL25vZGVfbW9kdWxlcy9sb2Rhc2gudGhyb3R0bGUvbm9kZV9tb2R1bGVzL2xvZGFzaC5pc29iamVjdC9pbmRleC5qcyIsImM6L1VzZXJzL296YW4vd29ya3NwYWNlL2FuZ3VsYXItcGFyYWxsZWwtY29vcmRpbmF0ZXMvbm9kZV9tb2R1bGVzL2xvZGFzaC50aHJvdHRsZS9ub2RlX21vZHVsZXMvbG9kYXNoLmlzb2JqZWN0L25vZGVfbW9kdWxlcy9sb2Rhc2guX29iamVjdHR5cGVzL2luZGV4LmpzIiwiYzovVXNlcnMvb3phbi93b3Jrc3BhY2UvYW5ndWxhci1wYXJhbGxlbC1jb29yZGluYXRlcy9zcmMvanMvbW9kdWxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcllBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuIWZ1bmN0aW9uKGUpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlKW1vZHVsZS5leHBvcnRzPWUoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoW10sZSk7ZWxzZXt2YXIgbztcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P289d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/bz1nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGYmJihvPXNlbGYpLG8ucGFyYWxsZWxDb29yZGluYXRlc0NoYXJ0PWUoKX19KGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLy8gQm9ycm93cyBoZWF2aWx5IGZyb20gaHR0cDovL2JsLm9ja3Mub3JnL21ib3N0b2NrLzc1ODYzMzRcbl9kZXJlcV8oJy4vY3VzdG9tRXZlbnRQb2x5ZmlsbCcpO1xuXG5cbnZhciBkZWZhdWx0SW50ZXJwb2xhdG9yID0gX2RlcmVxXygnLi9pbnRlcnBvbGF0b3InKSxcbiAgZGVmYXVsdENvbG9yU2NhbGVHZW5lcmF0b3IgPSBfZGVyZXFfKCcuL2RlZmF1bHRDb2xvclNjYWxlR2VuZXJhdG9yJyk7XG5cbmZ1bmN0aW9uIGRlZmF1bHREb21haW5HZW5lcmF0b3IoZGltZW5zaW9uLCBkYXRhKXtcbiAgcmV0dXJuIGQzLmV4dGVudChkYXRhLCBmdW5jdGlvbihkKSB7IHJldHVybiArZFtkaW1lbnNpb25dOyB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJhbGxlbENvb3JkaW5hdGVzQ2hhcnQoY29uZmlnKXtcblxuICAvLyBDb25maWd1cmFibGUgdmFyaWFibGVzXG4gIHZhciBtYXJnaW4sIFxuICAgIHdpZHRoLCBcbiAgICBoZWlnaHQsIFxuICAgIHNlbGVjdGVkUHJvcGVydHksXG4gICAgY29sb3JHZW5lcmF0b3IsXG4gICAgZG9tYWluR2VuZXJhdG9yLFxuICAgIGRpbWVuc2lvbnMsXG4gICAgaW50ZXJwb2xhdG9yO1xuXG4gIC8vIEdlbmVyYXRlZCB2YXJpYWJsZXNcbiAgdmFyIGlubmVyV2lkdGgsXG4gICAgaW5uZXJIZWlnaHQsXG4gICAgeCxcbiAgICB5LCBcbiAgICBkcmFnZ2luZywgXG4gICAgZWxlbWVudCwgXG4gICAgZGF0YSwgXG4gICAgc3ZnLFxuICAgIGxpbmU7XG5cbiAgdmFyIGF4aXMgPSBkMy5zdmcuYXhpcygpLm9yaWVudCgnbGVmdCcpO1xuXG4gIGZ1bmN0aW9uIGluaXQoY29uZmlnKXtcbiAgICBpZignbWFyZ2luJyBpbiBjb25maWcpIGRyYXcubWFyZ2luKGNvbmZpZy5tYXJnaW4pO1xuICAgIGVsc2UgZHJhdy5tYXJnaW4oWzMwLCAxMCwgMTAsIDEwXSk7IC8vIGRlZmF1bHRcblxuICAgIGlmKCd3aWR0aCcgaW4gY29uZmlnKSBkcmF3LndpZHRoKGNvbmZpZy53aWR0aCk7XG4gICAgZWxzZSBkcmF3LndpZHRoKDE1NjApOyAvLyBkZWZhdWx0XG5cbiAgICBpZignaGVpZ2h0JyBpbiBjb25maWcpIGRyYXcuaGVpZ2h0KGNvbmZpZy5oZWlnaHQpO1xuICAgIGVsc2UgZHJhdy53aWR0aCg1MDApOyAvLyBkZWZhdWx0O1xuXG4gICAgaWYoJ2RvbWFpbicgaW4gY29uZmlnKSBkcmF3LmRvbWFpbihjb25maWcuZG9tYWluKTtcbiAgICBlbHNlIGRyYXcuZG9tYWluKGRlZmF1bHREb21haW5HZW5lcmF0b3IpOyAvLyBkZWZhdWx0XG5cbiAgICBpZignaGlnaGxpZ2h0JyBpbiBjb25maWcpIGRyYXcuaGlnaGxpZ2h0KGNvbmZpZy5oaWdobGlnaHQpO1xuICAgIGVsc2UgZHJhdy5oaWdobGlnaHQoJycpOyAvLyBkZWZhdWx0XG5cbiAgICBpZignaW50ZXJwb2xhdG9yJyBpbiBjb25maWcpIGRyYXcuaW50ZXJwb2xhdG9yKGNvbmZpZy5pbnRlcnBvbGF0b3IpO1xuICAgIGVsc2UgZHJhdy5pbnRlcnBvbGF0b3IoZGVmYXVsdEludGVycG9sYXRvcik7IC8vIGRlZmF1bHRcblxuICAgIGlmKCdjb2xvcicgaW4gY29uZmlnKSBkcmF3LmNvbG9yKGNvbmZpZy5jb2xvcik7XG4gICAgZWxzZSBkcmF3LmNvbG9yKGRlZmF1bHRDb2xvclNjYWxlR2VuZXJhdG9yKTsgLy8gZGVmYXVsdFxuXG4gICAgaWYoJ3NlbGVjdCcgaW4gY29uZmlnKSBkcmF3LnNlbGVjdChjb25maWcuc2VsZWN0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUhpZ2hsaWdodChzdmcpe1xuICAgIGlmKCFzdmcpIHJldHVybjtcblxuICAgIHN2Zy5zZWxlY3RBbGwoJy5kaW1lbnNpb24uc2VsZWN0ZWQnKS5jbGFzc2VkKCdzZWxlY3RlZCcsIGZhbHNlKTtcbiAgICBzdmcuc2VsZWN0QWxsKCcuZGltZW5zaW9uJylcbiAgICAgIC5lYWNoKGZ1bmN0aW9uKGQpe1xuICAgICAgICBpZihkID09PSBzZWxlY3RlZFByb3BlcnR5KXtcbiAgICAgICAgICBkMy5zZWxlY3QodGhpcykuY2xhc3NlZCgnc2VsZWN0ZWQnLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB2YXIgcGF0aHMgPSBzdmcuc2VsZWN0QWxsKCdnLmRhdGFsaW5lcyBwYXRoJyk7XG4gICAgaWYoIXNlbGVjdGVkUHJvcGVydHkpIHJldHVybiBwYXRocy5zdHlsZSgnc3Ryb2tlJywgJycpO1xuICAgIGlmKCFwYXRocyB8fCAhcGF0aHMubGVuZ3RoKSByZXR1cm47XG5cbiAgICB2YXIgY29sb3IgPSBjb2xvckdlbmVyYXRvcihzZWxlY3RlZFByb3BlcnR5LCBzdmcuZGF0YSgpWzBdKTtcbiAgICBwYXRocy5zdHlsZSgnc3Ryb2tlJywgZnVuY3Rpb24oZCl7IFxuICAgICAgcmV0dXJuIGNvbG9yKGRbc2VsZWN0ZWRQcm9wZXJ0eV0pOyAgIFxuICAgIH0pO1xuICB9XG5cblxuICBmdW5jdGlvbiBjcmVhdGVEcmFnZ2FibGUoKXtcbiAgICByZXR1cm4gZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAub24oJ2RyYWdzdGFydCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZHJhZ2dpbmdbZF0gPSB0aGlzLl9fb3JpZ2luX18gPSB4KGQpO1xuICAgICAgfSlcbiAgICAgIC5vbignZHJhZycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbihpbm5lcldpZHRoLCBNYXRoLm1heCgwLCB0aGlzLl9fb3JpZ2luX18gKz0gZDMuZXZlbnQuZHgpKTtcbiAgICAgICAgc3ZnLnNlbGVjdEFsbCgnZy5kYXRhbGluZXMgcGF0aCcpLmF0dHIoJ2QnLCBwYXRoKTtcbiAgICAgICAgZGltZW5zaW9ucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIHBvc2l0aW9uKGEpIC0gcG9zaXRpb24oYik7IH0pO1xuICAgICAgICB4LmRvbWFpbihkaW1lbnNpb25zKTtcbiAgICAgICAgc3ZnLnNlbGVjdEFsbCgnZy5kaW1lbnNpb24nKS5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7IHJldHVybiAndHJhbnNsYXRlKCcgKyBwb3NpdGlvbihkKSArICcpJzsgfSk7XG4gICAgICB9KVxuICAgICAgLm9uKCdkcmFnZW5kJywgZnVuY3Rpb24oZCkge1xuICAgICAgICBkZWxldGUgdGhpcy5fX29yaWdpbl9fO1xuICAgICAgICBkZWxldGUgZHJhZ2dpbmdbZF07XG4gICAgICAgIGQzLnNlbGVjdCh0aGlzKS5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyB4KGQpICsgJyknKTtcbiAgICAgICAgc3ZnLnNlbGVjdEFsbCgnZy5kYXRhbGluZXMgcGF0aCcpLmF0dHIoJ2QnLCBwYXRoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFdoZW4gYnJ1c2hpbmcsIGRvbuKAmXQgdHJpZ2dlciBheGlzIGRyYWdnaW5nLlxuICBmdW5jdGlvbiBicnVzaFN0YXJ0SGFuZGxlcigpIHsgXG4gICAgZDMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7IFxuICB9XG5cbiAgLy8gSGFuZGxlcyBhIGJydXNoIGV2ZW50LCB0b2dnbGluZyB0aGUgZGlzcGxheSBvZiBmb3JlZ3JvdW5kIGxpbmVzLlxuICBmdW5jdGlvbiBicnVzaCgpIHtcbiAgICB2YXIgYWN0aXZlcyA9IGRpbWVuc2lvbnMuZmlsdGVyKGZ1bmN0aW9uKHApIHsgcmV0dXJuICF5W3BdLmJydXNoLmVtcHR5KCk7IH0pLFxuICAgICAgICBleHRlbnRzID0gYWN0aXZlcy5tYXAoZnVuY3Rpb24ocCkgeyByZXR1cm4geVtwXS5icnVzaC5leHRlbnQoKTsgfSk7XG5cbiAgICB2YXIgc2VsZWN0ZWQgPSBbXTtcbiAgICBzdmcuc2VsZWN0QWxsKCdnLmRhdGFsaW5lcyBwYXRoJykuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICB2YXIgdmlzaWJsZSA9IGFjdGl2ZXMuZXZlcnkoZnVuY3Rpb24ocCwgaSkge1xuICAgICAgICByZXR1cm4gZXh0ZW50c1tpXVswXSA8PSBkW3BdICYmIGRbcF0gPD0gZXh0ZW50c1tpXVsxXTtcbiAgICAgIH0pO1xuXG4gICAgICBpZih2aXNpYmxlKXtcbiAgICAgICAgc2VsZWN0ZWQucHVzaChkKTtcbiAgICAgICAgcmV0dXJuICdhY3RpdmUnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICdmaWx0ZXJlZCc7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgZmlsdGVycyA9IHt9O1xuICAgIGFjdGl2ZXMuZm9yRWFjaChmdW5jdGlvbihkaW1lbnNpb24sIGkpe1xuICAgICAgZmlsdGVyc1tkaW1lbnNpb25dID0gZXh0ZW50c1tpXTtcbiAgICB9KTtcblxuICAgIHZhciBldmVudERldGFpbHMgPSB7XG4gICAgICBlbGVtZW50OiBlbGVtZW50LFxuICAgICAgc2VsZWN0ZWQ6IHNlbGVjdGVkLFxuICAgICAgZmlsdGVyczogZmlsdGVyc1xuICAgIH07XG5cbiAgICB2YXIgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2NoYW5nZWZpbHRlcicsIHtkZXRhaWw6IGV2ZW50RGV0YWlsc30pO1xuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gIH1cblxuICBmdW5jdGlvbiBwb3NpdGlvbihkKSB7XG4gICAgLy8gaWYgd2UncmUgY3VycmVudGx5IGRyYWdnaW5nIHRoZSBheGlzIHJldHVybiB0aGUgZHJhZyBwb3NpdGlvblxuICAgIC8vIG90aGVyd2lzZSByZXR1cm4gdGhlIG5vcm1hbCB4LWF4aXMgcG9zaXRpb25cbiAgICB2YXIgdiA9IGRyYWdnaW5nW2RdO1xuICAgIHJldHVybiB2ID09IG51bGwgPyB4KGQpIDogdjtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIHBhdGggZm9yIGEgZ2l2ZW4gZGF0YSBwb2ludC5cbiAgZnVuY3Rpb24gcGF0aChkKSB7XG4gICAgcmV0dXJuIGxpbmUoZGltZW5zaW9ucy5tYXAoZnVuY3Rpb24ocCkgeyBcbiAgICAgIHJldHVybiBbcG9zaXRpb24ocCksIHlbcF0oZFtwXSldOyBcbiAgICB9KSk7XG4gIH1cblxuICBmdW5jdGlvbiBkcmF3KGNvbnRhaW5lcil7XG4gICAgZHJhZ2dpbmcgPSB7fTtcblxuICAgIGVsZW1lbnQgPSBjb250YWluZXIubm9kZSgpO1xuICAgIGRhdGEgPSBjb250YWluZXIuZGF0dW0oKTtcblxuICAgIC8vIEV4dHJhY3QgdGhlIGxpc3Qgb2YgZGltZW5zaW9ucyBhbmQgY3JlYXRlIGEgc2NhbGUgZm9yIGVhY2guXG4gICAgaWYoIWRpbWVuc2lvbnMpIGRpbWVuc2lvbnMgPSBPYmplY3Qua2V5cyhkYXRhWzBdKTtcblxuICAgIHguZG9tYWluKGRpbWVuc2lvbnMpO1xuICAgIFxuICAgIHkgPSB7fTtcbiAgICBkaW1lbnNpb25zLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgeVtkXSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5yYW5nZShbaW5uZXJIZWlnaHQsIDBdKVxuICAgICAgICAuZG9tYWluKGRvbWFpbkdlbmVyYXRvcihkLCBkYXRhKSk7XG4gICAgfSk7XG5cbiAgICAvLyBiYXNlIHN2Z1xuICAgIHN2ZyA9IGNvbnRhaW5lclxuICAgICAgLnNlbGVjdEFsbCgnc3ZnJylcbiAgICAgICAgLmRhdGEoW2RhdGFdKVxuICAgICAgLmVudGVyKClcbiAgICAgICAgLmFwcGVuZCgnc3ZnJylcbiAgICAgICAgICAuY2xhc3NlZCgncGFyYWxsZWwtY29vcmRpbmF0ZXMtY2hhcnQnLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIHdpZHRoKVxuICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpO1xuICAgIFxuICAgIHZhciBib2R5ID0gc3ZnICAgICAgICAgIFxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBtYXJnaW5bM10gKyAnLCcgKyBtYXJnaW5bMF0gKyAnKScpO1xuXG4gICAgLy8gY3JlYXRlIHBhdGhzXG4gICAgYm9keS5hcHBlbmQoJ2cnKVxuICAgICAgLmNsYXNzZWQoJ2RhdGFsaW5lcycsIHRydWUpXG4gICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKCdwYXRoJylcbiAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgIC8vIEFkZCBhIGdyb3VwIGVsZW1lbnQgZm9yIGVhY2ggZGltZW5zaW9uLlxuICAgIHZhciBkaW1lbnNpb25Hcm91cCA9IGJvZHlcbiAgICAgIC5zZWxlY3RBbGwoJy5kaW1lbnNpb24nKVxuICAgICAgICAuZGF0YShkaW1lbnNpb25zKVxuICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLmNsYXNzZWQoJ2RpbWVuc2lvbicsIHRydWUpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgeChkKSArICcpJzsgfSlcbiAgICAgICAgICAgIC5jYWxsKGNyZWF0ZURyYWdnYWJsZSgpKTtcbiAgICBcbiAgICAvLyBBZGQgYW4gYXhpcyBhbmQgdGl0bGUuXG4gICAgZGltZW5zaW9uR3JvdXAuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2F4aXMnKVxuICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7IGQzLnNlbGVjdCh0aGlzKS5jYWxsKGF4aXMuc2NhbGUoeVtkXSkpOyB9KVxuICAgICAgLmFwcGVuZCgndGV4dCcpXG4gICAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKVxuICAgICAgICAuYXR0cigneScsIC05KVxuICAgICAgICAudGV4dChTdHJpbmcpXG4gICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbihkKXtcbiAgICAgICAgICBpZiAoZDMuZXZlbnQuZGVmYXVsdFByZXZlbnRlZCkgcmV0dXJuOyAvLyBjbGljayBzdXBwcmVzc2VkXG4gICAgICAgICAgaWYoZCA9PT0gc2VsZWN0ZWRQcm9wZXJ0eSkgZHJhdy5oaWdobGlnaHQoJycpO1xuICAgICAgICAgIGVsc2UgZHJhdy5oaWdobGlnaHQoZCk7XG4gICAgICAgIH0pO1xuXG4gICAgLy8gQWRkIGFuZCBzdG9yZSBhIGJydXNoIGZvciBlYWNoIGF4aXMuXG4gICAgZGltZW5zaW9uR3JvdXAuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2JydXNoJylcbiAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkgeyBcbiAgICAgICAgICBkMy5zZWxlY3QodGhpcykuY2FsbChcbiAgICAgICAgICAgIHlbZF0uYnJ1c2ggPSBkMy5zdmcuYnJ1c2goKS55KHlbZF0pXG4gICAgICAgICAgICAgIC5vbignYnJ1c2hzdGFydCcsIGJydXNoU3RhcnRIYW5kbGVyKVxuICAgICAgICAgICAgICAub24oJ2JydXNoJywgYnJ1c2gpXG4gICAgICAgICAgKTsgXG4gICAgICAgIH0pXG4gICAgICAuc2VsZWN0QWxsKCdyZWN0JylcbiAgICAgICAgLmF0dHIoJ3gnLCAtOClcbiAgICAgICAgLmF0dHIoJ3dpZHRoJywgMTYpO1xuXG4gICAgZHJhdy5oaWdobGlnaHQoc2VsZWN0ZWRQcm9wZXJ0eSk7XG5cbiAgICByZXR1cm4gZHJhdztcbiAgfVxuXG4gIGRyYXcud2lkdGggPSBmdW5jdGlvbihfKXtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB3aWR0aDtcbiAgICB3aWR0aCA9IF87XG4gICAgaW5uZXJXaWR0aCA9IHdpZHRoIC0gbWFyZ2luWzFdIC0gbWFyZ2luWzNdO1xuICAgIHggPSBkMy5zY2FsZS5vcmRpbmFsKCkucmFuZ2VQb2ludHMoWzAsIGlubmVyV2lkdGhdLCAxKTtcbiAgICByZXR1cm4gZHJhdztcbiAgfTtcblxuICBkcmF3LmhlaWdodCA9IGZ1bmN0aW9uKF8pe1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGhlaWdodDtcbiAgICBoZWlnaHQgPSBfO1xuICAgIGlubmVySGVpZ2h0ID0gaGVpZ2h0IC0gbWFyZ2luWzBdIC0gbWFyZ2luWzJdO1xuICAgIHJldHVybiBkcmF3O1xuICB9O1xuXG4gIGRyYXcubWFyZ2luID0gZnVuY3Rpb24oXyl7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gbWFyZ2luO1xuICAgIG1hcmdpbiA9IF87XG4gICAgZHJhdy53aWR0aCh3aWR0aCk7XG4gICAgZHJhdy5oZWlnaHQoaGVpZ2h0KTtcbiAgICByZXR1cm4gZHJhdztcbiAgfTtcblxuICBkcmF3LnNlbGVjdCA9IGZ1bmN0aW9uKF8pe1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGRpbWVuc2lvbnM7XG4gICAgZGltZW5zaW9ucyA9IF87XG4gICAgcmV0dXJuIGRyYXc7XG4gIH07XG5cbiAgZHJhdy5kb21haW4gPSBmdW5jdGlvbihfKXtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBkb21haW5HZW5lcmF0b3I7XG4gICAgZG9tYWluR2VuZXJhdG9yID0gXztcbiAgICByZXR1cm4gZHJhdztcbiAgfTtcbiAgXG4gIGRyYXcuY29sb3IgPSBmdW5jdGlvbihfKXtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBjb2xvckdlbmVyYXRvcjtcbiAgICBjb2xvckdlbmVyYXRvciA9IF87XG4gICAgcmV0dXJuIGRyYXc7XG4gIH07XG5cbiAgZHJhdy5pbnRlcnBvbGF0b3IgPSBmdW5jdGlvbihfKXtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBpbnRlcnBvbGF0b3I7XG4gICAgaW50ZXJwb2xhdG9yID0gXztcbiAgICBsaW5lID0gZDMuc3ZnLmxpbmUoKS5pbnRlcnBvbGF0ZShpbnRlcnBvbGF0b3IpO1xuICAgIHJldHVybiBkcmF3O1xuICB9O1xuXG4gIGRyYXcuaGlnaGxpZ2h0ID0gZnVuY3Rpb24oXyl7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2VsZWN0ZWRQcm9wZXJ0eTtcbiAgICBzZWxlY3RlZFByb3BlcnR5ID0gXztcbiAgICB1cGRhdGVIaWdobGlnaHQoc3ZnKTtcbiAgICByZXR1cm4gZHJhdztcbiAgfTtcblxuICBkcmF3LmZpbHRlciA9IGZ1bmN0aW9uKGRpbWVuc2lvbiwgZXh0ZW50KXtcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAwKXtcbiAgICAgIHZhciBicnVzaGVzID0ge307XG4gICAgICBPYmplY3Qua2V5cyh5KS5mb3JFYWNoKGZ1bmN0aW9uKGRpbWVuc2lvbil7XG4gICAgICAgIHZhciBleHRlbnQgPSB5W2RpbWVuc2lvbl0uYnJ1c2guZXh0ZW50KCk7XG4gICAgICAgIFxuICAgICAgICAvLyBza2lwIHVuc2V0IGZpbHRlcnNcbiAgICAgICAgaWYoZXh0ZW50WzBdID09PSBleHRlbnRbMV0pIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIGJydXNoZXNbZGltZW5zaW9uXSA9IHlbZGltZW5zaW9uXS5icnVzaC5leHRlbnQoKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gYnJ1c2hlcztcbiAgICB9XG5cbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAxKXtcbiAgICAgIGV4dGVudCA9IHlbZGltZW5zaW9uXS5icnVzaC5leHRlbnQoKTtcbiAgICAgIGlmKGV4dGVudFswXSA9PT0gZXh0ZW50WzFdKSByZXR1cm47IC8vIHVuZGVmaW5lZCBpZiB1bnNldFxuICAgICAgcmV0dXJuIGV4dGVudDtcbiAgICB9XG5cbiAgICBpZighZXh0ZW50KSBleHRlbnQgPSBbMCwwXTsgLy8gdGhpcyBoaWRlcyBicnVzaFxuXG4gICAgc3ZnLnNlbGVjdEFsbCgnIC5icnVzaCcpLmZpbHRlcihmdW5jdGlvbihkKXtcbiAgICAgIHJldHVybiBkID09PSBkaW1lbnNpb247XG4gICAgfSkuY2FsbCh5W2RpbWVuc2lvbl0uYnJ1c2guZXh0ZW50KGV4dGVudCkpLmNhbGwoYnJ1c2gpOyAgICBcbiAgfTtcblxuICBkcmF3LnJlZHJhdyA9IGZ1bmN0aW9uKGNvbnRhaW5lcil7XG4gICAgaWYoc3ZnKSBzdmcucmVtb3ZlKCk7XG4gICAgZHJhdyhjb250YWluZXIpO1xuICAgIHJldHVybiBkcmF3O1xuICB9O1xuXG4gIGRyYXcuZHJhdyA9IGZ1bmN0aW9uKGNvbnRhaW5lcil7XG4gICAgZHJhdyhjb250YWluZXIpO1xuICAgIHJldHVybiBkcmF3O1xuICB9O1xuXG4gIGluaXQoY29uZmlnIHx8IHt9KTtcblxuICByZXR1cm4gZHJhdztcbn07XG5cbn0se1wiLi9jdXN0b21FdmVudFBvbHlmaWxsXCI6MixcIi4vZGVmYXVsdENvbG9yU2NhbGVHZW5lcmF0b3JcIjozLFwiLi9pbnRlcnBvbGF0b3JcIjo0fV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG4vLyBGb3IgSUU5K1xuKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQ3VzdG9tRXZlbnQgKCBldmVudCwgcGFyYW1zICkge1xuICAgIHBhcmFtcyA9IHBhcmFtcyB8fCB7IGJ1YmJsZXM6IGZhbHNlLCBjYW5jZWxhYmxlOiBmYWxzZSwgZGV0YWlsOiB1bmRlZmluZWQgfTtcbiAgICB2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoICdDdXN0b21FdmVudCcgKTtcbiAgICBldnQuaW5pdEN1c3RvbUV2ZW50KCBldmVudCwgcGFyYW1zLmJ1YmJsZXMsIHBhcmFtcy5jYW5jZWxhYmxlLCBwYXJhbXMuZGV0YWlsICk7XG4gICAgcmV0dXJuIGV2dDtcbiAgIH1cblxuICBDdXN0b21FdmVudC5wcm90b3R5cGUgPSB3aW5kb3cuRXZlbnQucHJvdG90eXBlO1xuXG4gIHdpbmRvdy5DdXN0b21FdmVudCA9IEN1c3RvbUV2ZW50O1xufSkoKTtcbn0se31dLDM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjb2xvclNjYWxlR2VuZXJhdG9yKHByb3BlcnR5LCBkYXRhKXtcbiAgcmV0dXJuIGQzLnNjYWxlLmxpbmVhcigpXG4gICAgLmRvbWFpbihkMy5leHRlbnQoZGF0YSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gK2RbcHJvcGVydHldOyB9KSlcbiAgICAucmFuZ2UoWydoc2woMCwgNjAlLCA1MCUpJywgJ2hzbCgyNTUsIDYwJSwgNTAlKSddKSAvLyByZWQgdG8gYmx1ZVxuICAgIC5pbnRlcnBvbGF0ZShkMy5pbnRlcnBvbGF0ZUhzbCk7XG59O1xufSx7fV0sNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGludGVycG9sYXRvcihwb2ludHMpe1xuICB2YXIgcG9pbnQsIFxuICAgIGFjdGlvbiA9ICcnLCBcbiAgICBsaW5lQnVpbGRlciA9IFtdO1xuXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoIC0gMTsgaSsrKXtcbiAgICBwb2ludCA9IHBvaW50c1tpXTtcblxuICAgIGlmKGlzTmFOKHBvaW50WzFdKSl7XG4gICAgICBpZihhY3Rpb24gIT09ICcnKSBhY3Rpb24gPSAnTSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpbmVCdWlsZGVyLnB1c2goYWN0aW9uLCBwb2ludCk7XG4gICAgICBhY3Rpb24gPSAnTCc7XG4gICAgfVxuICB9XG4gIFxuICBwb2ludCA9IHBvaW50c1twb2ludHMubGVuZ3RoIC0gMV07XG4gIGlmKCFpc05hTihwb2ludFsxXSkpe1xuICAgIGxpbmVCdWlsZGVyLnB1c2goYWN0aW9uLCBwb2ludCk7XG4gIH1cblxuICByZXR1cm4gbGluZUJ1aWxkZXIuam9pbignJyk7XG59O1xufSx7fV19LHt9LFsxXSlcbigxKVxufSk7XG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgZGVib3VuY2UgPSByZXF1aXJlKCdsb2Rhc2guZGVib3VuY2UnKSxcbiAgICBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnbG9kYXNoLmlzZnVuY3Rpb24nKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJ2xvZGFzaC5pc29iamVjdCcpO1xuXG4vKiogVXNlZCBhcyBhbiBpbnRlcm5hbCBgXy5kZWJvdW5jZWAgb3B0aW9ucyBvYmplY3QgKi9cbnZhciBkZWJvdW5jZU9wdGlvbnMgPSB7XG4gICdsZWFkaW5nJzogZmFsc2UsXG4gICdtYXhXYWl0JzogMCxcbiAgJ3RyYWlsaW5nJzogZmFsc2Vcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQsIHdoZW4gZXhlY3V0ZWQsIHdpbGwgb25seSBjYWxsIHRoZSBgZnVuY2AgZnVuY3Rpb25cbiAqIGF0IG1vc3Qgb25jZSBwZXIgZXZlcnkgYHdhaXRgIG1pbGxpc2Vjb25kcy4gUHJvdmlkZSBhbiBvcHRpb25zIG9iamVjdCB0b1xuICogaW5kaWNhdGUgdGhhdCBgZnVuY2Agc2hvdWxkIGJlIGludm9rZWQgb24gdGhlIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2VcbiAqIG9mIHRoZSBgd2FpdGAgdGltZW91dC4gU3Vic2VxdWVudCBjYWxscyB0byB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHdpbGxcbiAqIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0IGBmdW5jYCBjYWxsLlxuICpcbiAqIE5vdGU6IElmIGBsZWFkaW5nYCBhbmQgYHRyYWlsaW5nYCBvcHRpb25zIGFyZSBgdHJ1ZWAgYGZ1bmNgIHdpbGwgYmUgY2FsbGVkXG4gKiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIGlzXG4gKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBGdW5jdGlvbnNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHRocm90dGxlLlxuICogQHBhcmFtIHtudW1iZXJ9IHdhaXQgVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gdGhyb3R0bGUgZXhlY3V0aW9ucyB0by5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPXRydWVdIFNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdIFNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgdGhyb3R0bGVkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBhdm9pZCBleGNlc3NpdmVseSB1cGRhdGluZyB0aGUgcG9zaXRpb24gd2hpbGUgc2Nyb2xsaW5nXG4gKiB2YXIgdGhyb3R0bGVkID0gXy50aHJvdHRsZSh1cGRhdGVQb3NpdGlvbiwgMTAwKTtcbiAqIGpRdWVyeSh3aW5kb3cpLm9uKCdzY3JvbGwnLCB0aHJvdHRsZWQpO1xuICpcbiAqIC8vIGV4ZWN1dGUgYHJlbmV3VG9rZW5gIHdoZW4gdGhlIGNsaWNrIGV2ZW50IGlzIGZpcmVkLCBidXQgbm90IG1vcmUgdGhhbiBvbmNlIGV2ZXJ5IDUgbWludXRlc1xuICogalF1ZXJ5KCcuaW50ZXJhY3RpdmUnKS5vbignY2xpY2snLCBfLnRocm90dGxlKHJlbmV3VG9rZW4sIDMwMDAwMCwge1xuICogICAndHJhaWxpbmcnOiBmYWxzZVxuICogfSkpO1xuICovXG5mdW5jdGlvbiB0aHJvdHRsZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBsZWFkaW5nID0gdHJ1ZSxcbiAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcblxuICBpZiAoIWlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICB9XG4gIGlmIChvcHRpb25zID09PSBmYWxzZSkge1xuICAgIGxlYWRpbmcgPSBmYWxzZTtcbiAgfSBlbHNlIGlmIChpc09iamVjdChvcHRpb25zKSkge1xuICAgIGxlYWRpbmcgPSAnbGVhZGluZycgaW4gb3B0aW9ucyA/IG9wdGlvbnMubGVhZGluZyA6IGxlYWRpbmc7XG4gICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyBvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cbiAgZGVib3VuY2VPcHRpb25zLmxlYWRpbmcgPSBsZWFkaW5nO1xuICBkZWJvdW5jZU9wdGlvbnMubWF4V2FpdCA9IHdhaXQ7XG4gIGRlYm91bmNlT3B0aW9ucy50cmFpbGluZyA9IHRyYWlsaW5nO1xuXG4gIHJldHVybiBkZWJvdW5jZShmdW5jLCB3YWl0LCBkZWJvdW5jZU9wdGlvbnMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRocm90dGxlO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnbG9kYXNoLmlzZnVuY3Rpb24nKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJ2xvZGFzaC5pc29iamVjdCcpLFxuICAgIG5vdyA9IHJlcXVpcmUoJ2xvZGFzaC5ub3cnKTtcblxuLyogTmF0aXZlIG1ldGhvZCBzaG9ydGN1dHMgZm9yIG1ldGhvZHMgd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMgKi9cbnZhciBuYXRpdmVNYXggPSBNYXRoLm1heDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGRlbGF5IHRoZSBleGVjdXRpb24gb2YgYGZ1bmNgIHVudGlsIGFmdGVyXG4gKiBgd2FpdGAgbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIGl0IHdhcyBpbnZva2VkLlxuICogUHJvdmlkZSBhbiBvcHRpb25zIG9iamVjdCB0byBpbmRpY2F0ZSB0aGF0IGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvblxuICogdGhlIGxlYWRpbmcgYW5kL29yIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIGB3YWl0YCB0aW1lb3V0LiBTdWJzZXF1ZW50IGNhbGxzXG4gKiB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGNhbGwuXG4gKlxuICogTm90ZTogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCBgZnVuY2Agd2lsbCBiZSBjYWxsZWRcbiAqIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gaXNcbiAqIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gd2FpdCBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPWZhbHNlXSBTcGVjaWZ5IGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdhaXRdIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmUgZGVsYXllZCBiZWZvcmUgaXQncyBjYWxsZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdIFNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiAvLyBhdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4XG4gKiB2YXIgbGF6eUxheW91dCA9IF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApO1xuICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIGxhenlMYXlvdXQpO1xuICpcbiAqIC8vIGV4ZWN1dGUgYHNlbmRNYWlsYCB3aGVuIHRoZSBjbGljayBldmVudCBpcyBmaXJlZCwgZGVib3VuY2luZyBzdWJzZXF1ZW50IGNhbGxzXG4gKiBqUXVlcnkoJyNwb3N0Ym94Jykub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XG4gKiAgICdsZWFkaW5nJzogdHJ1ZSxcbiAqICAgJ3RyYWlsaW5nJzogZmFsc2VcbiAqIH0pO1xuICpcbiAqIC8vIGVuc3VyZSBgYmF0Y2hMb2dgIGlzIGV4ZWN1dGVkIG9uY2UgYWZ0ZXIgMSBzZWNvbmQgb2YgZGVib3VuY2VkIGNhbGxzXG4gKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XG4gKiBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIF8uZGVib3VuY2UoYmF0Y2hMb2csIDI1MCwge1xuICogICAnbWF4V2FpdCc6IDEwMDBcbiAqIH0sIGZhbHNlKTtcbiAqL1xuZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICB2YXIgYXJncyxcbiAgICAgIG1heFRpbWVvdXRJZCxcbiAgICAgIHJlc3VsdCxcbiAgICAgIHN0YW1wLFxuICAgICAgdGhpc0FyZyxcbiAgICAgIHRpbWVvdXRJZCxcbiAgICAgIHRyYWlsaW5nQ2FsbCxcbiAgICAgIGxhc3RDYWxsZWQgPSAwLFxuICAgICAgbWF4V2FpdCA9IGZhbHNlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICghaXNGdW5jdGlvbihmdW5jKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gIH1cbiAgd2FpdCA9IG5hdGl2ZU1heCgwLCB3YWl0KSB8fCAwO1xuICBpZiAob3B0aW9ucyA9PT0gdHJ1ZSkge1xuICAgIHZhciBsZWFkaW5nID0gdHJ1ZTtcbiAgICB0cmFpbGluZyA9IGZhbHNlO1xuICB9IGVsc2UgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgbGVhZGluZyA9IG9wdGlvbnMubGVhZGluZztcbiAgICBtYXhXYWl0ID0gJ21heFdhaXQnIGluIG9wdGlvbnMgJiYgKG5hdGl2ZU1heCh3YWl0LCBvcHRpb25zLm1heFdhaXQpIHx8IDApO1xuICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gb3B0aW9ucy50cmFpbGluZyA6IHRyYWlsaW5nO1xuICB9XG4gIHZhciBkZWxheWVkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93KCkgLSBzdGFtcCk7XG4gICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7XG4gICAgICBpZiAobWF4VGltZW91dElkKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xuICAgICAgfVxuICAgICAgdmFyIGlzQ2FsbGVkID0gdHJhaWxpbmdDYWxsO1xuICAgICAgbWF4VGltZW91dElkID0gdGltZW91dElkID0gdHJhaWxpbmdDYWxsID0gdW5kZWZpbmVkO1xuICAgICAgaWYgKGlzQ2FsbGVkKSB7XG4gICAgICAgIGxhc3RDYWxsZWQgPSBub3coKTtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICAgICAgaWYgKCF0aW1lb3V0SWQgJiYgIW1heFRpbWVvdXRJZCkge1xuICAgICAgICAgIGFyZ3MgPSB0aGlzQXJnID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHJlbWFpbmluZyk7XG4gICAgfVxuICB9O1xuXG4gIHZhciBtYXhEZWxheWVkID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRpbWVvdXRJZCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfVxuICAgIG1heFRpbWVvdXRJZCA9IHRpbWVvdXRJZCA9IHRyYWlsaW5nQ2FsbCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHJhaWxpbmcgfHwgKG1heFdhaXQgIT09IHdhaXQpKSB7XG4gICAgICBsYXN0Q2FsbGVkID0gbm93KCk7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgICAgaWYgKCF0aW1lb3V0SWQgJiYgIW1heFRpbWVvdXRJZCkge1xuICAgICAgICBhcmdzID0gdGhpc0FyZyA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgIHN0YW1wID0gbm93KCk7XG4gICAgdGhpc0FyZyA9IHRoaXM7XG4gICAgdHJhaWxpbmdDYWxsID0gdHJhaWxpbmcgJiYgKHRpbWVvdXRJZCB8fCAhbGVhZGluZyk7XG5cbiAgICBpZiAobWF4V2FpdCA9PT0gZmFsc2UpIHtcbiAgICAgIHZhciBsZWFkaW5nQ2FsbCA9IGxlYWRpbmcgJiYgIXRpbWVvdXRJZDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFtYXhUaW1lb3V0SWQgJiYgIWxlYWRpbmcpIHtcbiAgICAgICAgbGFzdENhbGxlZCA9IHN0YW1wO1xuICAgICAgfVxuICAgICAgdmFyIHJlbWFpbmluZyA9IG1heFdhaXQgLSAoc3RhbXAgLSBsYXN0Q2FsbGVkKSxcbiAgICAgICAgICBpc0NhbGxlZCA9IHJlbWFpbmluZyA8PSAwO1xuXG4gICAgICBpZiAoaXNDYWxsZWQpIHtcbiAgICAgICAgaWYgKG1heFRpbWVvdXRJZCkge1xuICAgICAgICAgIG1heFRpbWVvdXRJZCA9IGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xuICAgICAgICB9XG4gICAgICAgIGxhc3RDYWxsZWQgPSBzdGFtcDtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKCFtYXhUaW1lb3V0SWQpIHtcbiAgICAgICAgbWF4VGltZW91dElkID0gc2V0VGltZW91dChtYXhEZWxheWVkLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNDYWxsZWQgJiYgdGltZW91dElkKSB7XG4gICAgICB0aW1lb3V0SWQgPSBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoIXRpbWVvdXRJZCAmJiB3YWl0ICE9PSBtYXhXYWl0KSB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHdhaXQpO1xuICAgIH1cbiAgICBpZiAobGVhZGluZ0NhbGwpIHtcbiAgICAgIGlzQ2FsbGVkID0gdHJ1ZTtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgfVxuICAgIGlmIChpc0NhbGxlZCAmJiAhdGltZW91dElkICYmICFtYXhUaW1lb3V0SWQpIHtcbiAgICAgIGFyZ3MgPSB0aGlzQXJnID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZTtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG52YXIgaXNOYXRpdmUgPSByZXF1aXJlKCdsb2Rhc2guX2lzbmF0aXZlJyk7XG5cbi8qKlxuICogR2V0cyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgVW5peCBlcG9jaFxuICogKDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBVdGlsaXRpZXNcbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIHN0YW1wID0gXy5ub3coKTtcbiAqIF8uZGVmZXIoZnVuY3Rpb24oKSB7IGNvbnNvbGUubG9nKF8ubm93KCkgLSBzdGFtcCk7IH0pO1xuICogLy8gPT4gbG9ncyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBpdCB0b29rIGZvciB0aGUgZGVmZXJyZWQgZnVuY3Rpb24gdG8gYmUgY2FsbGVkXG4gKi9cbnZhciBub3cgPSBpc05hdGl2ZShub3cgPSBEYXRlLm5vdykgJiYgbm93IHx8IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vdztcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGludGVybmFsIFtbQ2xhc3NdXSBvZiB2YWx1ZXMgKi9cbnZhciB0b1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlICovXG52YXIgcmVOYXRpdmUgPSBSZWdFeHAoJ14nICtcbiAgU3RyaW5nKHRvU3RyaW5nKVxuICAgIC5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgJ1xcXFwkJicpXG4gICAgLnJlcGxhY2UoL3RvU3RyaW5nfCBmb3IgW15cXF1dKy9nLCAnLio/JykgKyAnJCdcbik7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzTmF0aXZlKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJiByZU5hdGl2ZS50ZXN0KHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc05hdGl2ZTtcbiIsIi8qKlxuICogTG8tRGFzaCAyLjQuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cDovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBtb2Rlcm4gZXhwb3J0cz1cIm5wbVwiIC1vIC4vbnBtL2BcbiAqIENvcHlyaWdodCAyMDEyLTIwMTMgVGhlIERvam8gRm91bmRhdGlvbiA8aHR0cDovL2Rvam9mb3VuZGF0aW9uLm9yZy8+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuNS4yIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICovXG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBmdW5jdGlvbi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdHNcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGEgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Z1bmN0aW9uO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBvYmplY3RUeXBlcyA9IHJlcXVpcmUoJ2xvZGFzaC5fb2JqZWN0dHlwZXMnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGUgbGFuZ3VhZ2UgdHlwZSBvZiBPYmplY3QuXG4gKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdHNcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdCgxKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIC8vIGNoZWNrIGlmIHRoZSB2YWx1ZSBpcyB0aGUgRUNNQVNjcmlwdCBsYW5ndWFnZSB0eXBlIG9mIE9iamVjdFxuICAvLyBodHRwOi8vZXM1LmdpdGh1Yi5pby8jeDhcbiAgLy8gYW5kIGF2b2lkIGEgVjggYnVnXG4gIC8vIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTFcbiAgcmV0dXJuICEhKHZhbHVlICYmIG9iamVjdFR5cGVzW3R5cGVvZiB2YWx1ZV0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzT2JqZWN0O1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHZhbHVlcyBhcmUgb2YgdGhlIGxhbmd1YWdlIHR5cGUgT2JqZWN0ICovXG52YXIgb2JqZWN0VHlwZXMgPSB7XG4gICdib29sZWFuJzogZmFsc2UsXG4gICdmdW5jdGlvbic6IHRydWUsXG4gICdvYmplY3QnOiB0cnVlLFxuICAnbnVtYmVyJzogZmFsc2UsXG4gICdzdHJpbmcnOiBmYWxzZSxcbiAgJ3VuZGVmaW5lZCc6IGZhbHNlXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdFR5cGVzO1xuIiwidmFyIHBhcmFsbGVsQ29vcmRpbmF0ZUNoYXJ0ID0gcmVxdWlyZSgncGFyYWxsZWwtY29vcmRpbmF0ZXMtY2hhcnQnKTtcclxudmFyIHRocm90dGxlID0gcmVxdWlyZSgnbG9kYXNoLnRocm90dGxlJyk7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgncGFyYWxsZWxDb29yZGluYXRlc0NoYXJ0JywgW10pXHJcbi5kaXJlY3RpdmUoJ3BhcmFsbGVsQ29vcmRpbmF0ZXNDaGFydCcsIGZ1bmN0aW9uIHBhcmFsbGVsQ29vcmRpbmF0ZXNDaGFydCgpe1xyXG4gIHJldHVybiB7XHJcbiAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgc2NvcGU6IHtcclxuICAgICAgJ2RhdGEnOiAnPScsXHJcbiAgICAgICdzZWxlY3QnOiAnPScsXHJcbiAgICAgICdjb25maWcnOiAnPScsXHJcbiAgICAgICdoaWdobGlnaHQnOiAnQCcsXHJcbiAgICAgICd3aWR0aCc6ICdAJyxcclxuICAgICAgJ2hlaWdodCc6ICdAJ1xyXG4gICAgfSxcclxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgIHZhciBjaGFydCA9IHBhcmFsbGVsQ29vcmRpbmF0ZUNoYXJ0KCk7XHJcbiAgICAgIHZhciBkM0VsZW1lbnQgPSBkMy5zZWxlY3QoZWxlbWVudFswXSk7XHJcbiAgICAgIHZhciBkYXRhO1xyXG5cclxuICAgICAgLy8gUHJldmVudCBhdHRlbXB0cyB0byBkcmF3IG1vcmUgdGhhbiBvbmNlIGEgZnJhbWVcclxuICAgICAgdmFyIHRocm90dGxlZFJlZHJhdyA9IHRocm90dGxlKGNoYXJ0LnJlZHJhdywgMTYpO1xyXG5cclxuICAgICAgZnVuY3Rpb24gcmVkcmF3KCl7XHJcbiAgICAgICAgaWYoIWRhdGEpIHJldHVybjtcclxuICAgICAgICB0aHJvdHRsZWRSZWRyYXcoZDNFbGVtZW50KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc2NvcGUuJHdhdGNoKGF0dHJzLnNlbGVjdCwgZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgIGlmKHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybjtcclxuICAgICAgICBjaGFydC5kaW1lbnNpb25zKHZhbHVlKTtcclxuICAgICAgICByZWRyYXcoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBhdHRycy4kb2JzZXJ2ZSgnaGlnaGxpZ2h0JywgZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgIGNoYXJ0LmhpZ2hsaWdodCh2YWx1ZSB8fCAnJyk7XHJcbiAgICAgICAgcmVkcmF3KCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgYXR0cnMuJG9ic2VydmUoJ3dpZHRoJywgZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgIGlmKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkgcmV0dXJuO1xyXG4gICAgICAgIGNoYXJ0LndpZHRoKHZhbHVlKTtcclxuICAgICAgICByZWRyYXcoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBhdHRycy4kb2JzZXJ2ZSgnaGVpZ2h0JywgZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgIGlmKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkgcmV0dXJuO1xyXG4gICAgICAgIGNoYXJ0LmhlaWdodCh2YWx1ZSk7XHJcbiAgICAgICAgcmVkcmF3KCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgc2NvcGUuJHdhdGNoKGF0dHJzLmNvbmZpZywgZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgIGlmKCF2YWx1ZSkgcmV0dXJuO1xyXG4gICAgICAgIFxyXG4gICAgICAgIE9iamVjdC5rZXlzKHZhbHVlKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSl7XHJcbiAgICAgICAgICBjaGFydFtrZXldKHZhbHVlW2tleV0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHNjb3BlLiR3YXRjaChhdHRycy5kYXRhLCBmdW5jdGlvbih2YWx1ZSl7XHJcbiAgICAgICAgaWYoIXZhbHVlKSByZXR1cm47XHJcbiAgICAgICAgZGF0YSA9IHZhbHVlO1xyXG4gICAgICAgIGQzRWxlbWVudC5kYXR1bSh2YWx1ZSkuY2FsbChjaGFydC5kcmF3KTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxufSk7Il19
(10)
});
