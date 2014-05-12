!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.angularParallelCoordinates=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"8amN2b":[function(_dereq_,module,exports){
(function (global){
!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.parallelCoordinatesChart=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// Borrows heavily from http://bl.ocks.org/mbostock/7586334

var interpolator = _dereq_('./interpolator'),
  defaultColorGenerator = _dereq_('./colorGenerator');

function defaultDomainGenerator(dimension, data){
  return d3.extent(data, function(d) { return +d[dimension]; });
}

module.exports = function parallelCoordinatesChart(config){
  config || (config = {});

  var margin = [30, 10, 10, 10];
  var width = 1560;
  var height = 500;
  var innerWidth = width - margin[1] - margin[3];
  var innerHeight = height - margin[0] - margin[2];
  var x = d3.scale.ordinal().rangePoints([0, innerWidth], 1);
  var selectedProperty = '';
  var dimensions;
  var colorGenerator = defaultColorGenerator;
  var domainGenerator = defaultDomainGenerator;

  var line = d3.svg.line().interpolate(interpolator);
  var axis = d3.svg.axis().orient('left');

  // When brushing, don’t trigger axis dragging.
  function brushStartHandler() {
    d3.event.sourceEvent.stopPropagation();
  }

  function chart(selection){
    // Just in case we're drawing it in multiple places
    selection.each(function(data){
      if(!data) return;
      var y = {},
        dragging = {};

      var svg = d3.select(this)
        .selectAll('svg')
          .data([data])
        .enter()
          .append('svg')
            .attr('class', 'parallel-coordinates-chart')
            .attr('width', innerWidth + margin[1] + margin[3])
            .attr('height', innerHeight + margin[0] + margin[2])
            .append('g')
              .attr('transform', 'translate(' + margin[3] + ',' + margin[0] + ')');

      // Extract the list of dimensions and create a scale for each.
      if(!dimensions) dimensions = Object.keys(data[0]);
      x.domain(dimensions);
      dimensions.forEach(function(d) {
        y[d] = d3.scale.linear()
                .range([innerHeight, 0])
                .domain(domainGenerator(d, data));
      });

      // Add grey background lines for context.
      var background = svg.append('g')
          .attr('class', 'background')
        .selectAll('path')
          .data(data)
        .enter().append('path')
          .attr('d', path);

      // Add blue foreground lines for focus.
      var foreground = svg.append('g')
          .attr('class', 'foreground')
        .selectAll('path')
          .data(data)
        .enter().append('path')
          .attr('d', path);

      // Add a group element for each dimension.
      var g = svg.selectAll('.dimension')
          .data(dimensions)
        .enter().append('g')
          .attr('class', 'dimension')
          .attr('transform', function(d) { return 'translate(' + x(d) + ')'; })
          .on('click', function(d){
            if (d3.event.defaultPrevented) return; // click suppressed
            if(d === selectedProperty) setProperty('');
            else setProperty(d);
          })
          .call(d3.behavior.drag()
            .on('dragstart', function(d) {
              dragging[d] = this.__origin__ = x(d);
              background.attr('visibility', 'hidden');
            })
            .on('drag', function(d) {
              dragging[d] = Math.min(innerWidth, Math.max(0, this.__origin__ += d3.event.dx));
              foreground.attr('d', path);
              dimensions.sort(function(a, b) { return position(a) - position(b); });
              x.domain(dimensions);
              g.attr('transform', function(d) { return 'translate(' + position(d) + ')'; });
            })
            .on('dragend', function(d) {
              delete this.__origin__;
              delete dragging[d];
              d3.select(this).attr('transform', 'translate(' + x(d) + ')');
              foreground.attr('d', path);
              background.attr('d', path)
                  .attr('visibility', null);
            }));

      // Add an axis and title.
      g.append('g')
          .attr('class', 'axis')
          .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -9)
          .text(String);

      // Add and store a brush for each axis.
      g.append('g')
          .attr('class', 'brush')
          .each(function(d) { 
            d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on('brushstart', brushStartHandler).on('brush', brush)); 
          })
        .selectAll('rect')
          .attr('x', -8)
          .attr('width', 16);

      setProperty(selectedProperty);

      function setProperty(p){
        selectedProperty = p;
        
        svg.selectAll('.dimension.selected').attr('class', 'dimension');
        svg.selectAll('.dimension')
          .each(function(d){
            if(d === selectedProperty){
              d3.select(this).attr('class', 'dimension selected');      
            }
          });
        if(!p) return foreground.style('stroke', '');

        var color = colorGenerator(p, data);
        foreground.style('stroke', function(d){ 
            if(!d[p]) return 'gray';
            return color(d[p]);   
          });
      }
      

      // Handles a brush event, toggling the display of foreground lines.
      function brush() {
        var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
            extents = actives.map(function(p) { return y[p].brush.extent(); });
        
        foreground.attr('class', function(d) {
          var visible = actives.every(function(p, i) {
            return extents[i][0] <= d[p] && d[p] <= extents[i][1];
          });
          return visible ? 'active' : 'filtered';
        });
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
    });
  }

  chart.width = function(_){
    if (!arguments.length) return width;
    width = _;
    innerWidth = width - margin[1] - margin[3];
    x = d3.scale.ordinal().rangePoints([0, innerWidth], 1);
    return chart;
  };

  chart.height = function(_){
    if (!arguments.length) return height;
    height = _;
    innerHeight = height - margin[0] - margin[2];
    return chart;
  };

  chart.margin = function(_){
    if (!arguments.length) return margin;
    margin = _;
    chart.width(width);
    chart.height(height);
    return chart;
  };

  chart.select = function(_){
    if (!arguments.length) return dimensions;
    dimensions = _;
    return chart;
  };

  chart.domain = function(_){
    if (!arguments.length) return domainGenerator;
    domainGenerator = _;
    return chart;
  };
  
  chart.color = function(_){
    if (!arguments.length) return colorGenerator;
    colorGenerator = _;
    return chart;
  };

  chart.highlight = function(_){
    if (!arguments.length) return selectedProperty;
    selectedProperty = _;
    return chart;
  };

  chart.redraw = function(selection){
    selection.selectAll('svg').remove();
    chart(selection);
    return chart;
  };

  chart.draw = function(selection){
    chart(selection);
    return chart;
  };

  if('width' in config) chart.width(config.width);
  if('height' in config) chart.height(config.height);
  if('margin' in config) chart.margin(config.margin);
  if('select' in config) chart.select(config.select);
  if('domain' in config) chart.domain(config.domain);
  if('highlight' in config) chart.highlight(config.highlight);
  if('color' in config) chart.color(config.color);

  return chart;
};

},{"./colorGenerator":2,"./interpolator":4}],2:[function(_dereq_,module,exports){
var colorbrewer = _dereq_('./colorbrewer');

module.exports = function colorGenerator(property, data){
  var range = colorbrewer.RdYlGn[10].slice(0);
  
  return d3.scale.quantile()
    .range(range)
    .domain(d3.extent(data, function(d) { return +d[property]; }));
};
},{"./colorbrewer":3}],3:[function(_dereq_,module,exports){
// Copied from D3: https://github.com/mbostock/d3/blob/master/lib/colorbrewer/colorbrewer.js
// This product includes color specifications and designs developed by Cynthia Brewer (http://colorbrewer.org/).
module.exports = {YlGn: {
3: ['#f7fcb9','#addd8e','#31a354'],
4: ['#ffffcc','#c2e699','#78c679','#238443'],
5: ['#ffffcc','#c2e699','#78c679','#31a354','#006837'],
6: ['#ffffcc','#d9f0a3','#addd8e','#78c679','#31a354','#006837'],
7: ['#ffffcc','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#005a32'],
8: ['#ffffe5','#f7fcb9','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#005a32'],
9: ['#ffffe5','#f7fcb9','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#006837','#004529']
},YlGnBu: {
3: ['#edf8b1','#7fcdbb','#2c7fb8'],
4: ['#ffffcc','#a1dab4','#41b6c4','#225ea8'],
5: ['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#253494'],
6: ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#2c7fb8','#253494'],
7: ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84'],
8: ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84'],
9: ['#ffffd9','#edf8b1','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#253494','#081d58']
},GnBu: {
3: ['#e0f3db','#a8ddb5','#43a2ca'],
4: ['#f0f9e8','#bae4bc','#7bccc4','#2b8cbe'],
5: ['#f0f9e8','#bae4bc','#7bccc4','#43a2ca','#0868ac'],
6: ['#f0f9e8','#ccebc5','#a8ddb5','#7bccc4','#43a2ca','#0868ac'],
7: ['#f0f9e8','#ccebc5','#a8ddb5','#7bccc4','#4eb3d3','#2b8cbe','#08589e'],
8: ['#f7fcf0','#e0f3db','#ccebc5','#a8ddb5','#7bccc4','#4eb3d3','#2b8cbe','#08589e'],
9: ['#f7fcf0','#e0f3db','#ccebc5','#a8ddb5','#7bccc4','#4eb3d3','#2b8cbe','#0868ac','#084081']
},BuGn: {
3: ['#e5f5f9','#99d8c9','#2ca25f'],
4: ['#edf8fb','#b2e2e2','#66c2a4','#238b45'],
5: ['#edf8fb','#b2e2e2','#66c2a4','#2ca25f','#006d2c'],
6: ['#edf8fb','#ccece6','#99d8c9','#66c2a4','#2ca25f','#006d2c'],
7: ['#edf8fb','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824'],
8: ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#005824'],
9: ['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#006d2c','#00441b']
},PuBuGn: {
3: ['#ece2f0','#a6bddb','#1c9099'],
4: ['#f6eff7','#bdc9e1','#67a9cf','#02818a'],
5: ['#f6eff7','#bdc9e1','#67a9cf','#1c9099','#016c59'],
6: ['#f6eff7','#d0d1e6','#a6bddb','#67a9cf','#1c9099','#016c59'],
7: ['#f6eff7','#d0d1e6','#a6bddb','#67a9cf','#3690c0','#02818a','#016450'],
8: ['#fff7fb','#ece2f0','#d0d1e6','#a6bddb','#67a9cf','#3690c0','#02818a','#016450'],
9: ['#fff7fb','#ece2f0','#d0d1e6','#a6bddb','#67a9cf','#3690c0','#02818a','#016c59','#014636']
},PuBu: {
3: ['#ece7f2','#a6bddb','#2b8cbe'],
4: ['#f1eef6','#bdc9e1','#74a9cf','#0570b0'],
5: ['#f1eef6','#bdc9e1','#74a9cf','#2b8cbe','#045a8d'],
6: ['#f1eef6','#d0d1e6','#a6bddb','#74a9cf','#2b8cbe','#045a8d'],
7: ['#f1eef6','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#034e7b'],
8: ['#fff7fb','#ece7f2','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#034e7b'],
9: ['#fff7fb','#ece7f2','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#045a8d','#023858']
},BuPu: {
3: ['#e0ecf4','#9ebcda','#8856a7'],
4: ['#edf8fb','#b3cde3','#8c96c6','#88419d'],
5: ['#edf8fb','#b3cde3','#8c96c6','#8856a7','#810f7c'],
6: ['#edf8fb','#bfd3e6','#9ebcda','#8c96c6','#8856a7','#810f7c'],
7: ['#edf8fb','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#6e016b'],
8: ['#f7fcfd','#e0ecf4','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#6e016b'],
9: ['#f7fcfd','#e0ecf4','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#810f7c','#4d004b']
},RdPu: {
3: ['#fde0dd','#fa9fb5','#c51b8a'],
4: ['#feebe2','#fbb4b9','#f768a1','#ae017e'],
5: ['#feebe2','#fbb4b9','#f768a1','#c51b8a','#7a0177'],
6: ['#feebe2','#fcc5c0','#fa9fb5','#f768a1','#c51b8a','#7a0177'],
7: ['#feebe2','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177'],
8: ['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177'],
9: ['#fff7f3','#fde0dd','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177','#49006a']
},PuRd: {
3: ['#e7e1ef','#c994c7','#dd1c77'],
4: ['#f1eef6','#d7b5d8','#df65b0','#ce1256'],
5: ['#f1eef6','#d7b5d8','#df65b0','#dd1c77','#980043'],
6: ['#f1eef6','#d4b9da','#c994c7','#df65b0','#dd1c77','#980043'],
7: ['#f1eef6','#d4b9da','#c994c7','#df65b0','#e7298a','#ce1256','#91003f'],
8: ['#f7f4f9','#e7e1ef','#d4b9da','#c994c7','#df65b0','#e7298a','#ce1256','#91003f'],
9: ['#f7f4f9','#e7e1ef','#d4b9da','#c994c7','#df65b0','#e7298a','#ce1256','#980043','#67001f']
},OrRd: {
3: ['#fee8c8','#fdbb84','#e34a33'],
4: ['#fef0d9','#fdcc8a','#fc8d59','#d7301f'],
5: ['#fef0d9','#fdcc8a','#fc8d59','#e34a33','#b30000'],
6: ['#fef0d9','#fdd49e','#fdbb84','#fc8d59','#e34a33','#b30000'],
7: ['#fef0d9','#fdd49e','#fdbb84','#fc8d59','#ef6548','#d7301f','#990000'],
8: ['#fff7ec','#fee8c8','#fdd49e','#fdbb84','#fc8d59','#ef6548','#d7301f','#990000'],
9: ['#fff7ec','#fee8c8','#fdd49e','#fdbb84','#fc8d59','#ef6548','#d7301f','#b30000','#7f0000']
},YlOrRd: {
3: ['#ffeda0','#feb24c','#f03b20'],
4: ['#ffffb2','#fecc5c','#fd8d3c','#e31a1c'],
5: ['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026'],
6: ['#ffffb2','#fed976','#feb24c','#fd8d3c','#f03b20','#bd0026'],
7: ['#ffffb2','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#b10026'],
8: ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#b10026'],
9: ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026']
},YlOrBr: {
3: ['#fff7bc','#fec44f','#d95f0e'],
4: ['#ffffd4','#fed98e','#fe9929','#cc4c02'],
5: ['#ffffd4','#fed98e','#fe9929','#d95f0e','#993404'],
6: ['#ffffd4','#fee391','#fec44f','#fe9929','#d95f0e','#993404'],
7: ['#ffffd4','#fee391','#fec44f','#fe9929','#ec7014','#cc4c02','#8c2d04'],
8: ['#ffffe5','#fff7bc','#fee391','#fec44f','#fe9929','#ec7014','#cc4c02','#8c2d04'],
9: ['#ffffe5','#fff7bc','#fee391','#fec44f','#fe9929','#ec7014','#cc4c02','#993404','#662506']
},Purples: {
3: ['#efedf5','#bcbddc','#756bb1'],
4: ['#f2f0f7','#cbc9e2','#9e9ac8','#6a51a3'],
5: ['#f2f0f7','#cbc9e2','#9e9ac8','#756bb1','#54278f'],
6: ['#f2f0f7','#dadaeb','#bcbddc','#9e9ac8','#756bb1','#54278f'],
7: ['#f2f0f7','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486'],
8: ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486'],
9: ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#54278f','#3f007d']
},Blues: {
3: ['#deebf7','#9ecae1','#3182bd'],
4: ['#eff3ff','#bdd7e7','#6baed6','#2171b5'],
5: ['#eff3ff','#bdd7e7','#6baed6','#3182bd','#08519c'],
6: ['#eff3ff','#c6dbef','#9ecae1','#6baed6','#3182bd','#08519c'],
7: ['#eff3ff','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#084594'],
8: ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#084594'],
9: ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c','#08306b']
},Greens: {
3: ['#e5f5e0','#a1d99b','#31a354'],
4: ['#edf8e9','#bae4b3','#74c476','#238b45'],
5: ['#edf8e9','#bae4b3','#74c476','#31a354','#006d2c'],
6: ['#edf8e9','#c7e9c0','#a1d99b','#74c476','#31a354','#006d2c'],
7: ['#edf8e9','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#005a32'],
8: ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#005a32'],
9: ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#006d2c','#00441b']
},Oranges: {
3: ['#fee6ce','#fdae6b','#e6550d'],
4: ['#feedde','#fdbe85','#fd8d3c','#d94701'],
5: ['#feedde','#fdbe85','#fd8d3c','#e6550d','#a63603'],
6: ['#feedde','#fdd0a2','#fdae6b','#fd8d3c','#e6550d','#a63603'],
7: ['#feedde','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#8c2d04'],
8: ['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#8c2d04'],
9: ['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#a63603','#7f2704']
},Reds: {
3: ['#fee0d2','#fc9272','#de2d26'],
4: ['#fee5d9','#fcae91','#fb6a4a','#cb181d'],
5: ['#fee5d9','#fcae91','#fb6a4a','#de2d26','#a50f15'],
6: ['#fee5d9','#fcbba1','#fc9272','#fb6a4a','#de2d26','#a50f15'],
7: ['#fee5d9','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#99000d'],
8: ['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#99000d'],
9: ['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#a50f15','#67000d']
},Greys: {
3: ['#f0f0f0','#bdbdbd','#636363'],
4: ['#f7f7f7','#cccccc','#969696','#525252'],
5: ['#f7f7f7','#cccccc','#969696','#636363','#252525'],
6: ['#f7f7f7','#d9d9d9','#bdbdbd','#969696','#636363','#252525'],
7: ['#f7f7f7','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525'],
8: ['#ffffff','#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525'],
9: ['#ffffff','#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000']
},PuOr: {
3: ['#f1a340','#f7f7f7','#998ec3'],
4: ['#e66101','#fdb863','#b2abd2','#5e3c99'],
5: ['#e66101','#fdb863','#f7f7f7','#b2abd2','#5e3c99'],
6: ['#b35806','#f1a340','#fee0b6','#d8daeb','#998ec3','#542788'],
7: ['#b35806','#f1a340','#fee0b6','#f7f7f7','#d8daeb','#998ec3','#542788'],
8: ['#b35806','#e08214','#fdb863','#fee0b6','#d8daeb','#b2abd2','#8073ac','#542788'],
9: ['#b35806','#e08214','#fdb863','#fee0b6','#f7f7f7','#d8daeb','#b2abd2','#8073ac','#542788'],
10: ['#7f3b08','#b35806','#e08214','#fdb863','#fee0b6','#d8daeb','#b2abd2','#8073ac','#542788','#2d004b'],
11: ['#7f3b08','#b35806','#e08214','#fdb863','#fee0b6','#f7f7f7','#d8daeb','#b2abd2','#8073ac','#542788','#2d004b']
},BrBG: {
3: ['#d8b365','#f5f5f5','#5ab4ac'],
4: ['#a6611a','#dfc27d','#80cdc1','#018571'],
5: ['#a6611a','#dfc27d','#f5f5f5','#80cdc1','#018571'],
6: ['#8c510a','#d8b365','#f6e8c3','#c7eae5','#5ab4ac','#01665e'],
7: ['#8c510a','#d8b365','#f6e8c3','#f5f5f5','#c7eae5','#5ab4ac','#01665e'],
8: ['#8c510a','#bf812d','#dfc27d','#f6e8c3','#c7eae5','#80cdc1','#35978f','#01665e'],
9: ['#8c510a','#bf812d','#dfc27d','#f6e8c3','#f5f5f5','#c7eae5','#80cdc1','#35978f','#01665e'],
10: ['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#c7eae5','#80cdc1','#35978f','#01665e','#003c30'],
11: ['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#f5f5f5','#c7eae5','#80cdc1','#35978f','#01665e','#003c30']
},PRGn: {
3: ['#af8dc3','#f7f7f7','#7fbf7b'],
4: ['#7b3294','#c2a5cf','#a6dba0','#008837'],
5: ['#7b3294','#c2a5cf','#f7f7f7','#a6dba0','#008837'],
6: ['#762a83','#af8dc3','#e7d4e8','#d9f0d3','#7fbf7b','#1b7837'],
7: ['#762a83','#af8dc3','#e7d4e8','#f7f7f7','#d9f0d3','#7fbf7b','#1b7837'],
8: ['#762a83','#9970ab','#c2a5cf','#e7d4e8','#d9f0d3','#a6dba0','#5aae61','#1b7837'],
9: ['#762a83','#9970ab','#c2a5cf','#e7d4e8','#f7f7f7','#d9f0d3','#a6dba0','#5aae61','#1b7837'],
10: ['#40004b','#762a83','#9970ab','#c2a5cf','#e7d4e8','#d9f0d3','#a6dba0','#5aae61','#1b7837','#00441b'],
11: ['#40004b','#762a83','#9970ab','#c2a5cf','#e7d4e8','#f7f7f7','#d9f0d3','#a6dba0','#5aae61','#1b7837','#00441b']
},PiYG: {
3: ['#e9a3c9','#f7f7f7','#a1d76a'],
4: ['#d01c8b','#f1b6da','#b8e186','#4dac26'],
5: ['#d01c8b','#f1b6da','#f7f7f7','#b8e186','#4dac26'],
6: ['#c51b7d','#e9a3c9','#fde0ef','#e6f5d0','#a1d76a','#4d9221'],
7: ['#c51b7d','#e9a3c9','#fde0ef','#f7f7f7','#e6f5d0','#a1d76a','#4d9221'],
8: ['#c51b7d','#de77ae','#f1b6da','#fde0ef','#e6f5d0','#b8e186','#7fbc41','#4d9221'],
9: ['#c51b7d','#de77ae','#f1b6da','#fde0ef','#f7f7f7','#e6f5d0','#b8e186','#7fbc41','#4d9221'],
10: ['#8e0152','#c51b7d','#de77ae','#f1b6da','#fde0ef','#e6f5d0','#b8e186','#7fbc41','#4d9221','#276419'],
11: ['#8e0152','#c51b7d','#de77ae','#f1b6da','#fde0ef','#f7f7f7','#e6f5d0','#b8e186','#7fbc41','#4d9221','#276419']
},RdBu: {
3: ['#ef8a62','#f7f7f7','#67a9cf'],
4: ['#ca0020','#f4a582','#92c5de','#0571b0'],
5: ['#ca0020','#f4a582','#f7f7f7','#92c5de','#0571b0'],
6: ['#b2182b','#ef8a62','#fddbc7','#d1e5f0','#67a9cf','#2166ac'],
7: ['#b2182b','#ef8a62','#fddbc7','#f7f7f7','#d1e5f0','#67a9cf','#2166ac'],
8: ['#b2182b','#d6604d','#f4a582','#fddbc7','#d1e5f0','#92c5de','#4393c3','#2166ac'],
9: ['#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac'],
10: ['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#d1e5f0','#92c5de','#4393c3','#2166ac','#053061'],
11: ['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac','#053061']
},RdGy: {
3: ['#ef8a62','#ffffff','#999999'],
4: ['#ca0020','#f4a582','#bababa','#404040'],
5: ['#ca0020','#f4a582','#ffffff','#bababa','#404040'],
6: ['#b2182b','#ef8a62','#fddbc7','#e0e0e0','#999999','#4d4d4d'],
7: ['#b2182b','#ef8a62','#fddbc7','#ffffff','#e0e0e0','#999999','#4d4d4d'],
8: ['#b2182b','#d6604d','#f4a582','#fddbc7','#e0e0e0','#bababa','#878787','#4d4d4d'],
9: ['#b2182b','#d6604d','#f4a582','#fddbc7','#ffffff','#e0e0e0','#bababa','#878787','#4d4d4d'],
10: ['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#e0e0e0','#bababa','#878787','#4d4d4d','#1a1a1a'],
11: ['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#ffffff','#e0e0e0','#bababa','#878787','#4d4d4d','#1a1a1a']
},RdYlBu: {
3: ['#fc8d59','#ffffbf','#91bfdb'],
4: ['#d7191c','#fdae61','#abd9e9','#2c7bb6'],
5: ['#d7191c','#fdae61','#ffffbf','#abd9e9','#2c7bb6'],
6: ['#d73027','#fc8d59','#fee090','#e0f3f8','#91bfdb','#4575b4'],
7: ['#d73027','#fc8d59','#fee090','#ffffbf','#e0f3f8','#91bfdb','#4575b4'],
8: ['#d73027','#f46d43','#fdae61','#fee090','#e0f3f8','#abd9e9','#74add1','#4575b4'],
9: ['#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4'],
10: ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695'],
11: ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695']
},Spectral: {
3: ['#fc8d59','#ffffbf','#99d594'],
4: ['#d7191c','#fdae61','#abdda4','#2b83ba'],
5: ['#d7191c','#fdae61','#ffffbf','#abdda4','#2b83ba'],
6: ['#d53e4f','#fc8d59','#fee08b','#e6f598','#99d594','#3288bd'],
7: ['#d53e4f','#fc8d59','#fee08b','#ffffbf','#e6f598','#99d594','#3288bd'],
8: ['#d53e4f','#f46d43','#fdae61','#fee08b','#e6f598','#abdda4','#66c2a5','#3288bd'],
9: ['#d53e4f','#f46d43','#fdae61','#fee08b','#ffffbf','#e6f598','#abdda4','#66c2a5','#3288bd'],
10: ['#9e0142','#d53e4f','#f46d43','#fdae61','#fee08b','#e6f598','#abdda4','#66c2a5','#3288bd','#5e4fa2'],
11: ['#9e0142','#d53e4f','#f46d43','#fdae61','#fee08b','#ffffbf','#e6f598','#abdda4','#66c2a5','#3288bd','#5e4fa2']
},RdYlGn: {
3: ['#fc8d59','#ffffbf','#91cf60'],
4: ['#d7191c','#fdae61','#a6d96a','#1a9641'],
5: ['#d7191c','#fdae61','#ffffbf','#a6d96a','#1a9641'],
6: ['#d73027','#fc8d59','#fee08b','#d9ef8b','#91cf60','#1a9850'],
7: ['#d73027','#fc8d59','#fee08b','#ffffbf','#d9ef8b','#91cf60','#1a9850'],
8: ['#d73027','#f46d43','#fdae61','#fee08b','#d9ef8b','#a6d96a','#66bd63','#1a9850'],
9: ['#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850'],
10: ['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837'],
11: ['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837']
},Accent: {
3: ['#7fc97f','#beaed4','#fdc086'],
4: ['#7fc97f','#beaed4','#fdc086','#ffff99'],
5: ['#7fc97f','#beaed4','#fdc086','#ffff99','#386cb0'],
6: ['#7fc97f','#beaed4','#fdc086','#ffff99','#386cb0','#f0027f'],
7: ['#7fc97f','#beaed4','#fdc086','#ffff99','#386cb0','#f0027f','#bf5b17'],
8: ['#7fc97f','#beaed4','#fdc086','#ffff99','#386cb0','#f0027f','#bf5b17','#666666']
},Dark2: {
3: ['#1b9e77','#d95f02','#7570b3'],
4: ['#1b9e77','#d95f02','#7570b3','#e7298a'],
5: ['#1b9e77','#d95f02','#7570b3','#e7298a','#66a61e'],
6: ['#1b9e77','#d95f02','#7570b3','#e7298a','#66a61e','#e6ab02'],
7: ['#1b9e77','#d95f02','#7570b3','#e7298a','#66a61e','#e6ab02','#a6761d'],
8: ['#1b9e77','#d95f02','#7570b3','#e7298a','#66a61e','#e6ab02','#a6761d','#666666']
},Paired: {
3: ['#a6cee3','#1f78b4','#b2df8a'],
4: ['#a6cee3','#1f78b4','#b2df8a','#33a02c'],
5: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99'],
6: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c'],
7: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f'],
8: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00'],
9: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6'],
10: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a'],
11: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99'],
12: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928']
},Pastel1: {
3: ['#fbb4ae','#b3cde3','#ccebc5'],
4: ['#fbb4ae','#b3cde3','#ccebc5','#decbe4'],
5: ['#fbb4ae','#b3cde3','#ccebc5','#decbe4','#fed9a6'],
6: ['#fbb4ae','#b3cde3','#ccebc5','#decbe4','#fed9a6','#ffffcc'],
7: ['#fbb4ae','#b3cde3','#ccebc5','#decbe4','#fed9a6','#ffffcc','#e5d8bd'],
8: ['#fbb4ae','#b3cde3','#ccebc5','#decbe4','#fed9a6','#ffffcc','#e5d8bd','#fddaec'],
9: ['#fbb4ae','#b3cde3','#ccebc5','#decbe4','#fed9a6','#ffffcc','#e5d8bd','#fddaec','#f2f2f2']
},Pastel2: {
3: ['#b3e2cd','#fdcdac','#cbd5e8'],
4: ['#b3e2cd','#fdcdac','#cbd5e8','#f4cae4'],
5: ['#b3e2cd','#fdcdac','#cbd5e8','#f4cae4','#e6f5c9'],
6: ['#b3e2cd','#fdcdac','#cbd5e8','#f4cae4','#e6f5c9','#fff2ae'],
7: ['#b3e2cd','#fdcdac','#cbd5e8','#f4cae4','#e6f5c9','#fff2ae','#f1e2cc'],
8: ['#b3e2cd','#fdcdac','#cbd5e8','#f4cae4','#e6f5c9','#fff2ae','#f1e2cc','#cccccc']
},Set1: {
3: ['#e41a1c','#377eb8','#4daf4a'],
4: ['#e41a1c','#377eb8','#4daf4a','#984ea3'],
5: ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00'],
6: ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33'],
7: ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628'],
8: ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf'],
9: ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999']
},Set2: {
3: ['#66c2a5','#fc8d62','#8da0cb'],
4: ['#66c2a5','#fc8d62','#8da0cb','#e78ac3'],
5: ['#66c2a5','#fc8d62','#8da0cb','#e78ac3','#a6d854'],
6: ['#66c2a5','#fc8d62','#8da0cb','#e78ac3','#a6d854','#ffd92f'],
7: ['#66c2a5','#fc8d62','#8da0cb','#e78ac3','#a6d854','#ffd92f','#e5c494'],
8: ['#66c2a5','#fc8d62','#8da0cb','#e78ac3','#a6d854','#ffd92f','#e5c494','#b3b3b3']
},Set3: {
3: ['#8dd3c7','#ffffb3','#bebada'],
4: ['#8dd3c7','#ffffb3','#bebada','#fb8072'],
5: ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3'],
6: ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462'],
7: ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69'],
8: ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5'],
9: ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9'],
10: ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd'],
11: ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5'],
12: ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f']
}};
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

      // Prevent attempts to draw more than once a frame
      var redraw = throttle(chart.redraw, 16);

      scope.$watch(attrs.select, function(value){
        if(value === undefined) return;
        chart.dimensions(value);
        redraw(d3Element);
      });

      attrs.$observe('highlight', function(value){
        chart.highlight(value || '');
        redraw(d3Element);
      });

      attrs.$observe('width', function(value){
        if(!value && value !== 0) return;
        chart.width(value);
        redraw(d3Element);
      });

      attrs.$observe('height', function(value){
        if(!value && value !== 0) return;
        chart.height(value);
        redraw(d3Element);
      });

      scope.$watch(attrs.config, function(value){
        if(!value) return;
        
        Object.keys(value).forEach(function(key){
          chart[key](value[key]);
        });
      });

      scope.$watch(attrs.data, function(value){
        if(!value) return;
        
        d3Element.datum(value);
        redraw(d3Element);
      });
    }
  };
});
},{"lodash.throttle":3,"parallel-coordinates-chart":"8amN2b"}]},{},[10])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJjOlxcVXNlcnNcXG96YW5cXHdvcmtzcGFjZVxcYW5ndWxhci1wYXJhbGxlbC1jb29yZGluYXRlc1xcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJjOi9Vc2Vycy9vemFuL3dvcmtzcGFjZS9hbmd1bGFyLXBhcmFsbGVsLWNvb3JkaW5hdGVzL2Jvd2VyX2NvbXBvbmVudHMvcGFyYWxsZWwtY29vcmRpbmF0ZXMtY2hhcnQvZGlzdC9wYXJhbGxlbC1jb29yZGluYXRlcy1jaGFydC5qcyIsImM6L1VzZXJzL296YW4vd29ya3NwYWNlL2FuZ3VsYXItcGFyYWxsZWwtY29vcmRpbmF0ZXMvbm9kZV9tb2R1bGVzL2xvZGFzaC50aHJvdHRsZS9pbmRleC5qcyIsImM6L1VzZXJzL296YW4vd29ya3NwYWNlL2FuZ3VsYXItcGFyYWxsZWwtY29vcmRpbmF0ZXMvbm9kZV9tb2R1bGVzL2xvZGFzaC50aHJvdHRsZS9ub2RlX21vZHVsZXMvbG9kYXNoLmRlYm91bmNlL2luZGV4LmpzIiwiYzovVXNlcnMvb3phbi93b3Jrc3BhY2UvYW5ndWxhci1wYXJhbGxlbC1jb29yZGluYXRlcy9ub2RlX21vZHVsZXMvbG9kYXNoLnRocm90dGxlL25vZGVfbW9kdWxlcy9sb2Rhc2guZGVib3VuY2Uvbm9kZV9tb2R1bGVzL2xvZGFzaC5ub3cvaW5kZXguanMiLCJjOi9Vc2Vycy9vemFuL3dvcmtzcGFjZS9hbmd1bGFyLXBhcmFsbGVsLWNvb3JkaW5hdGVzL25vZGVfbW9kdWxlcy9sb2Rhc2gudGhyb3R0bGUvbm9kZV9tb2R1bGVzL2xvZGFzaC5kZWJvdW5jZS9ub2RlX21vZHVsZXMvbG9kYXNoLm5vdy9ub2RlX21vZHVsZXMvbG9kYXNoLl9pc25hdGl2ZS9pbmRleC5qcyIsImM6L1VzZXJzL296YW4vd29ya3NwYWNlL2FuZ3VsYXItcGFyYWxsZWwtY29vcmRpbmF0ZXMvbm9kZV9tb2R1bGVzL2xvZGFzaC50aHJvdHRsZS9ub2RlX21vZHVsZXMvbG9kYXNoLmlzZnVuY3Rpb24vaW5kZXguanMiLCJjOi9Vc2Vycy9vemFuL3dvcmtzcGFjZS9hbmd1bGFyLXBhcmFsbGVsLWNvb3JkaW5hdGVzL25vZGVfbW9kdWxlcy9sb2Rhc2gudGhyb3R0bGUvbm9kZV9tb2R1bGVzL2xvZGFzaC5pc29iamVjdC9pbmRleC5qcyIsImM6L1VzZXJzL296YW4vd29ya3NwYWNlL2FuZ3VsYXItcGFyYWxsZWwtY29vcmRpbmF0ZXMvbm9kZV9tb2R1bGVzL2xvZGFzaC50aHJvdHRsZS9ub2RlX21vZHVsZXMvbG9kYXNoLmlzb2JqZWN0L25vZGVfbW9kdWxlcy9sb2Rhc2guX29iamVjdHR5cGVzL2luZGV4LmpzIiwiYzovVXNlcnMvb3phbi93b3Jrc3BhY2UvYW5ndWxhci1wYXJhbGxlbC1jb29yZGluYXRlcy9zcmMvanMvbW9kdWxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM2tCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuIWZ1bmN0aW9uKGUpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzKW1vZHVsZS5leHBvcnRzPWUoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoZSk7ZWxzZXt2YXIgbztcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P289d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/bz1nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGYmJihvPXNlbGYpLG8ucGFyYWxsZWxDb29yZGluYXRlc0NoYXJ0PWUoKX19KGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLy8gQm9ycm93cyBoZWF2aWx5IGZyb20gaHR0cDovL2JsLm9ja3Mub3JnL21ib3N0b2NrLzc1ODYzMzRcblxudmFyIGludGVycG9sYXRvciA9IF9kZXJlcV8oJy4vaW50ZXJwb2xhdG9yJyksXG4gIGRlZmF1bHRDb2xvckdlbmVyYXRvciA9IF9kZXJlcV8oJy4vY29sb3JHZW5lcmF0b3InKTtcblxuZnVuY3Rpb24gZGVmYXVsdERvbWFpbkdlbmVyYXRvcihkaW1lbnNpb24sIGRhdGEpe1xuICByZXR1cm4gZDMuZXh0ZW50KGRhdGEsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuICtkW2RpbWVuc2lvbl07IH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcmFsbGVsQ29vcmRpbmF0ZXNDaGFydChjb25maWcpe1xuICBjb25maWcgfHwgKGNvbmZpZyA9IHt9KTtcblxuICB2YXIgbWFyZ2luID0gWzMwLCAxMCwgMTAsIDEwXTtcbiAgdmFyIHdpZHRoID0gMTU2MDtcbiAgdmFyIGhlaWdodCA9IDUwMDtcbiAgdmFyIGlubmVyV2lkdGggPSB3aWR0aCAtIG1hcmdpblsxXSAtIG1hcmdpblszXTtcbiAgdmFyIGlubmVySGVpZ2h0ID0gaGVpZ2h0IC0gbWFyZ2luWzBdIC0gbWFyZ2luWzJdO1xuICB2YXIgeCA9IGQzLnNjYWxlLm9yZGluYWwoKS5yYW5nZVBvaW50cyhbMCwgaW5uZXJXaWR0aF0sIDEpO1xuICB2YXIgc2VsZWN0ZWRQcm9wZXJ0eSA9ICcnO1xuICB2YXIgZGltZW5zaW9ucztcbiAgdmFyIGNvbG9yR2VuZXJhdG9yID0gZGVmYXVsdENvbG9yR2VuZXJhdG9yO1xuICB2YXIgZG9tYWluR2VuZXJhdG9yID0gZGVmYXVsdERvbWFpbkdlbmVyYXRvcjtcblxuICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKCkuaW50ZXJwb2xhdGUoaW50ZXJwb2xhdG9yKTtcbiAgdmFyIGF4aXMgPSBkMy5zdmcuYXhpcygpLm9yaWVudCgnbGVmdCcpO1xuXG4gIC8vIFdoZW4gYnJ1c2hpbmcsIGRvbuKAmXQgdHJpZ2dlciBheGlzIGRyYWdnaW5nLlxuICBmdW5jdGlvbiBicnVzaFN0YXJ0SGFuZGxlcigpIHtcbiAgICBkMy5ldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNoYXJ0KHNlbGVjdGlvbil7XG4gICAgLy8gSnVzdCBpbiBjYXNlIHdlJ3JlIGRyYXdpbmcgaXQgaW4gbXVsdGlwbGUgcGxhY2VzXG4gICAgc2VsZWN0aW9uLmVhY2goZnVuY3Rpb24oZGF0YSl7XG4gICAgICBpZighZGF0YSkgcmV0dXJuO1xuICAgICAgdmFyIHkgPSB7fSxcbiAgICAgICAgZHJhZ2dpbmcgPSB7fTtcblxuICAgICAgdmFyIHN2ZyA9IGQzLnNlbGVjdCh0aGlzKVxuICAgICAgICAuc2VsZWN0QWxsKCdzdmcnKVxuICAgICAgICAgIC5kYXRhKFtkYXRhXSlcbiAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3BhcmFsbGVsLWNvb3JkaW5hdGVzLWNoYXJ0JylcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGlubmVyV2lkdGggKyBtYXJnaW5bMV0gKyBtYXJnaW5bM10pXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgaW5uZXJIZWlnaHQgKyBtYXJnaW5bMF0gKyBtYXJnaW5bMl0pXG4gICAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIG1hcmdpblszXSArICcsJyArIG1hcmdpblswXSArICcpJyk7XG5cbiAgICAgIC8vIEV4dHJhY3QgdGhlIGxpc3Qgb2YgZGltZW5zaW9ucyBhbmQgY3JlYXRlIGEgc2NhbGUgZm9yIGVhY2guXG4gICAgICBpZighZGltZW5zaW9ucykgZGltZW5zaW9ucyA9IE9iamVjdC5rZXlzKGRhdGFbMF0pO1xuICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XG4gICAgICBkaW1lbnNpb25zLmZvckVhY2goZnVuY3Rpb24oZCkge1xuICAgICAgICB5W2RdID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgICAgICAgICAucmFuZ2UoW2lubmVySGVpZ2h0LCAwXSlcbiAgICAgICAgICAgICAgICAuZG9tYWluKGRvbWFpbkdlbmVyYXRvcihkLCBkYXRhKSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gQWRkIGdyZXkgYmFja2dyb3VuZCBsaW5lcyBmb3IgY29udGV4dC5cbiAgICAgIHZhciBiYWNrZ3JvdW5kID0gc3ZnLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2JhY2tncm91bmQnKVxuICAgICAgICAuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAgIC5hdHRyKCdkJywgcGF0aCk7XG5cbiAgICAgIC8vIEFkZCBibHVlIGZvcmVncm91bmQgbGluZXMgZm9yIGZvY3VzLlxuICAgICAgdmFyIGZvcmVncm91bmQgPSBzdmcuYXBwZW5kKCdnJylcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZm9yZWdyb3VuZCcpXG4gICAgICAgIC5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgLmF0dHIoJ2QnLCBwYXRoKTtcblxuICAgICAgLy8gQWRkIGEgZ3JvdXAgZWxlbWVudCBmb3IgZWFjaCBkaW1lbnNpb24uXG4gICAgICB2YXIgZyA9IHN2Zy5zZWxlY3RBbGwoJy5kaW1lbnNpb24nKVxuICAgICAgICAgIC5kYXRhKGRpbWVuc2lvbnMpXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RpbWVuc2lvbicpXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuICd0cmFuc2xhdGUoJyArIHgoZCkgKyAnKSc7IH0pXG4gICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgaWYgKGQzLmV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHJldHVybjsgLy8gY2xpY2sgc3VwcHJlc3NlZFxuICAgICAgICAgICAgaWYoZCA9PT0gc2VsZWN0ZWRQcm9wZXJ0eSkgc2V0UHJvcGVydHkoJycpO1xuICAgICAgICAgICAgZWxzZSBzZXRQcm9wZXJ0eShkKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYWxsKGQzLmJlaGF2aW9yLmRyYWcoKVxuICAgICAgICAgICAgLm9uKCdkcmFnc3RhcnQnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgIGRyYWdnaW5nW2RdID0gdGhpcy5fX29yaWdpbl9fID0geChkKTtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZC5hdHRyKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbignZHJhZycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgZHJhZ2dpbmdbZF0gPSBNYXRoLm1pbihpbm5lcldpZHRoLCBNYXRoLm1heCgwLCB0aGlzLl9fb3JpZ2luX18gKz0gZDMuZXZlbnQuZHgpKTtcbiAgICAgICAgICAgICAgZm9yZWdyb3VuZC5hdHRyKCdkJywgcGF0aCk7XG4gICAgICAgICAgICAgIGRpbWVuc2lvbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBwb3NpdGlvbihhKSAtIHBvc2l0aW9uKGIpOyB9KTtcbiAgICAgICAgICAgICAgeC5kb21haW4oZGltZW5zaW9ucyk7XG4gICAgICAgICAgICAgIGcuYXR0cigndHJhbnNmb3JtJywgZnVuY3Rpb24oZCkgeyByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgcG9zaXRpb24oZCkgKyAnKSc7IH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbignZHJhZ2VuZCcsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX19vcmlnaW5fXztcbiAgICAgICAgICAgICAgZGVsZXRlIGRyYWdnaW5nW2RdO1xuICAgICAgICAgICAgICBkMy5zZWxlY3QodGhpcykuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgeChkKSArICcpJyk7XG4gICAgICAgICAgICAgIGZvcmVncm91bmQuYXR0cignZCcsIHBhdGgpO1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kLmF0dHIoJ2QnLCBwYXRoKVxuICAgICAgICAgICAgICAgICAgLmF0dHIoJ3Zpc2liaWxpdHknLCBudWxsKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgLy8gQWRkIGFuIGF4aXMgYW5kIHRpdGxlLlxuICAgICAgZy5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdheGlzJylcbiAgICAgICAgICAuZWFjaChmdW5jdGlvbihkKSB7IGQzLnNlbGVjdCh0aGlzKS5jYWxsKGF4aXMuc2NhbGUoeVtkXSkpOyB9KVxuICAgICAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnbWlkZGxlJylcbiAgICAgICAgICAuYXR0cigneScsIC05KVxuICAgICAgICAgIC50ZXh0KFN0cmluZyk7XG5cbiAgICAgIC8vIEFkZCBhbmQgc3RvcmUgYSBicnVzaCBmb3IgZWFjaCBheGlzLlxuICAgICAgZy5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdicnVzaCcpXG4gICAgICAgICAgLmVhY2goZnVuY3Rpb24oZCkgeyBcbiAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5jYWxsKHlbZF0uYnJ1c2ggPSBkMy5zdmcuYnJ1c2goKS55KHlbZF0pLm9uKCdicnVzaHN0YXJ0JywgYnJ1c2hTdGFydEhhbmRsZXIpLm9uKCdicnVzaCcsIGJydXNoKSk7IFxuICAgICAgICAgIH0pXG4gICAgICAgIC5zZWxlY3RBbGwoJ3JlY3QnKVxuICAgICAgICAgIC5hdHRyKCd4JywgLTgpXG4gICAgICAgICAgLmF0dHIoJ3dpZHRoJywgMTYpO1xuXG4gICAgICBzZXRQcm9wZXJ0eShzZWxlY3RlZFByb3BlcnR5KTtcblxuICAgICAgZnVuY3Rpb24gc2V0UHJvcGVydHkocCl7XG4gICAgICAgIHNlbGVjdGVkUHJvcGVydHkgPSBwO1xuICAgICAgICBcbiAgICAgICAgc3ZnLnNlbGVjdEFsbCgnLmRpbWVuc2lvbi5zZWxlY3RlZCcpLmF0dHIoJ2NsYXNzJywgJ2RpbWVuc2lvbicpO1xuICAgICAgICBzdmcuc2VsZWN0QWxsKCcuZGltZW5zaW9uJylcbiAgICAgICAgICAuZWFjaChmdW5jdGlvbihkKXtcbiAgICAgICAgICAgIGlmKGQgPT09IHNlbGVjdGVkUHJvcGVydHkpe1xuICAgICAgICAgICAgICBkMy5zZWxlY3QodGhpcykuYXR0cignY2xhc3MnLCAnZGltZW5zaW9uIHNlbGVjdGVkJyk7ICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIGlmKCFwKSByZXR1cm4gZm9yZWdyb3VuZC5zdHlsZSgnc3Ryb2tlJywgJycpO1xuXG4gICAgICAgIHZhciBjb2xvciA9IGNvbG9yR2VuZXJhdG9yKHAsIGRhdGEpO1xuICAgICAgICBmb3JlZ3JvdW5kLnN0eWxlKCdzdHJva2UnLCBmdW5jdGlvbihkKXsgXG4gICAgICAgICAgICBpZighZFtwXSkgcmV0dXJuICdncmF5JztcbiAgICAgICAgICAgIHJldHVybiBjb2xvcihkW3BdKTsgICBcbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuXG4gICAgICAvLyBIYW5kbGVzIGEgYnJ1c2ggZXZlbnQsIHRvZ2dsaW5nIHRoZSBkaXNwbGF5IG9mIGZvcmVncm91bmQgbGluZXMuXG4gICAgICBmdW5jdGlvbiBicnVzaCgpIHtcbiAgICAgICAgdmFyIGFjdGl2ZXMgPSBkaW1lbnNpb25zLmZpbHRlcihmdW5jdGlvbihwKSB7IHJldHVybiAheVtwXS5icnVzaC5lbXB0eSgpOyB9KSxcbiAgICAgICAgICAgIGV4dGVudHMgPSBhY3RpdmVzLm1hcChmdW5jdGlvbihwKSB7IHJldHVybiB5W3BdLmJydXNoLmV4dGVudCgpOyB9KTtcbiAgICAgICAgXG4gICAgICAgIGZvcmVncm91bmQuYXR0cignY2xhc3MnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgdmFyIHZpc2libGUgPSBhY3RpdmVzLmV2ZXJ5KGZ1bmN0aW9uKHAsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiBleHRlbnRzW2ldWzBdIDw9IGRbcF0gJiYgZFtwXSA8PSBleHRlbnRzW2ldWzFdO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB2aXNpYmxlID8gJ2FjdGl2ZScgOiAnZmlsdGVyZWQnO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIHBvc2l0aW9uKGQpIHtcbiAgICAgICAgLy8gaWYgd2UncmUgY3VycmVudGx5IGRyYWdnaW5nIHRoZSBheGlzIHJldHVybiB0aGUgZHJhZyBwb3NpdGlvblxuICAgICAgICAvLyBvdGhlcndpc2UgcmV0dXJuIHRoZSBub3JtYWwgeC1heGlzIHBvc2l0aW9uXG4gICAgICAgIHZhciB2ID0gZHJhZ2dpbmdbZF07XG4gICAgICAgIHJldHVybiB2ID09IG51bGwgPyB4KGQpIDogdjtcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyB0aGUgcGF0aCBmb3IgYSBnaXZlbiBkYXRhIHBvaW50LlxuICAgICAgZnVuY3Rpb24gcGF0aChkKSB7XG4gICAgICAgIHJldHVybiBsaW5lKGRpbWVuc2lvbnMubWFwKGZ1bmN0aW9uKHApIHsgXG4gICAgICAgICAgcmV0dXJuIFtwb3NpdGlvbihwKSwgeVtwXShkW3BdKV07IFxuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjaGFydC53aWR0aCA9IGZ1bmN0aW9uKF8pe1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHdpZHRoO1xuICAgIHdpZHRoID0gXztcbiAgICBpbm5lcldpZHRoID0gd2lkdGggLSBtYXJnaW5bMV0gLSBtYXJnaW5bM107XG4gICAgeCA9IGQzLnNjYWxlLm9yZGluYWwoKS5yYW5nZVBvaW50cyhbMCwgaW5uZXJXaWR0aF0sIDEpO1xuICAgIHJldHVybiBjaGFydDtcbiAgfTtcblxuICBjaGFydC5oZWlnaHQgPSBmdW5jdGlvbihfKXtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBoZWlnaHQ7XG4gICAgaGVpZ2h0ID0gXztcbiAgICBpbm5lckhlaWdodCA9IGhlaWdodCAtIG1hcmdpblswXSAtIG1hcmdpblsyXTtcbiAgICByZXR1cm4gY2hhcnQ7XG4gIH07XG5cbiAgY2hhcnQubWFyZ2luID0gZnVuY3Rpb24oXyl7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gbWFyZ2luO1xuICAgIG1hcmdpbiA9IF87XG4gICAgY2hhcnQud2lkdGgod2lkdGgpO1xuICAgIGNoYXJ0LmhlaWdodChoZWlnaHQpO1xuICAgIHJldHVybiBjaGFydDtcbiAgfTtcblxuICBjaGFydC5zZWxlY3QgPSBmdW5jdGlvbihfKXtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBkaW1lbnNpb25zO1xuICAgIGRpbWVuc2lvbnMgPSBfO1xuICAgIHJldHVybiBjaGFydDtcbiAgfTtcblxuICBjaGFydC5kb21haW4gPSBmdW5jdGlvbihfKXtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBkb21haW5HZW5lcmF0b3I7XG4gICAgZG9tYWluR2VuZXJhdG9yID0gXztcbiAgICByZXR1cm4gY2hhcnQ7XG4gIH07XG4gIFxuICBjaGFydC5jb2xvciA9IGZ1bmN0aW9uKF8pe1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGNvbG9yR2VuZXJhdG9yO1xuICAgIGNvbG9yR2VuZXJhdG9yID0gXztcbiAgICByZXR1cm4gY2hhcnQ7XG4gIH07XG5cbiAgY2hhcnQuaGlnaGxpZ2h0ID0gZnVuY3Rpb24oXyl7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gc2VsZWN0ZWRQcm9wZXJ0eTtcbiAgICBzZWxlY3RlZFByb3BlcnR5ID0gXztcbiAgICByZXR1cm4gY2hhcnQ7XG4gIH07XG5cbiAgY2hhcnQucmVkcmF3ID0gZnVuY3Rpb24oc2VsZWN0aW9uKXtcbiAgICBzZWxlY3Rpb24uc2VsZWN0QWxsKCdzdmcnKS5yZW1vdmUoKTtcbiAgICBjaGFydChzZWxlY3Rpb24pO1xuICAgIHJldHVybiBjaGFydDtcbiAgfTtcblxuICBjaGFydC5kcmF3ID0gZnVuY3Rpb24oc2VsZWN0aW9uKXtcbiAgICBjaGFydChzZWxlY3Rpb24pO1xuICAgIHJldHVybiBjaGFydDtcbiAgfTtcblxuICBpZignd2lkdGgnIGluIGNvbmZpZykgY2hhcnQud2lkdGgoY29uZmlnLndpZHRoKTtcbiAgaWYoJ2hlaWdodCcgaW4gY29uZmlnKSBjaGFydC5oZWlnaHQoY29uZmlnLmhlaWdodCk7XG4gIGlmKCdtYXJnaW4nIGluIGNvbmZpZykgY2hhcnQubWFyZ2luKGNvbmZpZy5tYXJnaW4pO1xuICBpZignc2VsZWN0JyBpbiBjb25maWcpIGNoYXJ0LnNlbGVjdChjb25maWcuc2VsZWN0KTtcbiAgaWYoJ2RvbWFpbicgaW4gY29uZmlnKSBjaGFydC5kb21haW4oY29uZmlnLmRvbWFpbik7XG4gIGlmKCdoaWdobGlnaHQnIGluIGNvbmZpZykgY2hhcnQuaGlnaGxpZ2h0KGNvbmZpZy5oaWdobGlnaHQpO1xuICBpZignY29sb3InIGluIGNvbmZpZykgY2hhcnQuY29sb3IoY29uZmlnLmNvbG9yKTtcblxuICByZXR1cm4gY2hhcnQ7XG59O1xuXG59LHtcIi4vY29sb3JHZW5lcmF0b3JcIjoyLFwiLi9pbnRlcnBvbGF0b3JcIjo0fV0sMjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XG52YXIgY29sb3JicmV3ZXIgPSBfZGVyZXFfKCcuL2NvbG9yYnJld2VyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY29sb3JHZW5lcmF0b3IocHJvcGVydHksIGRhdGEpe1xuICB2YXIgcmFuZ2UgPSBjb2xvcmJyZXdlci5SZFlsR25bMTBdLnNsaWNlKDApO1xuICBcbiAgcmV0dXJuIGQzLnNjYWxlLnF1YW50aWxlKClcbiAgICAucmFuZ2UocmFuZ2UpXG4gICAgLmRvbWFpbihkMy5leHRlbnQoZGF0YSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gK2RbcHJvcGVydHldOyB9KSk7XG59O1xufSx7XCIuL2NvbG9yYnJld2VyXCI6M31dLDM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuLy8gQ29waWVkIGZyb20gRDM6IGh0dHBzOi8vZ2l0aHViLmNvbS9tYm9zdG9jay9kMy9ibG9iL21hc3Rlci9saWIvY29sb3JicmV3ZXIvY29sb3JicmV3ZXIuanNcbi8vIFRoaXMgcHJvZHVjdCBpbmNsdWRlcyBjb2xvciBzcGVjaWZpY2F0aW9ucyBhbmQgZGVzaWducyBkZXZlbG9wZWQgYnkgQ3ludGhpYSBCcmV3ZXIgKGh0dHA6Ly9jb2xvcmJyZXdlci5vcmcvKS5cbm1vZHVsZS5leHBvcnRzID0ge1lsR246IHtcbjM6IFsnI2Y3ZmNiOScsJyNhZGRkOGUnLCcjMzFhMzU0J10sXG40OiBbJyNmZmZmY2MnLCcjYzJlNjk5JywnIzc4YzY3OScsJyMyMzg0NDMnXSxcbjU6IFsnI2ZmZmZjYycsJyNjMmU2OTknLCcjNzhjNjc5JywnIzMxYTM1NCcsJyMwMDY4MzcnXSxcbjY6IFsnI2ZmZmZjYycsJyNkOWYwYTMnLCcjYWRkZDhlJywnIzc4YzY3OScsJyMzMWEzNTQnLCcjMDA2ODM3J10sXG43OiBbJyNmZmZmY2MnLCcjZDlmMGEzJywnI2FkZGQ4ZScsJyM3OGM2NzknLCcjNDFhYjVkJywnIzIzODQ0MycsJyMwMDVhMzInXSxcbjg6IFsnI2ZmZmZlNScsJyNmN2ZjYjknLCcjZDlmMGEzJywnI2FkZGQ4ZScsJyM3OGM2NzknLCcjNDFhYjVkJywnIzIzODQ0MycsJyMwMDVhMzInXSxcbjk6IFsnI2ZmZmZlNScsJyNmN2ZjYjknLCcjZDlmMGEzJywnI2FkZGQ4ZScsJyM3OGM2NzknLCcjNDFhYjVkJywnIzIzODQ0MycsJyMwMDY4MzcnLCcjMDA0NTI5J11cbn0sWWxHbkJ1OiB7XG4zOiBbJyNlZGY4YjEnLCcjN2ZjZGJiJywnIzJjN2ZiOCddLFxuNDogWycjZmZmZmNjJywnI2ExZGFiNCcsJyM0MWI2YzQnLCcjMjI1ZWE4J10sXG41OiBbJyNmZmZmY2MnLCcjYTFkYWI0JywnIzQxYjZjNCcsJyMyYzdmYjgnLCcjMjUzNDk0J10sXG42OiBbJyNmZmZmY2MnLCcjYzdlOWI0JywnIzdmY2RiYicsJyM0MWI2YzQnLCcjMmM3ZmI4JywnIzI1MzQ5NCddLFxuNzogWycjZmZmZmNjJywnI2M3ZTliNCcsJyM3ZmNkYmInLCcjNDFiNmM0JywnIzFkOTFjMCcsJyMyMjVlYTgnLCcjMGMyYzg0J10sXG44OiBbJyNmZmZmZDknLCcjZWRmOGIxJywnI2M3ZTliNCcsJyM3ZmNkYmInLCcjNDFiNmM0JywnIzFkOTFjMCcsJyMyMjVlYTgnLCcjMGMyYzg0J10sXG45OiBbJyNmZmZmZDknLCcjZWRmOGIxJywnI2M3ZTliNCcsJyM3ZmNkYmInLCcjNDFiNmM0JywnIzFkOTFjMCcsJyMyMjVlYTgnLCcjMjUzNDk0JywnIzA4MWQ1OCddXG59LEduQnU6IHtcbjM6IFsnI2UwZjNkYicsJyNhOGRkYjUnLCcjNDNhMmNhJ10sXG40OiBbJyNmMGY5ZTgnLCcjYmFlNGJjJywnIzdiY2NjNCcsJyMyYjhjYmUnXSxcbjU6IFsnI2YwZjllOCcsJyNiYWU0YmMnLCcjN2JjY2M0JywnIzQzYTJjYScsJyMwODY4YWMnXSxcbjY6IFsnI2YwZjllOCcsJyNjY2ViYzUnLCcjYThkZGI1JywnIzdiY2NjNCcsJyM0M2EyY2EnLCcjMDg2OGFjJ10sXG43OiBbJyNmMGY5ZTgnLCcjY2NlYmM1JywnI2E4ZGRiNScsJyM3YmNjYzQnLCcjNGViM2QzJywnIzJiOGNiZScsJyMwODU4OWUnXSxcbjg6IFsnI2Y3ZmNmMCcsJyNlMGYzZGInLCcjY2NlYmM1JywnI2E4ZGRiNScsJyM3YmNjYzQnLCcjNGViM2QzJywnIzJiOGNiZScsJyMwODU4OWUnXSxcbjk6IFsnI2Y3ZmNmMCcsJyNlMGYzZGInLCcjY2NlYmM1JywnI2E4ZGRiNScsJyM3YmNjYzQnLCcjNGViM2QzJywnIzJiOGNiZScsJyMwODY4YWMnLCcjMDg0MDgxJ11cbn0sQnVHbjoge1xuMzogWycjZTVmNWY5JywnIzk5ZDhjOScsJyMyY2EyNWYnXSxcbjQ6IFsnI2VkZjhmYicsJyNiMmUyZTInLCcjNjZjMmE0JywnIzIzOGI0NSddLFxuNTogWycjZWRmOGZiJywnI2IyZTJlMicsJyM2NmMyYTQnLCcjMmNhMjVmJywnIzAwNmQyYyddLFxuNjogWycjZWRmOGZiJywnI2NjZWNlNicsJyM5OWQ4YzknLCcjNjZjMmE0JywnIzJjYTI1ZicsJyMwMDZkMmMnXSxcbjc6IFsnI2VkZjhmYicsJyNjY2VjZTYnLCcjOTlkOGM5JywnIzY2YzJhNCcsJyM0MWFlNzYnLCcjMjM4YjQ1JywnIzAwNTgyNCddLFxuODogWycjZjdmY2ZkJywnI2U1ZjVmOScsJyNjY2VjZTYnLCcjOTlkOGM5JywnIzY2YzJhNCcsJyM0MWFlNzYnLCcjMjM4YjQ1JywnIzAwNTgyNCddLFxuOTogWycjZjdmY2ZkJywnI2U1ZjVmOScsJyNjY2VjZTYnLCcjOTlkOGM5JywnIzY2YzJhNCcsJyM0MWFlNzYnLCcjMjM4YjQ1JywnIzAwNmQyYycsJyMwMDQ0MWInXVxufSxQdUJ1R246IHtcbjM6IFsnI2VjZTJmMCcsJyNhNmJkZGInLCcjMWM5MDk5J10sXG40OiBbJyNmNmVmZjcnLCcjYmRjOWUxJywnIzY3YTljZicsJyMwMjgxOGEnXSxcbjU6IFsnI2Y2ZWZmNycsJyNiZGM5ZTEnLCcjNjdhOWNmJywnIzFjOTA5OScsJyMwMTZjNTknXSxcbjY6IFsnI2Y2ZWZmNycsJyNkMGQxZTYnLCcjYTZiZGRiJywnIzY3YTljZicsJyMxYzkwOTknLCcjMDE2YzU5J10sXG43OiBbJyNmNmVmZjcnLCcjZDBkMWU2JywnI2E2YmRkYicsJyM2N2E5Y2YnLCcjMzY5MGMwJywnIzAyODE4YScsJyMwMTY0NTAnXSxcbjg6IFsnI2ZmZjdmYicsJyNlY2UyZjAnLCcjZDBkMWU2JywnI2E2YmRkYicsJyM2N2E5Y2YnLCcjMzY5MGMwJywnIzAyODE4YScsJyMwMTY0NTAnXSxcbjk6IFsnI2ZmZjdmYicsJyNlY2UyZjAnLCcjZDBkMWU2JywnI2E2YmRkYicsJyM2N2E5Y2YnLCcjMzY5MGMwJywnIzAyODE4YScsJyMwMTZjNTknLCcjMDE0NjM2J11cbn0sUHVCdToge1xuMzogWycjZWNlN2YyJywnI2E2YmRkYicsJyMyYjhjYmUnXSxcbjQ6IFsnI2YxZWVmNicsJyNiZGM5ZTEnLCcjNzRhOWNmJywnIzA1NzBiMCddLFxuNTogWycjZjFlZWY2JywnI2JkYzllMScsJyM3NGE5Y2YnLCcjMmI4Y2JlJywnIzA0NWE4ZCddLFxuNjogWycjZjFlZWY2JywnI2QwZDFlNicsJyNhNmJkZGInLCcjNzRhOWNmJywnIzJiOGNiZScsJyMwNDVhOGQnXSxcbjc6IFsnI2YxZWVmNicsJyNkMGQxZTYnLCcjYTZiZGRiJywnIzc0YTljZicsJyMzNjkwYzAnLCcjMDU3MGIwJywnIzAzNGU3YiddLFxuODogWycjZmZmN2ZiJywnI2VjZTdmMicsJyNkMGQxZTYnLCcjYTZiZGRiJywnIzc0YTljZicsJyMzNjkwYzAnLCcjMDU3MGIwJywnIzAzNGU3YiddLFxuOTogWycjZmZmN2ZiJywnI2VjZTdmMicsJyNkMGQxZTYnLCcjYTZiZGRiJywnIzc0YTljZicsJyMzNjkwYzAnLCcjMDU3MGIwJywnIzA0NWE4ZCcsJyMwMjM4NTgnXVxufSxCdVB1OiB7XG4zOiBbJyNlMGVjZjQnLCcjOWViY2RhJywnIzg4NTZhNyddLFxuNDogWycjZWRmOGZiJywnI2IzY2RlMycsJyM4Yzk2YzYnLCcjODg0MTlkJ10sXG41OiBbJyNlZGY4ZmInLCcjYjNjZGUzJywnIzhjOTZjNicsJyM4ODU2YTcnLCcjODEwZjdjJ10sXG42OiBbJyNlZGY4ZmInLCcjYmZkM2U2JywnIzllYmNkYScsJyM4Yzk2YzYnLCcjODg1NmE3JywnIzgxMGY3YyddLFxuNzogWycjZWRmOGZiJywnI2JmZDNlNicsJyM5ZWJjZGEnLCcjOGM5NmM2JywnIzhjNmJiMScsJyM4ODQxOWQnLCcjNmUwMTZiJ10sXG44OiBbJyNmN2ZjZmQnLCcjZTBlY2Y0JywnI2JmZDNlNicsJyM5ZWJjZGEnLCcjOGM5NmM2JywnIzhjNmJiMScsJyM4ODQxOWQnLCcjNmUwMTZiJ10sXG45OiBbJyNmN2ZjZmQnLCcjZTBlY2Y0JywnI2JmZDNlNicsJyM5ZWJjZGEnLCcjOGM5NmM2JywnIzhjNmJiMScsJyM4ODQxOWQnLCcjODEwZjdjJywnIzRkMDA0YiddXG59LFJkUHU6IHtcbjM6IFsnI2ZkZTBkZCcsJyNmYTlmYjUnLCcjYzUxYjhhJ10sXG40OiBbJyNmZWViZTInLCcjZmJiNGI5JywnI2Y3NjhhMScsJyNhZTAxN2UnXSxcbjU6IFsnI2ZlZWJlMicsJyNmYmI0YjknLCcjZjc2OGExJywnI2M1MWI4YScsJyM3YTAxNzcnXSxcbjY6IFsnI2ZlZWJlMicsJyNmY2M1YzAnLCcjZmE5ZmI1JywnI2Y3NjhhMScsJyNjNTFiOGEnLCcjN2EwMTc3J10sXG43OiBbJyNmZWViZTInLCcjZmNjNWMwJywnI2ZhOWZiNScsJyNmNzY4YTEnLCcjZGQzNDk3JywnI2FlMDE3ZScsJyM3YTAxNzcnXSxcbjg6IFsnI2ZmZjdmMycsJyNmZGUwZGQnLCcjZmNjNWMwJywnI2ZhOWZiNScsJyNmNzY4YTEnLCcjZGQzNDk3JywnI2FlMDE3ZScsJyM3YTAxNzcnXSxcbjk6IFsnI2ZmZjdmMycsJyNmZGUwZGQnLCcjZmNjNWMwJywnI2ZhOWZiNScsJyNmNzY4YTEnLCcjZGQzNDk3JywnI2FlMDE3ZScsJyM3YTAxNzcnLCcjNDkwMDZhJ11cbn0sUHVSZDoge1xuMzogWycjZTdlMWVmJywnI2M5OTRjNycsJyNkZDFjNzcnXSxcbjQ6IFsnI2YxZWVmNicsJyNkN2I1ZDgnLCcjZGY2NWIwJywnI2NlMTI1NiddLFxuNTogWycjZjFlZWY2JywnI2Q3YjVkOCcsJyNkZjY1YjAnLCcjZGQxYzc3JywnIzk4MDA0MyddLFxuNjogWycjZjFlZWY2JywnI2Q0YjlkYScsJyNjOTk0YzcnLCcjZGY2NWIwJywnI2RkMWM3NycsJyM5ODAwNDMnXSxcbjc6IFsnI2YxZWVmNicsJyNkNGI5ZGEnLCcjYzk5NGM3JywnI2RmNjViMCcsJyNlNzI5OGEnLCcjY2UxMjU2JywnIzkxMDAzZiddLFxuODogWycjZjdmNGY5JywnI2U3ZTFlZicsJyNkNGI5ZGEnLCcjYzk5NGM3JywnI2RmNjViMCcsJyNlNzI5OGEnLCcjY2UxMjU2JywnIzkxMDAzZiddLFxuOTogWycjZjdmNGY5JywnI2U3ZTFlZicsJyNkNGI5ZGEnLCcjYzk5NGM3JywnI2RmNjViMCcsJyNlNzI5OGEnLCcjY2UxMjU2JywnIzk4MDA0MycsJyM2NzAwMWYnXVxufSxPclJkOiB7XG4zOiBbJyNmZWU4YzgnLCcjZmRiYjg0JywnI2UzNGEzMyddLFxuNDogWycjZmVmMGQ5JywnI2ZkY2M4YScsJyNmYzhkNTknLCcjZDczMDFmJ10sXG41OiBbJyNmZWYwZDknLCcjZmRjYzhhJywnI2ZjOGQ1OScsJyNlMzRhMzMnLCcjYjMwMDAwJ10sXG42OiBbJyNmZWYwZDknLCcjZmRkNDllJywnI2ZkYmI4NCcsJyNmYzhkNTknLCcjZTM0YTMzJywnI2IzMDAwMCddLFxuNzogWycjZmVmMGQ5JywnI2ZkZDQ5ZScsJyNmZGJiODQnLCcjZmM4ZDU5JywnI2VmNjU0OCcsJyNkNzMwMWYnLCcjOTkwMDAwJ10sXG44OiBbJyNmZmY3ZWMnLCcjZmVlOGM4JywnI2ZkZDQ5ZScsJyNmZGJiODQnLCcjZmM4ZDU5JywnI2VmNjU0OCcsJyNkNzMwMWYnLCcjOTkwMDAwJ10sXG45OiBbJyNmZmY3ZWMnLCcjZmVlOGM4JywnI2ZkZDQ5ZScsJyNmZGJiODQnLCcjZmM4ZDU5JywnI2VmNjU0OCcsJyNkNzMwMWYnLCcjYjMwMDAwJywnIzdmMDAwMCddXG59LFlsT3JSZDoge1xuMzogWycjZmZlZGEwJywnI2ZlYjI0YycsJyNmMDNiMjAnXSxcbjQ6IFsnI2ZmZmZiMicsJyNmZWNjNWMnLCcjZmQ4ZDNjJywnI2UzMWExYyddLFxuNTogWycjZmZmZmIyJywnI2ZlY2M1YycsJyNmZDhkM2MnLCcjZjAzYjIwJywnI2JkMDAyNiddLFxuNjogWycjZmZmZmIyJywnI2ZlZDk3NicsJyNmZWIyNGMnLCcjZmQ4ZDNjJywnI2YwM2IyMCcsJyNiZDAwMjYnXSxcbjc6IFsnI2ZmZmZiMicsJyNmZWQ5NzYnLCcjZmViMjRjJywnI2ZkOGQzYycsJyNmYzRlMmEnLCcjZTMxYTFjJywnI2IxMDAyNiddLFxuODogWycjZmZmZmNjJywnI2ZmZWRhMCcsJyNmZWQ5NzYnLCcjZmViMjRjJywnI2ZkOGQzYycsJyNmYzRlMmEnLCcjZTMxYTFjJywnI2IxMDAyNiddLFxuOTogWycjZmZmZmNjJywnI2ZmZWRhMCcsJyNmZWQ5NzYnLCcjZmViMjRjJywnI2ZkOGQzYycsJyNmYzRlMmEnLCcjZTMxYTFjJywnI2JkMDAyNicsJyM4MDAwMjYnXVxufSxZbE9yQnI6IHtcbjM6IFsnI2ZmZjdiYycsJyNmZWM0NGYnLCcjZDk1ZjBlJ10sXG40OiBbJyNmZmZmZDQnLCcjZmVkOThlJywnI2ZlOTkyOScsJyNjYzRjMDInXSxcbjU6IFsnI2ZmZmZkNCcsJyNmZWQ5OGUnLCcjZmU5OTI5JywnI2Q5NWYwZScsJyM5OTM0MDQnXSxcbjY6IFsnI2ZmZmZkNCcsJyNmZWUzOTEnLCcjZmVjNDRmJywnI2ZlOTkyOScsJyNkOTVmMGUnLCcjOTkzNDA0J10sXG43OiBbJyNmZmZmZDQnLCcjZmVlMzkxJywnI2ZlYzQ0ZicsJyNmZTk5MjknLCcjZWM3MDE0JywnI2NjNGMwMicsJyM4YzJkMDQnXSxcbjg6IFsnI2ZmZmZlNScsJyNmZmY3YmMnLCcjZmVlMzkxJywnI2ZlYzQ0ZicsJyNmZTk5MjknLCcjZWM3MDE0JywnI2NjNGMwMicsJyM4YzJkMDQnXSxcbjk6IFsnI2ZmZmZlNScsJyNmZmY3YmMnLCcjZmVlMzkxJywnI2ZlYzQ0ZicsJyNmZTk5MjknLCcjZWM3MDE0JywnI2NjNGMwMicsJyM5OTM0MDQnLCcjNjYyNTA2J11cbn0sUHVycGxlczoge1xuMzogWycjZWZlZGY1JywnI2JjYmRkYycsJyM3NTZiYjEnXSxcbjQ6IFsnI2YyZjBmNycsJyNjYmM5ZTInLCcjOWU5YWM4JywnIzZhNTFhMyddLFxuNTogWycjZjJmMGY3JywnI2NiYzllMicsJyM5ZTlhYzgnLCcjNzU2YmIxJywnIzU0Mjc4ZiddLFxuNjogWycjZjJmMGY3JywnI2RhZGFlYicsJyNiY2JkZGMnLCcjOWU5YWM4JywnIzc1NmJiMScsJyM1NDI3OGYnXSxcbjc6IFsnI2YyZjBmNycsJyNkYWRhZWInLCcjYmNiZGRjJywnIzllOWFjOCcsJyM4MDdkYmEnLCcjNmE1MWEzJywnIzRhMTQ4NiddLFxuODogWycjZmNmYmZkJywnI2VmZWRmNScsJyNkYWRhZWInLCcjYmNiZGRjJywnIzllOWFjOCcsJyM4MDdkYmEnLCcjNmE1MWEzJywnIzRhMTQ4NiddLFxuOTogWycjZmNmYmZkJywnI2VmZWRmNScsJyNkYWRhZWInLCcjYmNiZGRjJywnIzllOWFjOCcsJyM4MDdkYmEnLCcjNmE1MWEzJywnIzU0Mjc4ZicsJyMzZjAwN2QnXVxufSxCbHVlczoge1xuMzogWycjZGVlYmY3JywnIzllY2FlMScsJyMzMTgyYmQnXSxcbjQ6IFsnI2VmZjNmZicsJyNiZGQ3ZTcnLCcjNmJhZWQ2JywnIzIxNzFiNSddLFxuNTogWycjZWZmM2ZmJywnI2JkZDdlNycsJyM2YmFlZDYnLCcjMzE4MmJkJywnIzA4NTE5YyddLFxuNjogWycjZWZmM2ZmJywnI2M2ZGJlZicsJyM5ZWNhZTEnLCcjNmJhZWQ2JywnIzMxODJiZCcsJyMwODUxOWMnXSxcbjc6IFsnI2VmZjNmZicsJyNjNmRiZWYnLCcjOWVjYWUxJywnIzZiYWVkNicsJyM0MjkyYzYnLCcjMjE3MWI1JywnIzA4NDU5NCddLFxuODogWycjZjdmYmZmJywnI2RlZWJmNycsJyNjNmRiZWYnLCcjOWVjYWUxJywnIzZiYWVkNicsJyM0MjkyYzYnLCcjMjE3MWI1JywnIzA4NDU5NCddLFxuOTogWycjZjdmYmZmJywnI2RlZWJmNycsJyNjNmRiZWYnLCcjOWVjYWUxJywnIzZiYWVkNicsJyM0MjkyYzYnLCcjMjE3MWI1JywnIzA4NTE5YycsJyMwODMwNmInXVxufSxHcmVlbnM6IHtcbjM6IFsnI2U1ZjVlMCcsJyNhMWQ5OWInLCcjMzFhMzU0J10sXG40OiBbJyNlZGY4ZTknLCcjYmFlNGIzJywnIzc0YzQ3NicsJyMyMzhiNDUnXSxcbjU6IFsnI2VkZjhlOScsJyNiYWU0YjMnLCcjNzRjNDc2JywnIzMxYTM1NCcsJyMwMDZkMmMnXSxcbjY6IFsnI2VkZjhlOScsJyNjN2U5YzAnLCcjYTFkOTliJywnIzc0YzQ3NicsJyMzMWEzNTQnLCcjMDA2ZDJjJ10sXG43OiBbJyNlZGY4ZTknLCcjYzdlOWMwJywnI2ExZDk5YicsJyM3NGM0NzYnLCcjNDFhYjVkJywnIzIzOGI0NScsJyMwMDVhMzInXSxcbjg6IFsnI2Y3ZmNmNScsJyNlNWY1ZTAnLCcjYzdlOWMwJywnI2ExZDk5YicsJyM3NGM0NzYnLCcjNDFhYjVkJywnIzIzOGI0NScsJyMwMDVhMzInXSxcbjk6IFsnI2Y3ZmNmNScsJyNlNWY1ZTAnLCcjYzdlOWMwJywnI2ExZDk5YicsJyM3NGM0NzYnLCcjNDFhYjVkJywnIzIzOGI0NScsJyMwMDZkMmMnLCcjMDA0NDFiJ11cbn0sT3Jhbmdlczoge1xuMzogWycjZmVlNmNlJywnI2ZkYWU2YicsJyNlNjU1MGQnXSxcbjQ6IFsnI2ZlZWRkZScsJyNmZGJlODUnLCcjZmQ4ZDNjJywnI2Q5NDcwMSddLFxuNTogWycjZmVlZGRlJywnI2ZkYmU4NScsJyNmZDhkM2MnLCcjZTY1NTBkJywnI2E2MzYwMyddLFxuNjogWycjZmVlZGRlJywnI2ZkZDBhMicsJyNmZGFlNmInLCcjZmQ4ZDNjJywnI2U2NTUwZCcsJyNhNjM2MDMnXSxcbjc6IFsnI2ZlZWRkZScsJyNmZGQwYTInLCcjZmRhZTZiJywnI2ZkOGQzYycsJyNmMTY5MTMnLCcjZDk0ODAxJywnIzhjMmQwNCddLFxuODogWycjZmZmNWViJywnI2ZlZTZjZScsJyNmZGQwYTInLCcjZmRhZTZiJywnI2ZkOGQzYycsJyNmMTY5MTMnLCcjZDk0ODAxJywnIzhjMmQwNCddLFxuOTogWycjZmZmNWViJywnI2ZlZTZjZScsJyNmZGQwYTInLCcjZmRhZTZiJywnI2ZkOGQzYycsJyNmMTY5MTMnLCcjZDk0ODAxJywnI2E2MzYwMycsJyM3ZjI3MDQnXVxufSxSZWRzOiB7XG4zOiBbJyNmZWUwZDInLCcjZmM5MjcyJywnI2RlMmQyNiddLFxuNDogWycjZmVlNWQ5JywnI2ZjYWU5MScsJyNmYjZhNGEnLCcjY2IxODFkJ10sXG41OiBbJyNmZWU1ZDknLCcjZmNhZTkxJywnI2ZiNmE0YScsJyNkZTJkMjYnLCcjYTUwZjE1J10sXG42OiBbJyNmZWU1ZDknLCcjZmNiYmExJywnI2ZjOTI3MicsJyNmYjZhNGEnLCcjZGUyZDI2JywnI2E1MGYxNSddLFxuNzogWycjZmVlNWQ5JywnI2ZjYmJhMScsJyNmYzkyNzInLCcjZmI2YTRhJywnI2VmM2IyYycsJyNjYjE4MWQnLCcjOTkwMDBkJ10sXG44OiBbJyNmZmY1ZjAnLCcjZmVlMGQyJywnI2ZjYmJhMScsJyNmYzkyNzInLCcjZmI2YTRhJywnI2VmM2IyYycsJyNjYjE4MWQnLCcjOTkwMDBkJ10sXG45OiBbJyNmZmY1ZjAnLCcjZmVlMGQyJywnI2ZjYmJhMScsJyNmYzkyNzInLCcjZmI2YTRhJywnI2VmM2IyYycsJyNjYjE4MWQnLCcjYTUwZjE1JywnIzY3MDAwZCddXG59LEdyZXlzOiB7XG4zOiBbJyNmMGYwZjAnLCcjYmRiZGJkJywnIzYzNjM2MyddLFxuNDogWycjZjdmN2Y3JywnI2NjY2NjYycsJyM5Njk2OTYnLCcjNTI1MjUyJ10sXG41OiBbJyNmN2Y3ZjcnLCcjY2NjY2NjJywnIzk2OTY5NicsJyM2MzYzNjMnLCcjMjUyNTI1J10sXG42OiBbJyNmN2Y3ZjcnLCcjZDlkOWQ5JywnI2JkYmRiZCcsJyM5Njk2OTYnLCcjNjM2MzYzJywnIzI1MjUyNSddLFxuNzogWycjZjdmN2Y3JywnI2Q5ZDlkOScsJyNiZGJkYmQnLCcjOTY5Njk2JywnIzczNzM3MycsJyM1MjUyNTInLCcjMjUyNTI1J10sXG44OiBbJyNmZmZmZmYnLCcjZjBmMGYwJywnI2Q5ZDlkOScsJyNiZGJkYmQnLCcjOTY5Njk2JywnIzczNzM3MycsJyM1MjUyNTInLCcjMjUyNTI1J10sXG45OiBbJyNmZmZmZmYnLCcjZjBmMGYwJywnI2Q5ZDlkOScsJyNiZGJkYmQnLCcjOTY5Njk2JywnIzczNzM3MycsJyM1MjUyNTInLCcjMjUyNTI1JywnIzAwMDAwMCddXG59LFB1T3I6IHtcbjM6IFsnI2YxYTM0MCcsJyNmN2Y3ZjcnLCcjOTk4ZWMzJ10sXG40OiBbJyNlNjYxMDEnLCcjZmRiODYzJywnI2IyYWJkMicsJyM1ZTNjOTknXSxcbjU6IFsnI2U2NjEwMScsJyNmZGI4NjMnLCcjZjdmN2Y3JywnI2IyYWJkMicsJyM1ZTNjOTknXSxcbjY6IFsnI2IzNTgwNicsJyNmMWEzNDAnLCcjZmVlMGI2JywnI2Q4ZGFlYicsJyM5OThlYzMnLCcjNTQyNzg4J10sXG43OiBbJyNiMzU4MDYnLCcjZjFhMzQwJywnI2ZlZTBiNicsJyNmN2Y3ZjcnLCcjZDhkYWViJywnIzk5OGVjMycsJyM1NDI3ODgnXSxcbjg6IFsnI2IzNTgwNicsJyNlMDgyMTQnLCcjZmRiODYzJywnI2ZlZTBiNicsJyNkOGRhZWInLCcjYjJhYmQyJywnIzgwNzNhYycsJyM1NDI3ODgnXSxcbjk6IFsnI2IzNTgwNicsJyNlMDgyMTQnLCcjZmRiODYzJywnI2ZlZTBiNicsJyNmN2Y3ZjcnLCcjZDhkYWViJywnI2IyYWJkMicsJyM4MDczYWMnLCcjNTQyNzg4J10sXG4xMDogWycjN2YzYjA4JywnI2IzNTgwNicsJyNlMDgyMTQnLCcjZmRiODYzJywnI2ZlZTBiNicsJyNkOGRhZWInLCcjYjJhYmQyJywnIzgwNzNhYycsJyM1NDI3ODgnLCcjMmQwMDRiJ10sXG4xMTogWycjN2YzYjA4JywnI2IzNTgwNicsJyNlMDgyMTQnLCcjZmRiODYzJywnI2ZlZTBiNicsJyNmN2Y3ZjcnLCcjZDhkYWViJywnI2IyYWJkMicsJyM4MDczYWMnLCcjNTQyNzg4JywnIzJkMDA0YiddXG59LEJyQkc6IHtcbjM6IFsnI2Q4YjM2NScsJyNmNWY1ZjUnLCcjNWFiNGFjJ10sXG40OiBbJyNhNjYxMWEnLCcjZGZjMjdkJywnIzgwY2RjMScsJyMwMTg1NzEnXSxcbjU6IFsnI2E2NjExYScsJyNkZmMyN2QnLCcjZjVmNWY1JywnIzgwY2RjMScsJyMwMTg1NzEnXSxcbjY6IFsnIzhjNTEwYScsJyNkOGIzNjUnLCcjZjZlOGMzJywnI2M3ZWFlNScsJyM1YWI0YWMnLCcjMDE2NjVlJ10sXG43OiBbJyM4YzUxMGEnLCcjZDhiMzY1JywnI2Y2ZThjMycsJyNmNWY1ZjUnLCcjYzdlYWU1JywnIzVhYjRhYycsJyMwMTY2NWUnXSxcbjg6IFsnIzhjNTEwYScsJyNiZjgxMmQnLCcjZGZjMjdkJywnI2Y2ZThjMycsJyNjN2VhZTUnLCcjODBjZGMxJywnIzM1OTc4ZicsJyMwMTY2NWUnXSxcbjk6IFsnIzhjNTEwYScsJyNiZjgxMmQnLCcjZGZjMjdkJywnI2Y2ZThjMycsJyNmNWY1ZjUnLCcjYzdlYWU1JywnIzgwY2RjMScsJyMzNTk3OGYnLCcjMDE2NjVlJ10sXG4xMDogWycjNTQzMDA1JywnIzhjNTEwYScsJyNiZjgxMmQnLCcjZGZjMjdkJywnI2Y2ZThjMycsJyNjN2VhZTUnLCcjODBjZGMxJywnIzM1OTc4ZicsJyMwMTY2NWUnLCcjMDAzYzMwJ10sXG4xMTogWycjNTQzMDA1JywnIzhjNTEwYScsJyNiZjgxMmQnLCcjZGZjMjdkJywnI2Y2ZThjMycsJyNmNWY1ZjUnLCcjYzdlYWU1JywnIzgwY2RjMScsJyMzNTk3OGYnLCcjMDE2NjVlJywnIzAwM2MzMCddXG59LFBSR246IHtcbjM6IFsnI2FmOGRjMycsJyNmN2Y3ZjcnLCcjN2ZiZjdiJ10sXG40OiBbJyM3YjMyOTQnLCcjYzJhNWNmJywnI2E2ZGJhMCcsJyMwMDg4MzcnXSxcbjU6IFsnIzdiMzI5NCcsJyNjMmE1Y2YnLCcjZjdmN2Y3JywnI2E2ZGJhMCcsJyMwMDg4MzcnXSxcbjY6IFsnIzc2MmE4MycsJyNhZjhkYzMnLCcjZTdkNGU4JywnI2Q5ZjBkMycsJyM3ZmJmN2InLCcjMWI3ODM3J10sXG43OiBbJyM3NjJhODMnLCcjYWY4ZGMzJywnI2U3ZDRlOCcsJyNmN2Y3ZjcnLCcjZDlmMGQzJywnIzdmYmY3YicsJyMxYjc4MzcnXSxcbjg6IFsnIzc2MmE4MycsJyM5OTcwYWInLCcjYzJhNWNmJywnI2U3ZDRlOCcsJyNkOWYwZDMnLCcjYTZkYmEwJywnIzVhYWU2MScsJyMxYjc4MzcnXSxcbjk6IFsnIzc2MmE4MycsJyM5OTcwYWInLCcjYzJhNWNmJywnI2U3ZDRlOCcsJyNmN2Y3ZjcnLCcjZDlmMGQzJywnI2E2ZGJhMCcsJyM1YWFlNjEnLCcjMWI3ODM3J10sXG4xMDogWycjNDAwMDRiJywnIzc2MmE4MycsJyM5OTcwYWInLCcjYzJhNWNmJywnI2U3ZDRlOCcsJyNkOWYwZDMnLCcjYTZkYmEwJywnIzVhYWU2MScsJyMxYjc4MzcnLCcjMDA0NDFiJ10sXG4xMTogWycjNDAwMDRiJywnIzc2MmE4MycsJyM5OTcwYWInLCcjYzJhNWNmJywnI2U3ZDRlOCcsJyNmN2Y3ZjcnLCcjZDlmMGQzJywnI2E2ZGJhMCcsJyM1YWFlNjEnLCcjMWI3ODM3JywnIzAwNDQxYiddXG59LFBpWUc6IHtcbjM6IFsnI2U5YTNjOScsJyNmN2Y3ZjcnLCcjYTFkNzZhJ10sXG40OiBbJyNkMDFjOGInLCcjZjFiNmRhJywnI2I4ZTE4NicsJyM0ZGFjMjYnXSxcbjU6IFsnI2QwMWM4YicsJyNmMWI2ZGEnLCcjZjdmN2Y3JywnI2I4ZTE4NicsJyM0ZGFjMjYnXSxcbjY6IFsnI2M1MWI3ZCcsJyNlOWEzYzknLCcjZmRlMGVmJywnI2U2ZjVkMCcsJyNhMWQ3NmEnLCcjNGQ5MjIxJ10sXG43OiBbJyNjNTFiN2QnLCcjZTlhM2M5JywnI2ZkZTBlZicsJyNmN2Y3ZjcnLCcjZTZmNWQwJywnI2ExZDc2YScsJyM0ZDkyMjEnXSxcbjg6IFsnI2M1MWI3ZCcsJyNkZTc3YWUnLCcjZjFiNmRhJywnI2ZkZTBlZicsJyNlNmY1ZDAnLCcjYjhlMTg2JywnIzdmYmM0MScsJyM0ZDkyMjEnXSxcbjk6IFsnI2M1MWI3ZCcsJyNkZTc3YWUnLCcjZjFiNmRhJywnI2ZkZTBlZicsJyNmN2Y3ZjcnLCcjZTZmNWQwJywnI2I4ZTE4NicsJyM3ZmJjNDEnLCcjNGQ5MjIxJ10sXG4xMDogWycjOGUwMTUyJywnI2M1MWI3ZCcsJyNkZTc3YWUnLCcjZjFiNmRhJywnI2ZkZTBlZicsJyNlNmY1ZDAnLCcjYjhlMTg2JywnIzdmYmM0MScsJyM0ZDkyMjEnLCcjMjc2NDE5J10sXG4xMTogWycjOGUwMTUyJywnI2M1MWI3ZCcsJyNkZTc3YWUnLCcjZjFiNmRhJywnI2ZkZTBlZicsJyNmN2Y3ZjcnLCcjZTZmNWQwJywnI2I4ZTE4NicsJyM3ZmJjNDEnLCcjNGQ5MjIxJywnIzI3NjQxOSddXG59LFJkQnU6IHtcbjM6IFsnI2VmOGE2MicsJyNmN2Y3ZjcnLCcjNjdhOWNmJ10sXG40OiBbJyNjYTAwMjAnLCcjZjRhNTgyJywnIzkyYzVkZScsJyMwNTcxYjAnXSxcbjU6IFsnI2NhMDAyMCcsJyNmNGE1ODInLCcjZjdmN2Y3JywnIzkyYzVkZScsJyMwNTcxYjAnXSxcbjY6IFsnI2IyMTgyYicsJyNlZjhhNjInLCcjZmRkYmM3JywnI2QxZTVmMCcsJyM2N2E5Y2YnLCcjMjE2NmFjJ10sXG43OiBbJyNiMjE4MmInLCcjZWY4YTYyJywnI2ZkZGJjNycsJyNmN2Y3ZjcnLCcjZDFlNWYwJywnIzY3YTljZicsJyMyMTY2YWMnXSxcbjg6IFsnI2IyMTgyYicsJyNkNjYwNGQnLCcjZjRhNTgyJywnI2ZkZGJjNycsJyNkMWU1ZjAnLCcjOTJjNWRlJywnIzQzOTNjMycsJyMyMTY2YWMnXSxcbjk6IFsnI2IyMTgyYicsJyNkNjYwNGQnLCcjZjRhNTgyJywnI2ZkZGJjNycsJyNmN2Y3ZjcnLCcjZDFlNWYwJywnIzkyYzVkZScsJyM0MzkzYzMnLCcjMjE2NmFjJ10sXG4xMDogWycjNjcwMDFmJywnI2IyMTgyYicsJyNkNjYwNGQnLCcjZjRhNTgyJywnI2ZkZGJjNycsJyNkMWU1ZjAnLCcjOTJjNWRlJywnIzQzOTNjMycsJyMyMTY2YWMnLCcjMDUzMDYxJ10sXG4xMTogWycjNjcwMDFmJywnI2IyMTgyYicsJyNkNjYwNGQnLCcjZjRhNTgyJywnI2ZkZGJjNycsJyNmN2Y3ZjcnLCcjZDFlNWYwJywnIzkyYzVkZScsJyM0MzkzYzMnLCcjMjE2NmFjJywnIzA1MzA2MSddXG59LFJkR3k6IHtcbjM6IFsnI2VmOGE2MicsJyNmZmZmZmYnLCcjOTk5OTk5J10sXG40OiBbJyNjYTAwMjAnLCcjZjRhNTgyJywnI2JhYmFiYScsJyM0MDQwNDAnXSxcbjU6IFsnI2NhMDAyMCcsJyNmNGE1ODInLCcjZmZmZmZmJywnI2JhYmFiYScsJyM0MDQwNDAnXSxcbjY6IFsnI2IyMTgyYicsJyNlZjhhNjInLCcjZmRkYmM3JywnI2UwZTBlMCcsJyM5OTk5OTknLCcjNGQ0ZDRkJ10sXG43OiBbJyNiMjE4MmInLCcjZWY4YTYyJywnI2ZkZGJjNycsJyNmZmZmZmYnLCcjZTBlMGUwJywnIzk5OTk5OScsJyM0ZDRkNGQnXSxcbjg6IFsnI2IyMTgyYicsJyNkNjYwNGQnLCcjZjRhNTgyJywnI2ZkZGJjNycsJyNlMGUwZTAnLCcjYmFiYWJhJywnIzg3ODc4NycsJyM0ZDRkNGQnXSxcbjk6IFsnI2IyMTgyYicsJyNkNjYwNGQnLCcjZjRhNTgyJywnI2ZkZGJjNycsJyNmZmZmZmYnLCcjZTBlMGUwJywnI2JhYmFiYScsJyM4Nzg3ODcnLCcjNGQ0ZDRkJ10sXG4xMDogWycjNjcwMDFmJywnI2IyMTgyYicsJyNkNjYwNGQnLCcjZjRhNTgyJywnI2ZkZGJjNycsJyNlMGUwZTAnLCcjYmFiYWJhJywnIzg3ODc4NycsJyM0ZDRkNGQnLCcjMWExYTFhJ10sXG4xMTogWycjNjcwMDFmJywnI2IyMTgyYicsJyNkNjYwNGQnLCcjZjRhNTgyJywnI2ZkZGJjNycsJyNmZmZmZmYnLCcjZTBlMGUwJywnI2JhYmFiYScsJyM4Nzg3ODcnLCcjNGQ0ZDRkJywnIzFhMWExYSddXG59LFJkWWxCdToge1xuMzogWycjZmM4ZDU5JywnI2ZmZmZiZicsJyM5MWJmZGInXSxcbjQ6IFsnI2Q3MTkxYycsJyNmZGFlNjEnLCcjYWJkOWU5JywnIzJjN2JiNiddLFxuNTogWycjZDcxOTFjJywnI2ZkYWU2MScsJyNmZmZmYmYnLCcjYWJkOWU5JywnIzJjN2JiNiddLFxuNjogWycjZDczMDI3JywnI2ZjOGQ1OScsJyNmZWUwOTAnLCcjZTBmM2Y4JywnIzkxYmZkYicsJyM0NTc1YjQnXSxcbjc6IFsnI2Q3MzAyNycsJyNmYzhkNTknLCcjZmVlMDkwJywnI2ZmZmZiZicsJyNlMGYzZjgnLCcjOTFiZmRiJywnIzQ1NzViNCddLFxuODogWycjZDczMDI3JywnI2Y0NmQ0MycsJyNmZGFlNjEnLCcjZmVlMDkwJywnI2UwZjNmOCcsJyNhYmQ5ZTknLCcjNzRhZGQxJywnIzQ1NzViNCddLFxuOTogWycjZDczMDI3JywnI2Y0NmQ0MycsJyNmZGFlNjEnLCcjZmVlMDkwJywnI2ZmZmZiZicsJyNlMGYzZjgnLCcjYWJkOWU5JywnIzc0YWRkMScsJyM0NTc1YjQnXSxcbjEwOiBbJyNhNTAwMjYnLCcjZDczMDI3JywnI2Y0NmQ0MycsJyNmZGFlNjEnLCcjZmVlMDkwJywnI2UwZjNmOCcsJyNhYmQ5ZTknLCcjNzRhZGQxJywnIzQ1NzViNCcsJyMzMTM2OTUnXSxcbjExOiBbJyNhNTAwMjYnLCcjZDczMDI3JywnI2Y0NmQ0MycsJyNmZGFlNjEnLCcjZmVlMDkwJywnI2ZmZmZiZicsJyNlMGYzZjgnLCcjYWJkOWU5JywnIzc0YWRkMScsJyM0NTc1YjQnLCcjMzEzNjk1J11cbn0sU3BlY3RyYWw6IHtcbjM6IFsnI2ZjOGQ1OScsJyNmZmZmYmYnLCcjOTlkNTk0J10sXG40OiBbJyNkNzE5MWMnLCcjZmRhZTYxJywnI2FiZGRhNCcsJyMyYjgzYmEnXSxcbjU6IFsnI2Q3MTkxYycsJyNmZGFlNjEnLCcjZmZmZmJmJywnI2FiZGRhNCcsJyMyYjgzYmEnXSxcbjY6IFsnI2Q1M2U0ZicsJyNmYzhkNTknLCcjZmVlMDhiJywnI2U2ZjU5OCcsJyM5OWQ1OTQnLCcjMzI4OGJkJ10sXG43OiBbJyNkNTNlNGYnLCcjZmM4ZDU5JywnI2ZlZTA4YicsJyNmZmZmYmYnLCcjZTZmNTk4JywnIzk5ZDU5NCcsJyMzMjg4YmQnXSxcbjg6IFsnI2Q1M2U0ZicsJyNmNDZkNDMnLCcjZmRhZTYxJywnI2ZlZTA4YicsJyNlNmY1OTgnLCcjYWJkZGE0JywnIzY2YzJhNScsJyMzMjg4YmQnXSxcbjk6IFsnI2Q1M2U0ZicsJyNmNDZkNDMnLCcjZmRhZTYxJywnI2ZlZTA4YicsJyNmZmZmYmYnLCcjZTZmNTk4JywnI2FiZGRhNCcsJyM2NmMyYTUnLCcjMzI4OGJkJ10sXG4xMDogWycjOWUwMTQyJywnI2Q1M2U0ZicsJyNmNDZkNDMnLCcjZmRhZTYxJywnI2ZlZTA4YicsJyNlNmY1OTgnLCcjYWJkZGE0JywnIzY2YzJhNScsJyMzMjg4YmQnLCcjNWU0ZmEyJ10sXG4xMTogWycjOWUwMTQyJywnI2Q1M2U0ZicsJyNmNDZkNDMnLCcjZmRhZTYxJywnI2ZlZTA4YicsJyNmZmZmYmYnLCcjZTZmNTk4JywnI2FiZGRhNCcsJyM2NmMyYTUnLCcjMzI4OGJkJywnIzVlNGZhMiddXG59LFJkWWxHbjoge1xuMzogWycjZmM4ZDU5JywnI2ZmZmZiZicsJyM5MWNmNjAnXSxcbjQ6IFsnI2Q3MTkxYycsJyNmZGFlNjEnLCcjYTZkOTZhJywnIzFhOTY0MSddLFxuNTogWycjZDcxOTFjJywnI2ZkYWU2MScsJyNmZmZmYmYnLCcjYTZkOTZhJywnIzFhOTY0MSddLFxuNjogWycjZDczMDI3JywnI2ZjOGQ1OScsJyNmZWUwOGInLCcjZDllZjhiJywnIzkxY2Y2MCcsJyMxYTk4NTAnXSxcbjc6IFsnI2Q3MzAyNycsJyNmYzhkNTknLCcjZmVlMDhiJywnI2ZmZmZiZicsJyNkOWVmOGInLCcjOTFjZjYwJywnIzFhOTg1MCddLFxuODogWycjZDczMDI3JywnI2Y0NmQ0MycsJyNmZGFlNjEnLCcjZmVlMDhiJywnI2Q5ZWY4YicsJyNhNmQ5NmEnLCcjNjZiZDYzJywnIzFhOTg1MCddLFxuOTogWycjZDczMDI3JywnI2Y0NmQ0MycsJyNmZGFlNjEnLCcjZmVlMDhiJywnI2ZmZmZiZicsJyNkOWVmOGInLCcjYTZkOTZhJywnIzY2YmQ2MycsJyMxYTk4NTAnXSxcbjEwOiBbJyNhNTAwMjYnLCcjZDczMDI3JywnI2Y0NmQ0MycsJyNmZGFlNjEnLCcjZmVlMDhiJywnI2Q5ZWY4YicsJyNhNmQ5NmEnLCcjNjZiZDYzJywnIzFhOTg1MCcsJyMwMDY4MzcnXSxcbjExOiBbJyNhNTAwMjYnLCcjZDczMDI3JywnI2Y0NmQ0MycsJyNmZGFlNjEnLCcjZmVlMDhiJywnI2ZmZmZiZicsJyNkOWVmOGInLCcjYTZkOTZhJywnIzY2YmQ2MycsJyMxYTk4NTAnLCcjMDA2ODM3J11cbn0sQWNjZW50OiB7XG4zOiBbJyM3ZmM5N2YnLCcjYmVhZWQ0JywnI2ZkYzA4NiddLFxuNDogWycjN2ZjOTdmJywnI2JlYWVkNCcsJyNmZGMwODYnLCcjZmZmZjk5J10sXG41OiBbJyM3ZmM5N2YnLCcjYmVhZWQ0JywnI2ZkYzA4NicsJyNmZmZmOTknLCcjMzg2Y2IwJ10sXG42OiBbJyM3ZmM5N2YnLCcjYmVhZWQ0JywnI2ZkYzA4NicsJyNmZmZmOTknLCcjMzg2Y2IwJywnI2YwMDI3ZiddLFxuNzogWycjN2ZjOTdmJywnI2JlYWVkNCcsJyNmZGMwODYnLCcjZmZmZjk5JywnIzM4NmNiMCcsJyNmMDAyN2YnLCcjYmY1YjE3J10sXG44OiBbJyM3ZmM5N2YnLCcjYmVhZWQ0JywnI2ZkYzA4NicsJyNmZmZmOTknLCcjMzg2Y2IwJywnI2YwMDI3ZicsJyNiZjViMTcnLCcjNjY2NjY2J11cbn0sRGFyazI6IHtcbjM6IFsnIzFiOWU3NycsJyNkOTVmMDInLCcjNzU3MGIzJ10sXG40OiBbJyMxYjllNzcnLCcjZDk1ZjAyJywnIzc1NzBiMycsJyNlNzI5OGEnXSxcbjU6IFsnIzFiOWU3NycsJyNkOTVmMDInLCcjNzU3MGIzJywnI2U3Mjk4YScsJyM2NmE2MWUnXSxcbjY6IFsnIzFiOWU3NycsJyNkOTVmMDInLCcjNzU3MGIzJywnI2U3Mjk4YScsJyM2NmE2MWUnLCcjZTZhYjAyJ10sXG43OiBbJyMxYjllNzcnLCcjZDk1ZjAyJywnIzc1NzBiMycsJyNlNzI5OGEnLCcjNjZhNjFlJywnI2U2YWIwMicsJyNhNjc2MWQnXSxcbjg6IFsnIzFiOWU3NycsJyNkOTVmMDInLCcjNzU3MGIzJywnI2U3Mjk4YScsJyM2NmE2MWUnLCcjZTZhYjAyJywnI2E2NzYxZCcsJyM2NjY2NjYnXVxufSxQYWlyZWQ6IHtcbjM6IFsnI2E2Y2VlMycsJyMxZjc4YjQnLCcjYjJkZjhhJ10sXG40OiBbJyNhNmNlZTMnLCcjMWY3OGI0JywnI2IyZGY4YScsJyMzM2EwMmMnXSxcbjU6IFsnI2E2Y2VlMycsJyMxZjc4YjQnLCcjYjJkZjhhJywnIzMzYTAyYycsJyNmYjlhOTknXSxcbjY6IFsnI2E2Y2VlMycsJyMxZjc4YjQnLCcjYjJkZjhhJywnIzMzYTAyYycsJyNmYjlhOTknLCcjZTMxYTFjJ10sXG43OiBbJyNhNmNlZTMnLCcjMWY3OGI0JywnI2IyZGY4YScsJyMzM2EwMmMnLCcjZmI5YTk5JywnI2UzMWExYycsJyNmZGJmNmYnXSxcbjg6IFsnI2E2Y2VlMycsJyMxZjc4YjQnLCcjYjJkZjhhJywnIzMzYTAyYycsJyNmYjlhOTknLCcjZTMxYTFjJywnI2ZkYmY2ZicsJyNmZjdmMDAnXSxcbjk6IFsnI2E2Y2VlMycsJyMxZjc4YjQnLCcjYjJkZjhhJywnIzMzYTAyYycsJyNmYjlhOTknLCcjZTMxYTFjJywnI2ZkYmY2ZicsJyNmZjdmMDAnLCcjY2FiMmQ2J10sXG4xMDogWycjYTZjZWUzJywnIzFmNzhiNCcsJyNiMmRmOGEnLCcjMzNhMDJjJywnI2ZiOWE5OScsJyNlMzFhMWMnLCcjZmRiZjZmJywnI2ZmN2YwMCcsJyNjYWIyZDYnLCcjNmEzZDlhJ10sXG4xMTogWycjYTZjZWUzJywnIzFmNzhiNCcsJyNiMmRmOGEnLCcjMzNhMDJjJywnI2ZiOWE5OScsJyNlMzFhMWMnLCcjZmRiZjZmJywnI2ZmN2YwMCcsJyNjYWIyZDYnLCcjNmEzZDlhJywnI2ZmZmY5OSddLFxuMTI6IFsnI2E2Y2VlMycsJyMxZjc4YjQnLCcjYjJkZjhhJywnIzMzYTAyYycsJyNmYjlhOTknLCcjZTMxYTFjJywnI2ZkYmY2ZicsJyNmZjdmMDAnLCcjY2FiMmQ2JywnIzZhM2Q5YScsJyNmZmZmOTknLCcjYjE1OTI4J11cbn0sUGFzdGVsMToge1xuMzogWycjZmJiNGFlJywnI2IzY2RlMycsJyNjY2ViYzUnXSxcbjQ6IFsnI2ZiYjRhZScsJyNiM2NkZTMnLCcjY2NlYmM1JywnI2RlY2JlNCddLFxuNTogWycjZmJiNGFlJywnI2IzY2RlMycsJyNjY2ViYzUnLCcjZGVjYmU0JywnI2ZlZDlhNiddLFxuNjogWycjZmJiNGFlJywnI2IzY2RlMycsJyNjY2ViYzUnLCcjZGVjYmU0JywnI2ZlZDlhNicsJyNmZmZmY2MnXSxcbjc6IFsnI2ZiYjRhZScsJyNiM2NkZTMnLCcjY2NlYmM1JywnI2RlY2JlNCcsJyNmZWQ5YTYnLCcjZmZmZmNjJywnI2U1ZDhiZCddLFxuODogWycjZmJiNGFlJywnI2IzY2RlMycsJyNjY2ViYzUnLCcjZGVjYmU0JywnI2ZlZDlhNicsJyNmZmZmY2MnLCcjZTVkOGJkJywnI2ZkZGFlYyddLFxuOTogWycjZmJiNGFlJywnI2IzY2RlMycsJyNjY2ViYzUnLCcjZGVjYmU0JywnI2ZlZDlhNicsJyNmZmZmY2MnLCcjZTVkOGJkJywnI2ZkZGFlYycsJyNmMmYyZjInXVxufSxQYXN0ZWwyOiB7XG4zOiBbJyNiM2UyY2QnLCcjZmRjZGFjJywnI2NiZDVlOCddLFxuNDogWycjYjNlMmNkJywnI2ZkY2RhYycsJyNjYmQ1ZTgnLCcjZjRjYWU0J10sXG41OiBbJyNiM2UyY2QnLCcjZmRjZGFjJywnI2NiZDVlOCcsJyNmNGNhZTQnLCcjZTZmNWM5J10sXG42OiBbJyNiM2UyY2QnLCcjZmRjZGFjJywnI2NiZDVlOCcsJyNmNGNhZTQnLCcjZTZmNWM5JywnI2ZmZjJhZSddLFxuNzogWycjYjNlMmNkJywnI2ZkY2RhYycsJyNjYmQ1ZTgnLCcjZjRjYWU0JywnI2U2ZjVjOScsJyNmZmYyYWUnLCcjZjFlMmNjJ10sXG44OiBbJyNiM2UyY2QnLCcjZmRjZGFjJywnI2NiZDVlOCcsJyNmNGNhZTQnLCcjZTZmNWM5JywnI2ZmZjJhZScsJyNmMWUyY2MnLCcjY2NjY2NjJ11cbn0sU2V0MToge1xuMzogWycjZTQxYTFjJywnIzM3N2ViOCcsJyM0ZGFmNGEnXSxcbjQ6IFsnI2U0MWExYycsJyMzNzdlYjgnLCcjNGRhZjRhJywnIzk4NGVhMyddLFxuNTogWycjZTQxYTFjJywnIzM3N2ViOCcsJyM0ZGFmNGEnLCcjOTg0ZWEzJywnI2ZmN2YwMCddLFxuNjogWycjZTQxYTFjJywnIzM3N2ViOCcsJyM0ZGFmNGEnLCcjOTg0ZWEzJywnI2ZmN2YwMCcsJyNmZmZmMzMnXSxcbjc6IFsnI2U0MWExYycsJyMzNzdlYjgnLCcjNGRhZjRhJywnIzk4NGVhMycsJyNmZjdmMDAnLCcjZmZmZjMzJywnI2E2NTYyOCddLFxuODogWycjZTQxYTFjJywnIzM3N2ViOCcsJyM0ZGFmNGEnLCcjOTg0ZWEzJywnI2ZmN2YwMCcsJyNmZmZmMzMnLCcjYTY1NjI4JywnI2Y3ODFiZiddLFxuOTogWycjZTQxYTFjJywnIzM3N2ViOCcsJyM0ZGFmNGEnLCcjOTg0ZWEzJywnI2ZmN2YwMCcsJyNmZmZmMzMnLCcjYTY1NjI4JywnI2Y3ODFiZicsJyM5OTk5OTknXVxufSxTZXQyOiB7XG4zOiBbJyM2NmMyYTUnLCcjZmM4ZDYyJywnIzhkYTBjYiddLFxuNDogWycjNjZjMmE1JywnI2ZjOGQ2MicsJyM4ZGEwY2InLCcjZTc4YWMzJ10sXG41OiBbJyM2NmMyYTUnLCcjZmM4ZDYyJywnIzhkYTBjYicsJyNlNzhhYzMnLCcjYTZkODU0J10sXG42OiBbJyM2NmMyYTUnLCcjZmM4ZDYyJywnIzhkYTBjYicsJyNlNzhhYzMnLCcjYTZkODU0JywnI2ZmZDkyZiddLFxuNzogWycjNjZjMmE1JywnI2ZjOGQ2MicsJyM4ZGEwY2InLCcjZTc4YWMzJywnI2E2ZDg1NCcsJyNmZmQ5MmYnLCcjZTVjNDk0J10sXG44OiBbJyM2NmMyYTUnLCcjZmM4ZDYyJywnIzhkYTBjYicsJyNlNzhhYzMnLCcjYTZkODU0JywnI2ZmZDkyZicsJyNlNWM0OTQnLCcjYjNiM2IzJ11cbn0sU2V0Mzoge1xuMzogWycjOGRkM2M3JywnI2ZmZmZiMycsJyNiZWJhZGEnXSxcbjQ6IFsnIzhkZDNjNycsJyNmZmZmYjMnLCcjYmViYWRhJywnI2ZiODA3MiddLFxuNTogWycjOGRkM2M3JywnI2ZmZmZiMycsJyNiZWJhZGEnLCcjZmI4MDcyJywnIzgwYjFkMyddLFxuNjogWycjOGRkM2M3JywnI2ZmZmZiMycsJyNiZWJhZGEnLCcjZmI4MDcyJywnIzgwYjFkMycsJyNmZGI0NjInXSxcbjc6IFsnIzhkZDNjNycsJyNmZmZmYjMnLCcjYmViYWRhJywnI2ZiODA3MicsJyM4MGIxZDMnLCcjZmRiNDYyJywnI2IzZGU2OSddLFxuODogWycjOGRkM2M3JywnI2ZmZmZiMycsJyNiZWJhZGEnLCcjZmI4MDcyJywnIzgwYjFkMycsJyNmZGI0NjInLCcjYjNkZTY5JywnI2ZjY2RlNSddLFxuOTogWycjOGRkM2M3JywnI2ZmZmZiMycsJyNiZWJhZGEnLCcjZmI4MDcyJywnIzgwYjFkMycsJyNmZGI0NjInLCcjYjNkZTY5JywnI2ZjY2RlNScsJyNkOWQ5ZDknXSxcbjEwOiBbJyM4ZGQzYzcnLCcjZmZmZmIzJywnI2JlYmFkYScsJyNmYjgwNzInLCcjODBiMWQzJywnI2ZkYjQ2MicsJyNiM2RlNjknLCcjZmNjZGU1JywnI2Q5ZDlkOScsJyNiYzgwYmQnXSxcbjExOiBbJyM4ZGQzYzcnLCcjZmZmZmIzJywnI2JlYmFkYScsJyNmYjgwNzInLCcjODBiMWQzJywnI2ZkYjQ2MicsJyNiM2RlNjknLCcjZmNjZGU1JywnI2Q5ZDlkOScsJyNiYzgwYmQnLCcjY2NlYmM1J10sXG4xMjogWycjOGRkM2M3JywnI2ZmZmZiMycsJyNiZWJhZGEnLCcjZmI4MDcyJywnIzgwYjFkMycsJyNmZGI0NjInLCcjYjNkZTY5JywnI2ZjY2RlNScsJyNkOWQ5ZDknLCcjYmM4MGJkJywnI2NjZWJjNScsJyNmZmVkNmYnXVxufX07XG59LHt9XSw0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW50ZXJwb2xhdG9yKHBvaW50cyl7XG4gIHZhciBwb2ludCwgXG4gICAgYWN0aW9uID0gJycsIFxuICAgIGxpbmVCdWlsZGVyID0gW107XG5cbiAgZm9yKHZhciBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGggLSAxOyBpKyspe1xuICAgIHBvaW50ID0gcG9pbnRzW2ldO1xuXG4gICAgaWYoaXNOYU4ocG9pbnRbMV0pKXtcbiAgICAgIGlmKGFjdGlvbiAhPT0gJycpIGFjdGlvbiA9ICdNJztcbiAgICB9IGVsc2Uge1xuICAgICAgbGluZUJ1aWxkZXIucHVzaChhY3Rpb24sIHBvaW50KTtcbiAgICAgIGFjdGlvbiA9ICdMJztcbiAgICB9XG4gIH1cbiAgXG4gIHBvaW50ID0gcG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXTtcbiAgaWYoIWlzTmFOKHBvaW50WzFdKSl7XG4gICAgbGluZUJ1aWxkZXIucHVzaChhY3Rpb24sIHBvaW50KTtcbiAgfVxuXG4gIHJldHVybiBsaW5lQnVpbGRlci5qb2luKCcnKTtcbn07XG59LHt9XX0se30sWzFdKVxuKDEpXG59KTtcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJ2xvZGFzaC5kZWJvdW5jZScpLFxuICAgIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdsb2Rhc2guaXNmdW5jdGlvbicpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnbG9kYXNoLmlzb2JqZWN0Jyk7XG5cbi8qKiBVc2VkIGFzIGFuIGludGVybmFsIGBfLmRlYm91bmNlYCBvcHRpb25zIG9iamVjdCAqL1xudmFyIGRlYm91bmNlT3B0aW9ucyA9IHtcbiAgJ2xlYWRpbmcnOiBmYWxzZSxcbiAgJ21heFdhaXQnOiAwLFxuICAndHJhaWxpbmcnOiBmYWxzZVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBleGVjdXRlZCwgd2lsbCBvbmx5IGNhbGwgdGhlIGBmdW5jYCBmdW5jdGlvblxuICogYXQgbW9zdCBvbmNlIHBlciBldmVyeSBgd2FpdGAgbWlsbGlzZWNvbmRzLiBQcm92aWRlIGFuIG9wdGlvbnMgb2JqZWN0IHRvXG4gKiBpbmRpY2F0ZSB0aGF0IGBmdW5jYCBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZVxuICogb2YgdGhlIGB3YWl0YCB0aW1lb3V0LiBTdWJzZXF1ZW50IGNhbGxzIHRvIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gd2lsbFxuICogcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3QgYGZ1bmNgIGNhbGwuXG4gKlxuICogTm90ZTogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCBgZnVuY2Agd2lsbCBiZSBjYWxsZWRcbiAqIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gaXNcbiAqIGludm9rZWQgbW9yZSB0aGFuIG9uY2UgZHVyaW5nIHRoZSBgd2FpdGAgdGltZW91dC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IEZ1bmN0aW9uc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gdGhyb3R0bGUuXG4gKiBAcGFyYW0ge251bWJlcn0gd2FpdCBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB0aHJvdHRsZSBleGVjdXRpb25zIHRvLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9dHJ1ZV0gU3BlY2lmeSBleGVjdXRpb24gb24gdGhlIGxlYWRpbmcgZWRnZSBvZiB0aGUgdGltZW91dC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV0gU3BlY2lmeSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyB0aHJvdHRsZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIGF2b2lkIGV4Y2Vzc2l2ZWx5IHVwZGF0aW5nIHRoZSBwb3NpdGlvbiB3aGlsZSBzY3JvbGxpbmdcbiAqIHZhciB0aHJvdHRsZWQgPSBfLnRocm90dGxlKHVwZGF0ZVBvc2l0aW9uLCAxMDApO1xuICogalF1ZXJ5KHdpbmRvdykub24oJ3Njcm9sbCcsIHRocm90dGxlZCk7XG4gKlxuICogLy8gZXhlY3V0ZSBgcmVuZXdUb2tlbmAgd2hlbiB0aGUgY2xpY2sgZXZlbnQgaXMgZmlyZWQsIGJ1dCBub3QgbW9yZSB0aGFuIG9uY2UgZXZlcnkgNSBtaW51dGVzXG4gKiBqUXVlcnkoJy5pbnRlcmFjdGl2ZScpLm9uKCdjbGljaycsIF8udGhyb3R0bGUocmVuZXdUb2tlbiwgMzAwMDAwLCB7XG4gKiAgICd0cmFpbGluZyc6IGZhbHNlXG4gKiB9KSk7XG4gKi9cbmZ1bmN0aW9uIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgdmFyIGxlYWRpbmcgPSB0cnVlLFxuICAgICAgdHJhaWxpbmcgPSB0cnVlO1xuXG4gIGlmICghaXNGdW5jdGlvbihmdW5jKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gIH1cbiAgaWYgKG9wdGlvbnMgPT09IGZhbHNlKSB7XG4gICAgbGVhZGluZyA9IGZhbHNlO1xuICB9IGVsc2UgaWYgKGlzT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgbGVhZGluZyA9ICdsZWFkaW5nJyBpbiBvcHRpb25zID8gb3B0aW9ucy5sZWFkaW5nIDogbGVhZGluZztcbiAgICB0cmFpbGluZyA9ICd0cmFpbGluZycgaW4gb3B0aW9ucyA/IG9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcbiAgfVxuICBkZWJvdW5jZU9wdGlvbnMubGVhZGluZyA9IGxlYWRpbmc7XG4gIGRlYm91bmNlT3B0aW9ucy5tYXhXYWl0ID0gd2FpdDtcbiAgZGVib3VuY2VPcHRpb25zLnRyYWlsaW5nID0gdHJhaWxpbmc7XG5cbiAgcmV0dXJuIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGRlYm91bmNlT3B0aW9ucyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdGhyb3R0bGU7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIGlzRnVuY3Rpb24gPSByZXF1aXJlKCdsb2Rhc2guaXNmdW5jdGlvbicpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnbG9kYXNoLmlzb2JqZWN0JyksXG4gICAgbm93ID0gcmVxdWlyZSgnbG9kYXNoLm5vdycpO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHNob3J0Y3V0cyBmb3IgbWV0aG9kcyB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcyAqL1xudmFyIG5hdGl2ZU1heCA9IE1hdGgubWF4O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgZGVsYXkgdGhlIGV4ZWN1dGlvbiBvZiBgZnVuY2AgdW50aWwgYWZ0ZXJcbiAqIGB3YWl0YCBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgaXQgd2FzIGludm9rZWQuXG4gKiBQcm92aWRlIGFuIG9wdGlvbnMgb2JqZWN0IHRvIGluZGljYXRlIHRoYXQgYGZ1bmNgIHNob3VsZCBiZSBpbnZva2VkIG9uXG4gKiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuIFN1YnNlcXVlbnQgY2FsbHNcbiAqIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2lsbCByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgbGFzdCBgZnVuY2AgY2FsbC5cbiAqXG4gKiBOb3RlOiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgIGBmdW5jYCB3aWxsIGJlIGNhbGxlZFxuICogb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQgb25seSBpZiB0aGUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiBpc1xuICogaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBkZWJvdW5jZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSB3YWl0IFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5LlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBvYmplY3QuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmxlYWRpbmc9ZmFsc2VdIFNwZWNpZnkgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4V2FpdF0gVGhlIG1heGltdW0gdGltZSBgZnVuY2AgaXMgYWxsb3dlZCB0byBiZSBkZWxheWVkIGJlZm9yZSBpdCdzIGNhbGxlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV0gU3BlY2lmeSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBkZWJvdW5jZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIC8vIGF2b2lkIGNvc3RseSBjYWxjdWxhdGlvbnMgd2hpbGUgdGhlIHdpbmRvdyBzaXplIGlzIGluIGZsdXhcbiAqIHZhciBsYXp5TGF5b3V0ID0gXy5kZWJvdW5jZShjYWxjdWxhdGVMYXlvdXQsIDE1MCk7XG4gKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgbGF6eUxheW91dCk7XG4gKlxuICogLy8gZXhlY3V0ZSBgc2VuZE1haWxgIHdoZW4gdGhlIGNsaWNrIGV2ZW50IGlzIGZpcmVkLCBkZWJvdW5jaW5nIHN1YnNlcXVlbnQgY2FsbHNcbiAqIGpRdWVyeSgnI3Bvc3Rib3gnKS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAzMDAsIHtcbiAqICAgJ2xlYWRpbmcnOiB0cnVlLFxuICogICAndHJhaWxpbmcnOiBmYWxzZVxuICogfSk7XG4gKlxuICogLy8gZW5zdXJlIGBiYXRjaExvZ2AgaXMgZXhlY3V0ZWQgb25jZSBhZnRlciAxIHNlY29uZCBvZiBkZWJvdW5jZWQgY2FsbHNcbiAqIHZhciBzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoJy9zdHJlYW0nKTtcbiAqIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgXy5kZWJvdW5jZShiYXRjaExvZywgMjUwLCB7XG4gKiAgICdtYXhXYWl0JzogMTAwMFxuICogfSwgZmFsc2UpO1xuICovXG5mdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBhcmdzLFxuICAgICAgbWF4VGltZW91dElkLFxuICAgICAgcmVzdWx0LFxuICAgICAgc3RhbXAsXG4gICAgICB0aGlzQXJnLFxuICAgICAgdGltZW91dElkLFxuICAgICAgdHJhaWxpbmdDYWxsLFxuICAgICAgbGFzdENhbGxlZCA9IDAsXG4gICAgICBtYXhXYWl0ID0gZmFsc2UsXG4gICAgICB0cmFpbGluZyA9IHRydWU7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgfVxuICB3YWl0ID0gbmF0aXZlTWF4KDAsIHdhaXQpIHx8IDA7XG4gIGlmIChvcHRpb25zID09PSB0cnVlKSB7XG4gICAgdmFyIGxlYWRpbmcgPSB0cnVlO1xuICAgIHRyYWlsaW5nID0gZmFsc2U7XG4gIH0gZWxzZSBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcbiAgICBsZWFkaW5nID0gb3B0aW9ucy5sZWFkaW5nO1xuICAgIG1heFdhaXQgPSAnbWF4V2FpdCcgaW4gb3B0aW9ucyAmJiAobmF0aXZlTWF4KHdhaXQsIG9wdGlvbnMubWF4V2FpdCkgfHwgMCk7XG4gICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyBvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XG4gIH1cbiAgdmFyIGRlbGF5ZWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3coKSAtIHN0YW1wKTtcbiAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgIGlmIChtYXhUaW1lb3V0SWQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KG1heFRpbWVvdXRJZCk7XG4gICAgICB9XG4gICAgICB2YXIgaXNDYWxsZWQgPSB0cmFpbGluZ0NhbGw7XG4gICAgICBtYXhUaW1lb3V0SWQgPSB0aW1lb3V0SWQgPSB0cmFpbGluZ0NhbGwgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAoaXNDYWxsZWQpIHtcbiAgICAgICAgbGFzdENhbGxlZCA9IG5vdygpO1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgICAgICBpZiAoIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XG4gICAgICAgICAgYXJncyA9IHRoaXNBcmcgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZGVsYXllZCwgcmVtYWluaW5nKTtcbiAgICB9XG4gIH07XG5cbiAgdmFyIG1heERlbGF5ZWQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGltZW91dElkKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gICAgbWF4VGltZW91dElkID0gdGltZW91dElkID0gdHJhaWxpbmdDYWxsID0gdW5kZWZpbmVkO1xuICAgIGlmICh0cmFpbGluZyB8fCAobWF4V2FpdCAhPT0gd2FpdCkpIHtcbiAgICAgIGxhc3RDYWxsZWQgPSBub3coKTtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpc0FyZywgYXJncyk7XG4gICAgICBpZiAoIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XG4gICAgICAgIGFyZ3MgPSB0aGlzQXJnID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgc3RhbXAgPSBub3coKTtcbiAgICB0aGlzQXJnID0gdGhpcztcbiAgICB0cmFpbGluZ0NhbGwgPSB0cmFpbGluZyAmJiAodGltZW91dElkIHx8ICFsZWFkaW5nKTtcblxuICAgIGlmIChtYXhXYWl0ID09PSBmYWxzZSkge1xuICAgICAgdmFyIGxlYWRpbmdDYWxsID0gbGVhZGluZyAmJiAhdGltZW91dElkO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIW1heFRpbWVvdXRJZCAmJiAhbGVhZGluZykge1xuICAgICAgICBsYXN0Q2FsbGVkID0gc3RhbXA7XG4gICAgICB9XG4gICAgICB2YXIgcmVtYWluaW5nID0gbWF4V2FpdCAtIChzdGFtcCAtIGxhc3RDYWxsZWQpLFxuICAgICAgICAgIGlzQ2FsbGVkID0gcmVtYWluaW5nIDw9IDA7XG5cbiAgICAgIGlmIChpc0NhbGxlZCkge1xuICAgICAgICBpZiAobWF4VGltZW91dElkKSB7XG4gICAgICAgICAgbWF4VGltZW91dElkID0gY2xlYXJUaW1lb3V0KG1heFRpbWVvdXRJZCk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdENhbGxlZCA9IHN0YW1wO1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoIW1heFRpbWVvdXRJZCkge1xuICAgICAgICBtYXhUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KG1heERlbGF5ZWQsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0NhbGxlZCAmJiB0aW1lb3V0SWQpIHtcbiAgICAgIHRpbWVvdXRJZCA9IGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgIH1cbiAgICBlbHNlIGlmICghdGltZW91dElkICYmIHdhaXQgIT09IG1heFdhaXQpIHtcbiAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZGVsYXllZCwgd2FpdCk7XG4gICAgfVxuICAgIGlmIChsZWFkaW5nQ2FsbCkge1xuICAgICAgaXNDYWxsZWQgPSB0cnVlO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgICB9XG4gICAgaWYgKGlzQ2FsbGVkICYmICF0aW1lb3V0SWQgJiYgIW1heFRpbWVvdXRJZCkge1xuICAgICAgYXJncyA9IHRoaXNBcmcgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cbnZhciBpc05hdGl2ZSA9IHJlcXVpcmUoJ2xvZGFzaC5faXNuYXRpdmUnKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRoYXQgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBVbml4IGVwb2NoXG4gKiAoMSBKYW51YXJ5IDE5NzAgMDA6MDA6MDAgVVRDKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFV0aWxpdGllc1xuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgc3RhbXAgPSBfLm5vdygpO1xuICogXy5kZWZlcihmdW5jdGlvbigpIHsgY29uc29sZS5sb2coXy5ub3coKSAtIHN0YW1wKTsgfSk7XG4gKiAvLyA9PiBsb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBmdW5jdGlvbiB0byBiZSBjYWxsZWRcbiAqL1xudmFyIG5vdyA9IGlzTmF0aXZlKG5vdyA9IERhdGUubm93KSAmJiBub3cgfHwgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbm93O1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgaW50ZXJuYWwgW1tDbGFzc11dIG9mIHZhbHVlcyAqL1xudmFyIHRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBpZiBhIG1ldGhvZCBpcyBuYXRpdmUgKi9cbnZhciByZU5hdGl2ZSA9IFJlZ0V4cCgnXicgK1xuICBTdHJpbmcodG9TdHJpbmcpXG4gICAgLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJylcbiAgICAucmVwbGFjZSgvdG9TdHJpbmd8IGZvciBbXlxcXV0rL2csICcuKj8nKSArICckJ1xuKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNOYXRpdmUodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nICYmIHJlTmF0aXZlLnRlc3QodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTmF0aXZlO1xuIiwiLyoqXG4gKiBMby1EYXNoIDIuNC4xIChDdXN0b20gQnVpbGQpIDxodHRwOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIG1vZGVybiBleHBvcnRzPVwibnBtXCIgLW8gLi9ucG0vYFxuICogQ29weXJpZ2h0IDIwMTItMjAxMyBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS41LjIgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHA6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKi9cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBmdW5jdGlvbiwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oXyk7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRnVuY3Rpb247XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xudmFyIG9iamVjdFR5cGVzID0gcmVxdWlyZSgnbG9kYXNoLl9vYmplY3R0eXBlcycpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBsYW5ndWFnZSB0eXBlIG9mIE9iamVjdC5cbiAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0c1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KDEpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgLy8gY2hlY2sgaWYgdGhlIHZhbHVlIGlzIHRoZSBFQ01BU2NyaXB0IGxhbmd1YWdlIHR5cGUgb2YgT2JqZWN0XG4gIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmlvLyN4OFxuICAvLyBhbmQgYXZvaWQgYSBWOCBidWdcbiAgLy8gaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjI5MVxuICByZXR1cm4gISEodmFsdWUgJiYgb2JqZWN0VHlwZXNbdHlwZW9mIHZhbHVlXSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG4iLCIvKipcbiAqIExvLURhc2ggMi40LjEgKEN1c3RvbSBCdWlsZCkgPGh0dHA6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgbW9kZXJuIGV4cG9ydHM9XCJucG1cIiAtbyAuL25wbS9gXG4gKiBDb3B5cmlnaHQgMjAxMi0yMDEzIFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjUuMiA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cDovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqL1xuXG4vKiogVXNlZCB0byBkZXRlcm1pbmUgaWYgdmFsdWVzIGFyZSBvZiB0aGUgbGFuZ3VhZ2UgdHlwZSBPYmplY3QgKi9cbnZhciBvYmplY3RUeXBlcyA9IHtcbiAgJ2Jvb2xlYW4nOiBmYWxzZSxcbiAgJ2Z1bmN0aW9uJzogdHJ1ZSxcbiAgJ29iamVjdCc6IHRydWUsXG4gICdudW1iZXInOiBmYWxzZSxcbiAgJ3N0cmluZyc6IGZhbHNlLFxuICAndW5kZWZpbmVkJzogZmFsc2Vcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0VHlwZXM7XG4iLCJ2YXIgcGFyYWxsZWxDb29yZGluYXRlQ2hhcnQgPSByZXF1aXJlKCdwYXJhbGxlbC1jb29yZGluYXRlcy1jaGFydCcpO1xyXG52YXIgdGhyb3R0bGUgPSByZXF1aXJlKCdsb2Rhc2gudGhyb3R0bGUnKTtcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdwYXJhbGxlbENvb3JkaW5hdGVzQ2hhcnQnLCBbXSlcclxuLmRpcmVjdGl2ZSgncGFyYWxsZWxDb29yZGluYXRlc0NoYXJ0JywgZnVuY3Rpb24gcGFyYWxsZWxDb29yZGluYXRlc0NoYXJ0KCl7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICBzY29wZToge1xyXG4gICAgICAnZGF0YSc6ICc9JyxcclxuICAgICAgJ3NlbGVjdCc6ICc9JyxcclxuICAgICAgJ2NvbmZpZyc6ICc9JyxcclxuICAgICAgJ2hpZ2hsaWdodCc6ICdAJyxcclxuICAgICAgJ3dpZHRoJzogJ0AnLFxyXG4gICAgICAnaGVpZ2h0JzogJ0AnXHJcbiAgICB9LFxyXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcclxuICAgICAgdmFyIGNoYXJ0ID0gcGFyYWxsZWxDb29yZGluYXRlQ2hhcnQoKTtcclxuICAgICAgdmFyIGQzRWxlbWVudCA9IGQzLnNlbGVjdChlbGVtZW50WzBdKTtcclxuXHJcbiAgICAgIC8vIFByZXZlbnQgYXR0ZW1wdHMgdG8gZHJhdyBtb3JlIHRoYW4gb25jZSBhIGZyYW1lXHJcbiAgICAgIHZhciByZWRyYXcgPSB0aHJvdHRsZShjaGFydC5yZWRyYXcsIDE2KTtcclxuXHJcbiAgICAgIHNjb3BlLiR3YXRjaChhdHRycy5zZWxlY3QsIGZ1bmN0aW9uKHZhbHVlKXtcclxuICAgICAgICBpZih2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICAgICAgY2hhcnQuZGltZW5zaW9ucyh2YWx1ZSk7XHJcbiAgICAgICAgcmVkcmF3KGQzRWxlbWVudCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgYXR0cnMuJG9ic2VydmUoJ2hpZ2hsaWdodCcsIGZ1bmN0aW9uKHZhbHVlKXtcclxuICAgICAgICBjaGFydC5oaWdobGlnaHQodmFsdWUgfHwgJycpO1xyXG4gICAgICAgIHJlZHJhdyhkM0VsZW1lbnQpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGF0dHJzLiRvYnNlcnZlKCd3aWR0aCcsIGZ1bmN0aW9uKHZhbHVlKXtcclxuICAgICAgICBpZighdmFsdWUgJiYgdmFsdWUgIT09IDApIHJldHVybjtcclxuICAgICAgICBjaGFydC53aWR0aCh2YWx1ZSk7XHJcbiAgICAgICAgcmVkcmF3KGQzRWxlbWVudCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgYXR0cnMuJG9ic2VydmUoJ2hlaWdodCcsIGZ1bmN0aW9uKHZhbHVlKXtcclxuICAgICAgICBpZighdmFsdWUgJiYgdmFsdWUgIT09IDApIHJldHVybjtcclxuICAgICAgICBjaGFydC5oZWlnaHQodmFsdWUpO1xyXG4gICAgICAgIHJlZHJhdyhkM0VsZW1lbnQpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHNjb3BlLiR3YXRjaChhdHRycy5jb25maWcsIGZ1bmN0aW9uKHZhbHVlKXtcclxuICAgICAgICBpZighdmFsdWUpIHJldHVybjtcclxuICAgICAgICBcclxuICAgICAgICBPYmplY3Qua2V5cyh2YWx1ZSkuZm9yRWFjaChmdW5jdGlvbihrZXkpe1xyXG4gICAgICAgICAgY2hhcnRba2V5XSh2YWx1ZVtrZXldKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBzY29wZS4kd2F0Y2goYXR0cnMuZGF0YSwgZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgIGlmKCF2YWx1ZSkgcmV0dXJuO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGQzRWxlbWVudC5kYXR1bSh2YWx1ZSk7XHJcbiAgICAgICAgcmVkcmF3KGQzRWxlbWVudCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcbn0pOyJdfQ==
(10)
});
