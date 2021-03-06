'use strict'

// colors
const YELLOW = '#FECA3D';
const RED = '#FB441E';

// response keys
const VARIANCE = 'variance';
const FIXATION = "Fixation";
const SACCADE = "Saccade";
const DURATION = "Duration";
const HULL = "ConvexHull"
const SUM = "sum";
const AREA = "Area";
const MEAN = "mean";
const COUNT = "Count";
const SACCADE_LENGTH = 'SaccadeLength';
const POINTS = "Points";
const SAMPLES = 'Samples';
const STATS = 'stats';
const PUPIL = "Pupil";
const PUPIL_LEFT = "PupilLeft";
const PUPIL_RIGHT = "PupilRight";
const ABS_ANGLE = "AbsoluteSaccadicDirection";
const REL_ANGLE = "RelativeSaccadicDirection";
const ANGLE = "Angle"
const META = 'Meta';
const UNITS = 'units';

// raw tabel entries
const ALL_STATS = [
	'name', 
	'units',
	'mean', 
	'median', 
	'mode', 
	'stddev', 
	'variance', 
	'sum', 
	'min',
	'max',
	'plot'
];

const GRAPH_TITLE_FONT_SIZE = 16;
const GRAPH_LABEL_FONT_SIZE = 12;

var decimalFormat = d3.format('.2f');

// event handlers
$('#uploadForm').submit(function(e) {

	e.preventDefault();
	
	console.log($(this)[0]);
	
	$.ajax({
			url: '/uploads',
			type: 'POST',
			success: function(data) {
				handleResponse(data);
			},
			data: new FormData($(this)[0]),
			processData: false,
			contentType: false
	})
})


$('#file').change(function(e) {
	var path = this.value;
	var fileBegin = path.lastIndexOf('\\') + 1;
	var file = path.substring(fileBegin)
	$('#fileLbl').text(file);
})


$("#validitySlider").slider({
	min: 0,
	max: 4,
	step: 1
});


$("#timeSlider").slider({
	min: 0,
	max: 4,
	step: 1
});


$("#eventSlider").slider({
	min: 0,
	max: 4,
	step: 1
});


// response parsing
function handleResponse(data) {
	
	Responder.parse(data);
	
	var outputContainer = $('#ocontainer');
	
	outputContainer.show();
		
	displayResults(Responder);
	
	$('html, body').animate( {
			scrollTop: outputContainer.offset().top
		}, 500);
}
		

function displayResults(responder) {

	appendMeasuresOfSearch(responder);
	
	appendMeasuresOfProcessing(responder);
	
	appendMeasuresOfCognition(responder);
	
	appendRawMeasures(responder);
	
}


function appendMeasuresOfSearch(res) {
	
	var histGrapher = function(title, samples) {
		return function() { showHistogram('searchGraph', title, samples) };
	}
	
	var tableData = [];
	
	var fixCountRow = getMeasureRowData('Fixation Duration', 'Fixation Count', 'count', null, res);
	tableData.push(fixCountRow);
	
	var sacCountRow = getMeasureRowData('Saccade Duration', 'Saccade Count', 'count', null, res);
	tableData.push(sacCountRow);
	
	var sacLengthRow = getMeasureRowData('Saccade Length', 'Average Scanpath Length', 'mean', histGrapher, res);
	tableData.push(sacLengthRow);
	
	var points = res.getProp('points', 'Fixation Hull');
	var hullPoints = res.getProp('hullPoints', 'Fixation Hull');
	
	var scanpathRow = getMeasureRowData('Saccade Length', 'Total Scanpath Length', 'sum', null, res);
	scanpathRow.graph = function() { showCoordinatePlot('searchGraph', points, hullPoints) };
	tableData.push(scanpathRow);
	
	tableData.push(
		measureRowData(
			'Fixation Convex Hull Area',
			'px<sup>2</sup>',
			res.getProp('area', 'Fixation Hull'),
			function() { showCoordinatePlot('searchGraph', points, hullPoints) }
		)
	)
	
	appendMeasureTable('search', d3.select('#sBox .measText'), tableData);
}


function appendMeasuresOfProcessing(res) {

	var histGrapher = function(title, samples) {
		return function() { showHistogram('procGraph', title, samples) };
	}
	
	var tableData = [];
	
	tableData.push(getMeasureRowData('Fixation Duration', 'Average Fixation Duration', 'mean', histGrapher, res));
	
	tableData.push(getMeasureRowData('Saccade Duration', 'Average Saccade Duration', 'mean', histGrapher, res));
	
	var avgFixDur = res.getStat('mean', 'Fixation Duration');
	var avgSacDur = res.getStat('mean', 'Saccade Duration');
	tableData.push(
		measureRowData(
			'Fixation to Saccade Duration Ratio',
			'#',
		 	avgFixDur / avgSacDur,
		 	null
		)
	)
	
	appendMeasureTable('processing', d3.select('#pBox .measText'), tableData);
}


function appendMeasuresOfCognition(res) {
	
	var histGrapher = function(title, samples) {
		return function() { showHistogram('cogGraph', title, samples) };
	}
	
	var tableData = [];
	
	tableData.push(getMeasureRowData('Left Pupil', 'Average Left Pupil Width', 'mean', histGrapher, res));
	tableData.push(getMeasureRowData('Right Pupil', 'Average Right Pupil Width', 'mean', histGrapher, res));
	tableData.push(getMeasureRowData('Relative Angle', 'Sum of Relative Angles', 'sum', histGrapher, res));	
	tableData.push(getMeasureRowData('Absolute Angle', 'Sum of Absolute Angles', 'sum', histGrapher, res));

	appendMeasureTable('cognition', d3.select('#cBox .measText'), tableData);
}


function getMeasureRowData(measure, name, metric, grapher, responder) {
	
	var units = metric == 'count' ? '#' : responder.getUnits(measure);
	
	var stat = responder.getStat(metric, measure);
	var value = stat ? stat : responder.getProp(metric, measure);
	
	var graph = grapher ? grapher(name, responder.getSamples(measure)) : null;
	
	return measureRowData(name, units, value, graph);
}


function measureRowData(m, u, v, g) {	
		return {
			'measure' : m,
			'units' : u,
			'value' : v,
			'graph' : g
	}
}


function appendRawMeasures(responder) {

	appendKeyValueTable(responder.getMeta(), 'Metadata');
	
// 	appendKeyValueTable(getCounts(res), 'Counts'); TODO
	
	appendStats(getStats(responder));
}


// result box building
function getCounts(res) {
	var counts = {};
	counts[SACCADE] = res[SACCADE][COUNT];
	counts[FIXATION] = res[FIXATION][COUNT];
	return counts;
}


function appendKeyValueTable(data, name) {

	data = Object.keys(data).map(function(k) {
		return [k, data[k]];
	});
	
	var headings = ['Measure', 'Value'];
	
	var table = d3.select('#' + name.toLowerCase())
		.append('table');
		
	table.append('caption')
		.html(name);
		
	appendTableHead(table, headings); 
	
	var cells = table.append('tbody')
		.selectAll('tr')
		.data(data)
			.enter()
			.append('tr')
			.selectAll('td')
			.data(function(d) { return d; })
			.enter()
				.append('td')
				.style('font-weight', function(d, i) { return i == 0 ? 'bold' : 'normal'; })
				.style('text-align', function(d, i) { return i == 0 ? 'center' : 'right'; })
				.html(function(d, i) { return d; });
}


function getStats(responder) {

	var measures = responder.getMeasures();

	var stats = [];
	
	for (var name in measures) {
		var m = measures[name];
		if (m.hasOwnProperty('stats')) {
			m['name'] = name;
			stats.push(m);
		}
	}
	
	console.log(stats);
	return stats;
}


function appendStats(stats) {

	var headings = ALL_STATS;
	
	var table = d3.select('#stats')
		.append('table')
		.attr('class', 'statTable rawTable');
		
	table.append('caption')
		.html('All Measure Statistics');
		
	appendTableHead(table, headings); 
	
	var cells = table.append('tbody')
		.selectAll('tr')
		.data(stats)
			.enter()
			.append('tr')
			.selectAll('td')
			.data(function(d, i) { 
				var stats = d['stats'];
				var data = [];
				data[0] = { 'name': d['name'] };
				data[1] = { 'units' : formatUnits(d['units']) };
				for (var i = 2; i < ALL_STATS.length - 1; i++) {
					var s = ALL_STATS[i];
					data.push({ [s] : stats[ALL_STATS[i]] });
				}
				var n = formatCell(d['name']);
				data.push({ 'Plot' : function() { appendLine(n, n + '( ' + d['units'] + ')', d['samples']); } });
				return data;
			})
			.enter()
				.append('td')
				.style('text-align', function(d, i) { 
					return (i == 0 || i == 1) ? 'center' : 'right'; 
				})
				.style('font-weight', function(d, i) { 
					return i == 0 ? 'bold' : 'normal' 
				})
				.html(function(d, i) { 
					var key = Object.keys(d)[0];
					console.log(key);
					if (key == 'Plot') {
						return '';
					}
					else {
						return formatCell(d[key]); 
					}
				});
				
	var radios = cells.filter(function(d, i) { 
				return i == ALL_STATS.length - 1;
			})
			.style('text-align', 'center')
			.append('input')
			.attr('type', 'radio')
			.attr('name', 'rawStats')
			.on('click', function() {
				var f = d3.select(this.parentNode).datum()['Plot'];
				f();
			});
			
	click(radios.nodes()[0]);
}


// table building
function appendTableHead(table, headings) {

	table.append('thead')
		.append('tr')
		.selectAll('th')
		.data(headings)
		.enter()
			.append('th')
			.attr('class', 'measHead')
			.html(function(d) { return d; })
}


function appendMeasureTable(name, elem, data) {

	var headings = Object.keys(data[0]);
	
	var table = elem.append('table')
		.attr('class', 'measTable');
	
	appendTableHead(table, headings);
		
	var cells = table.append('tbody')
		.selectAll('tr')
		.data(data)
			.enter()
			.append('tr')
			.selectAll('td')
			.data(function(d) {
				var props = [];
				for (var i = 0; i < headings.length; i++) {
					props[i] = d[headings[i]];
				}
				return props;
			})
			.enter()
				.append('td')
				.attr('class', 'measCell')
				.style('font-weight', function(d, i) { return i == 0 ? 'bold' : 'normal'; })
				.html(function(d, i) { 
						switch(i) {
							case 0: 
								return d;
							case 1:
								return formatUnits(d);
							case 2: 
								return decimalFormat(d);
							case 3: 
								return "";
						}
				});
	
	// Plot cells without graph.
	cells.filter(function(d, i) { 
				return i == headings.length - 1 && d === null; 
			})
			.html('X');
				
	// Plot cells with graph.		
	var radios = cells.filter(function(d, i) { 
				return i == headings.length - 1 && d !== null; 
			})
			.append('input')
			.attr('type', 'radio')
			.attr('name', name + 'Plot')
			.on('click', function() {
				(d3.select(this.parentNode).datum())();
			});
			
		click(radios.nodes()[0])
}


// histogram graph
function showHistogram(graphId, title, data) {
	data = data.map(function(s) { return s.v; });
	appendHistogram(title, d3.select('#' + graphId), data);
}


function appendHistogram(graphTitle, svg, data) {

	svg.selectAll('*').remove();
		
	// sizing
		 
	var margin = { top: GRAPH_TITLE_FONT_SIZE + 12, bottom: 50, left: 50, right: 20 };
	var dimensions = getGraphDimensions();
	var height = dimensions.height;
	var width = dimensions.width;
	var graphHeight = height - margin.top - margin.bottom;
	var graphWidth = width - margin.left - margin.right;
	
	// scales and generators
	
	var extentX = d3.extent(data);
	
	var x = d3.scaleLinear()
		.domain(extentX)
		.rangeRound([0, graphWidth]);

	var bin = d3.histogram()
		.domain(x.domain())
		.thresholds(formattedTickValues(extentX));
		
	var bins = bin(data);

	var extentY = [0, d3.max(bins, function(d) { return d.length })];
	
	var y = d3.scaleLinear(extentY)
		.domain(extentY)
		.range([graphHeight, 0]);
		
	var tickFormatter = extentX[1] > 9 ? d3.format(',.0f') : d3.format('.1f');
	var xaxis = d3.axisBottom(x)
			.tickValues(formattedTickValues(extentX))
			.tickFormat(tickFormatter)
			.tickPadding(6);
			
	var yaxis = d3.axisLeft(y)
		.tickValues(formattedTickValues(extentY))
		.tickSizeInner(-graphWidth)
		.tickSizeOuter(3)
		.tickPadding(8);
		
	var barWidth =  x(bins[0].x1) - x(bins[0].x0);
	
	// appends 
	
	svg.attr('width', width).attr('height', height);

	appendTitle(svg, margin, dimensions, graphTitle)
	appendYAxis(svg, yaxis, margin, dimensions, 'Count');
	appendXAxis(svg, xaxis, margin, dimensions, 'Length (px)');
	
	var g = svg.append('g')
		.attr('width', graphWidth)
		.attr('height', graphHeight)
		.attr('transform', translate(margin.left, margin.top));
		
	var bars = g.selectAll('.bar')
		.data(bins)
		.enter()
			.append('g')
			.attr('class', 'bar')
			.attr('transform', function(d) { return translate(x(d.x0) ,y(d.length)); });
		
	bars.append('rect')
		.attr('x', 1)
		.attr('width', barWidth - 4)
		.attr('height', function(d) { return graphHeight - y(d.length); })
		.style('fill', YELLOW);
}


// coordinate plot graph
function showCoordinatePlot(id, points1, points2) {
	appendCoordinatePlot(d3.select('#' + id), points1, points2);
}


function appendCoordinatePlot(svg, points, hull) {

	points = points.map(function(p) { return p.p; });
	
	svg.selectAll('*').remove();
	
	// sizing
	
	var margin = { top: GRAPH_TITLE_FONT_SIZE + 12, bottom: 30, left: 40, right: 20 };
	var dimensions = getGraphDimensions();
	var height = dimensions.height;
	var width = dimensions.width;
	var graphHeight = height - margin.top - margin.bottom;
	var graphWidth = width - margin.left - margin.right;
	
	// scales and generators

	var xdomain = d3.extent(points, function(p) {
		return p.x;
	});
	
	var ydomain = d3.extent(points, function(p) {
		return p.y;
	});
	
	var xline = d3.scaleLinear()
		.domain(xdomain)
		.range([0, graphWidth]);
		
	var yline = d3.scaleLinear()
		.domain(ydomain)
		.range([graphHeight, 0]);
		
	var line = d3.line()
		.x(function(d) { return xline(d.x); })
		.y(function(d) { return yline(d.y); });
		
	var xaxis = d3.axisBottom(xline).tickValues(xdomain)
	var yaxis = d3.axisLeft(yline).tickValues(ydomain);
	
	// appends
	
	appendTitle(svg, margin, dimensions, 'Scanpath and Convex Hull Plot')	
	appendXAxis(svg, xaxis, margin, dimensions, 'X (px)');
	appendYAxis(svg, yaxis, margin, dimensions, 'Y (px)');

	svg
		.attr('height', height)
		.attr('width', width);
		
	var g = svg.append('g')
		.attr('width', graphWidth)
		.attr('height', graphHeight)
		.attr('transform', translate(margin.left, margin.top));

	// draw hull
	g.append('path')
		.attr('d', function(d)  { return line(hull); })
		.style('stroke', YELLOW)
		.style('stroke-width', '2')
		.style('fill', RED);
		
	g.selectAll('.hull')
		.data(hull)
		.enter()
			.append('circle')
			.attr('class', 'hull')
			.attr('cx', function(d) { return xline(d.x); })
			.attr('cy', function(d) { return yline(d.y); })
			.attr('r', 5)
			.attr('fill', YELLOW );
			
	// draw fixations
	g.append('path')
		.attr('d', function(d)  { return line(points); })
		.style('stroke', 'white')
		.style('stroke-width', '1')
		.style('fill', 'none');
		
	g.selectAll('.fix')
		.data(points)
		.enter()
			.append('circle')
			.attr('class', 'fix')
			.attr('cx', function(d) { return xline(d.x); })
			.attr('cy', function(d) { return yline(d.y); })
			.attr('r', 3)
			.attr('fill', 'white')
			.attr('opacity', 0.5);
}


function showPlotLegend() {

	var p = d3.select(".measGraphFooter");
	
	var width = p.node().getBoundingClientRect().width;
	var height = p.node().getBoundingClientRect().height;
	
	console.log(height);
	
	var svg = d3.select('#hullGraphLegend')
		.attr('width', width)
		.attr('height', height);
		
	var stdFix = svg.append('g')
		.attr('transform', 'translate(' + (width * 0.20) + ',' + (height * 0.25) + ')');
		
	var radius = 10
	stdFix.append('circle')
		.attr('fill', 'white')
		.attr('cy', -(radius/2))
		.attr('r', radius);
		
	var stdFixText = stdFix.append('text')
		.attr('text-anchor', 'middle')
		.style('font-size', '12px')
		.attr('fill', 'white')
		.text('Fixation');
	
	stdFixText.attr('dx', stdFixText.node().getBBox().width/2 + (radius * 2));
		
	var hullFix = svg.append('g')
		.attr('transform', 'translate(' + (width * 0.60) + ',' + (height * 0.25) + ')');
		
	var radius = 10
	hullFix.append('circle')
		.attr('fill', RED)
		.attr('cy', -(radius/2))
		.attr('r', radius);
		
	var hullFixText = hullFix.append('text')
		.attr('text-anchor', 'middle')
		.style('font-size', '12px')
		.attr('fill', 'white')
		.text('Convex Hull Fixation');
	
	hullFixText.attr('dx', hullFixText.node().getBBox().width/2 + (radius * 2));



	var scanpathData = [ 
		{ x: width * 0.15, y:  height * 0.75 },
		{ x: width * 0.25, y: height * 0.75 }
	];
	
	var line = d3.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; });
	
	svg.append('path')
		.attr('d', function(d)  { return line(scanpathData); })
		.style('stroke', 'white')
		.style('stroke-width', '3')
		.style('fill', 'none');
		
	svg.append('text')
		.attr('transform', 'translate(' + (width * 0.28) + ',' + (height * 0.75) + ')')
		.attr('dy', 3)
		.style('font-size', '12px')
		.attr('fill', 'white')
		.text('Scanpath');	
		
		
	var scanpathData2 = [ 
		{ x: width * 0.55, y:  height * 0.75 },
		{ x: width * 0.65, y: height * 0.75 }
	];
	
	svg.append('path')
		.attr('d', function(d)  { return line(scanpathData2); })
		.style('stroke', YELLOW)
		.style('stroke-width', '3')
		.style('fill', 'none');
		
	svg.append('text')
		.attr('transform', 'translate(' + (width * 0.68) + ',' + (height * 0.75) + ')')
		.attr('dy', 3)
		.style('font-size', '12px')
		.attr('fill', 'white')
		.text('Convex Hull Boundary');	
}


// line graph
function appendLine(metric, yAxisTitle, data) {

	var parent = d3.select('#rBox');
	
	parent.selectAll('svg').remove();
	
	var svg = parent.append('svg')
		.attr('id', 'rawLine');
		
	// sizing
	var svgPadding = 40;
	var margin = { top: GRAPH_TITLE_FONT_SIZE + 12, bottom: 50, left: 50, right: 20 };
	var dimensions = { width: parent.node().getBoundingClientRect().width - (2 * svgPadding), height: 400 };
	var height = dimensions.height;
	var width = dimensions.width;
	var graphHeight = height - margin.top - margin.bottom;
	var graphWidth = width - margin.left - margin.right;
	
	// scales and generators
	var times = data.map(function(s) { return +s.t; });
	var timeExtent = d3.extent(times);
	var minTime = timeExtent[0];
	var adjustedTimes = times.map(function(t) { return (t - minTime) / 1000000; });
	
	var x = d3.scaleLinear()
		.domain(d3.extent(adjustedTimes))
		.rangeRound([0, graphWidth]);

	var values = data.map(function(s) { return s.v; })
	var valueExtent = d3.extent(values);
	
	var y = d3.scaleLinear()
		.domain([0, valueExtent[1]])
		.range([graphHeight, 0]);
		
	var xaxis = d3.axisBottom(x)
			.tickValues(formattedTickValues(d3.extent(adjustedTimes)))
			.tickPadding(6);
			
	var yaxis = d3.axisLeft(y)
		.tickSizeInner(-graphWidth)
		.tickSizeOuter(3)
		.tickPadding(8);
		
	// appends 
	
	svg
		.attr('width', width)
		.attr('height', height)
		.style('margin-left', svgPadding);

	appendTitle(svg, margin, dimensions, metric + " Values")
	appendYAxis(svg, yaxis, margin, dimensions, yAxisTitle);
	appendXAxis(svg, xaxis, margin, dimensions, 'Time (s)');
	
	var g = svg.append('g')
		.attr('width', graphWidth)
		.attr('height', graphHeight)
		.attr('transform', translate(margin.left, margin.top));
		
	var line = d3.line()
		.x(function(d) { return x((d[0] - minTime)/1000000); })
		.y(function(d) { return y(d[1]); })
		.curve(d3.curveCatmullRom);
		
	var points = data.map(function(d) {
		return [ parseInt(d.t), d.v ];
	}).sort(function(a,b) {
		return a[0] - b[0];
	});
	
	g.append('path')
		.attr('d', function(d)  { return line(points); })
		.style('stroke', YELLOW)
		.style('stroke-width', '2')
		.style('fill', 'none');
}


// utility
function translate(x, y) {
	return 'translate(' + x + ',' + y + ')';
}


function formattedTickValues(extent, tickCount = 10.0) {

	var min = parseFloat(extent[0]);
	var max = parseFloat(extent[1]);
	
	var ticks = [];
	
	var tickSize = (max - min) / parseFloat(tickCount);
	for (var i = min; i <= max; i += tickSize) {
		ticks.push(i);
	}

	return ticks;
}


function formatCell(value, units = '') {
	if (isNaN(value)) {
		return value.replace(/[A-Z]/g, ' $&').trim();
	}
	else {
		 return d3.format(',.2f')(value);
	}
}


function appendTitle(svg, margin, dimensions, text) {

	var centerX = margin.left + (0.5 * (dimensions.width - margin.left - margin.right));
	
	svg.append('text')
		.attr('transform', translate(centerX, GRAPH_TITLE_FONT_SIZE))
		.attr('font-size', GRAPH_TITLE_FONT_SIZE + 'px')
		.attr('fill', 'white')
		.attr('text-anchor', 'middle')
		.text(text);
}


function appendXAxis(svg, axis, margin, dimensions, label) {

	svg.append('g')
		.attr('class', 'axis axis--x')
		.attr('transform', translate(margin.left, dimensions.height - margin.bottom))
		.attr('stroke', 'white')
		.call(axis);
	
	var labelX = margin.left + (0.5 * (dimensions.width - margin.left - margin.right));
	var labelY = dimensions.height - GRAPH_LABEL_FONT_SIZE;
	
	svg.append('text')
		.attr('transform', translate(labelX, labelY))
		.style('text-anchor', 'middle')
		.style('font-size', GRAPH_LABEL_FONT_SIZE + 'px')
		.style('fill', 'white')
		.text(label);
}


function appendYAxis(svg, axis, margin, dimensions, label) {

	svg.append('g')
		.attr('class', 'axis axis--y')
		.attr('transform', translate(margin.left, margin.top))
		.attr('stroke', 'white')
		.call(axis);
		
	var labelX = margin.top + (0.5 * (dimensions.height - margin.top - margin.bottom));
	
	svg.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', GRAPH_LABEL_FONT_SIZE)
		.attr('x', -labelX)
		.attr('text-anchor', 'middle')
		.style('font-size', GRAPH_LABEL_FONT_SIZE + 'px')
		.style('fill', 'white')
		.text(label);
}


function getGraphDimensions() {
	var height = d3.select('.measText').node().getBoundingClientRect().height;
	var width = d3.select('.measGraph').node().getBoundingClientRect().width - 20;
	
	return { height: height, width: width}
}


function click(elem) {
	elem.dispatchEvent(new MouseEvent('click'));
}


function formatUnits(units, metric) {
	switch(units) {
		case 'degrees':
			return '&#176;'
		default:
			switch(metric) {
				case VARIANCE:
					return units + '<sup>2</sup>';
				default:
					return units;
			}		
	}
}
				
	