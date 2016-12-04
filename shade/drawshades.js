google.charts.load('43', {
  callback: function () {
    document.getElementById('range-draw').addEventListener('click', loadBellCurve, false);
    loadBellCurve();
  },
  packages:['controls', 'corechart']
});

function loadBellCurve() {
  // build data sample
  var rangeMin = parseInt(document.getElementById('range-min').value);
  var rangeMax = parseInt(document.getElementById('range-max').value);
  var step = 0.05;

  var dataChart = new google.visualization.DataTable({
    cols: [
      {label: 'Sample', type: 'string'},
      {label: 'Value', type: 'number'},
      {label: 'Var', type: 'number'},
      {label: 'X', type: 'number'},
      {label: 'Y', type: 'number'}
    ]
  });
  for (var i = rangeMin; i <= rangeMax; i=i+step) {
    dataChart.addRow([i.toString(), i, null, null, null]);
  }

  // find sample mean
  var dataMean = google.visualization.data.group(
    dataChart,
    [{column: 0, type: 'string', modifier: function () {return '';}}],
    [{column: 1, type: 'number', aggregation: google.visualization.data.avg}]
  );
  var sampleMean = dataMean.getValue(0, 1);

  // find sample standard deviation
  for (var i = 0; i < dataChart.getNumberOfRows(); i++) {
    dataChart.setValue(i, 2, Math.pow(dataChart.getValue(i, 1) - sampleMean, 2));
  }
  var dataVar = google.visualization.data.group(
    dataChart,
    [{column: 0, type: 'string', modifier: function () {return '';}}],
    [{column: 2, type: 'number', aggregation: google.visualization.data.avg}]
  );
  var sampleStdDev = Math.sqrt(dataVar.getValue(0, 1));

  // set standard deviation ranges 1-3
  var sampleRange = [];
  sampleRange.push([
    sampleMean - sampleStdDev,
    sampleMean + sampleStdDev
  ]);
  sampleRange.push([
    sampleMean - (sampleStdDev * 2),
    sampleMean + (sampleStdDev * 2)
  ]);
  sampleRange.push([
    sampleMean - (sampleStdDev * 3),
    sampleMean + (sampleStdDev * 3)
  ]);

  // set X/Y coordinates
  for (var i = 0; i < dataChart.getNumberOfRows(); i++) {
    dataChart.setValue(i, 3, dataChart.getValue(i, 1) * sampleStdDev + sampleMean);
    dataChart.setValue(i, 4, getNormalDistribution(dataChart.getValue(i, 1) * sampleStdDev + sampleMean, sampleMean, sampleStdDev));
  }

  // fill-in standard deviation areas
  var stdDevCols = {};
  stdDevCols['1_SD'] = dataChart.addColumn({label: '1 Std Dev', type: 'number'});
  stdDevCols['2_SD'] = dataChart.addColumn({label: '2 Std Dev', type: 'number'});
  stdDevCols['3_SD'] = dataChart.addColumn({label: '3 Std Dev', type: 'number'});
  for (var i = Math.floor(sampleRange[2][0]); i <= Math.ceil(sampleRange[2][1]); i=i+0.05) {
    var rowIndex = dataChart.addRow();
    dataChart.setValue(rowIndex, 3, i);
    if (((i) >= sampleRange[0][0]) && ((i) < sampleRange[0][1])) {
      dataChart.setValue(rowIndex, stdDevCols['1_SD'], getNormalDistribution(i, sampleMean, sampleStdDev));
    } else if (((i) >= sampleRange[1][0]) && ((i) < sampleRange[1][1])) {
      dataChart.setValue(rowIndex, stdDevCols['2_SD'], getNormalDistribution(i, sampleMean, sampleStdDev));
    } else {
      dataChart.setValue(rowIndex, stdDevCols['3_SD'], getNormalDistribution(i, sampleMean, sampleStdDev));
    }
  }

  // add vertical lines for mean and standard deviations
  addVerticalLine('MEAN', sampleMean);
  addVerticalLine('< 1 SD', sampleRange[0][0]);
  addVerticalLine('> 1 SD', sampleRange[0][1]);
  addVerticalLine('< 2 SD', sampleRange[1][0]);
  addVerticalLine('> 2 SD', sampleRange[1][1]);

  // series options
  var markersArea = {
    enableInteractivity: false,
    pointsVisible: false,
    tooltip: false,
    type: 'area'
  };
  var markersLine = {
    enableInteractivity: false,
    lineWidth: 3,
    pointsVisible: false,
    tooltip: false,
    type: 'line',
    visibleInLegend: false
  };

  // combo chart
  var chartCombo = new google.visualization.ChartWrapper({
    chartType: 'ComboChart',
    containerId: 'chart-combo',
    options: {
      animation: {
        duration: 1000,
        easing: 'linear',
        startup: true
      },
      colors: ['#1565C0', '#43A047', '#FFB300', '#E53935', '#43A047', '#FFB300', '#FFB300', '#E53935', '#E53935'],
      explorer: { actions: ['dragToZoom', 'rightClickToReset'] },
      hAxis: {
        format: '#,##0'
      },
      height: 340,
      legend: {
        textStyle: {
          color: '#676767',
          fontSize: 10
        }
      },
      series: {
        0: {
          pointShape: {
            type: 'star',
            sides: 4,
            dent: 0.3
          },
          pointSize: 12,
          pointsVisible: true,
          type: 'scatter'
        },
        1: markersArea,
        2: markersArea,
        3: markersArea,
        4: markersLine,
        5: markersLine,
        6: markersLine,
        7: markersLine,
        8: markersLine
      },
      seriesType: 'scatter',
      theme: 'maximized',
      title: 'Normal Distribution',
      titleTextStyle: {
        color: '#676767',
        bold: false,
        fontSize: 10
      },
      tooltip: {
        isHtml: true
      },
      vAxis: {
        format: '#,##0.0000'
      },
      width: 870
    }
  });

  // range filter
  var controlRangeFilter = new google.visualization.ControlWrapper({
    controlType: 'ChartRangeFilter',
    containerId: 'chart-control-range',
    options: {
      filterColumnIndex: 0,
      ui: {
        chartType: 'AreaChart',
        chartOptions: {
          annotations: {
            highContrast: false,
            stem: {
              color: 'transparent',
              length: 0
            },
            textStyle: {
              color: 'transparent'
            }
          },
          chartArea: {
            left: 0,
            width: 869
          },
          colors: ['#1565C0', '#43A047', '#FFB300', '#E53935', '#43A047', '#FFB300', '#FFB300', '#E53935', '#E53935'],
          height: 72,
          width: 870
        }
      }
    }
  });

  // chart data view
  var viewChart = new google.visualization.DataView(dataChart);
  viewChart.setColumns([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);

  // draw dashboard
  var dashboard = new google.visualization.Dashboard(document.getElementById('dashboard'));
  dashboard.bind(controlRangeFilter, chartCombo);
  dashboard.draw(viewChart);

  function getNormalDistribution(x, Mean, StdDev) {
    return Math.exp(-((x - Mean) * (x - Mean)) / (2 * StdDev * StdDev)) / (Math.sqrt(2 * Math.PI) * StdDev);
  }

  function addVerticalLine(colLabel, xVal) {
    var yCol = dataChart.addColumn({label: colLabel, type: 'number'});
    var annCol = dataChart.addColumn({role: 'annotation', type: 'string'});
    var rowIndex = dataChart.addRow();
    dataChart.setValue(rowIndex, 3, xVal);
    dataChart.setValue(rowIndex, yCol, getNormalDistribution(xVal, sampleMean, sampleStdDev));
    dataChart.setValue(rowIndex, annCol, xVal.toFixed(2) + ' %');
    rowIndex = dataChart.addRow();
    dataChart.setValue(rowIndex, 3, xVal);
    dataChart.setValue(rowIndex, yCol, 0);
  }
}
