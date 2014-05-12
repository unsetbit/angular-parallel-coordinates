# Angular Parallel Coordinates

[Parallel coordinates](http://en.wikipedia.org/wiki/Parallel_coordinates) are useful for
visualizing multivariate data. This is an Angular directive wrapper around [parallel-coordinates-chart](https://github.com/oztu/parallel-coordinates-chart) to allow for easy creation of charts which look like this:

<img src="https://raw.githubusercontent.com/oztu/parallel-coordinates-chart/master/example/screenshot.png"/>

## Example
```html
<script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular.min.js"></script>
<link type="text/css" rel="stylesheet" href="dist/angular-parallel-coordinates.css" />
<script src="dist/angular-parallel-coordinates.js"></script>

<parallel-coordinates-chart
	width="{{width}}"
	height="{{height}}"
	highlight="{{highlight}}"
	select="dimensions"
	data="data" 
	config="config" 
/>

<script>
  angular.module('example', ['parallelCoordinatesChart'])
    .controller('example', function($scope, $http, $interval){
      $http.get('data.json').then(function(response){
        $scope.data = response.data;
        
        // Get the keys for the dimensions of the data
        var dimensions = Object.keys($scope.data[0]);

        // Change the highlighted dimension every 3 seconds
        $interval(function(){
          $scope.highlight = dimensions[(Math.random() * dimensions.length - 1)|0];
        }, 3000);
      });
    });
</script>
```

## Usage
`bower install angular-parallel-coordinates` and add `angular-parallel-coordinates.js` and `angular-parallel-coordinates.css` to your application. [D3](http://d3js.org/) and [AngularJS](https://angularjs.org/) must be included in the app prior to this directive.

The chart will redraw itself if any of these attributes are modified during runtime.

## API
```html
	<script>
		// first make sure you declare the directive as a dependency in your module
		angular.module('myModule', ['parallelCoordinatesChart' /*, ... other dependencies ... */]);
		// ...
	</script>
	

	<parallel-coordinates-chart
		<!-->
		<!-- 'width' is the width of the chart -->
		width="{{width}}"
		<!-- 'height' is the height of the chart -->
		height="{{height}}"
		<!-- 'highlight' is the currently highlighted dimension -->
		highlight="{{highlight}}"

		<!-- 'select' determins which dimensions of the data should be visualized -->
		select="dimensions"

		<!-- 'data' should be an array of objects representing the data to visualize -->
		data="data" 
		
		<!-- 'config' takes in a parallel-coordinates-chart configuration object -->
		config="config"
	/>
```


## Credits

This is largely based off of [Jason Davies's example for drawing parallel coordinates charts using d3](http://bl.ocks.org/jasondavies/1341281).