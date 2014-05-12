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