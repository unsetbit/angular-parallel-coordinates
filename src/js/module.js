var parallelCoordinateChart = require('parallel-coordinates-chart');
var throttle = require('lodash.throttle');

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