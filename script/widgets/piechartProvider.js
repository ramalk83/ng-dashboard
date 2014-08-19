(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerWidgetProvider('piechart', new PieChartProvider());
        }
    ]);

    function PieChartProvider() {};

    PieChartProvider.prototype.initialize = ['baseChartMixin', 'invokeIfDefined',
        function(baseChartMixin, invokeIfDefined) {
            this.baseChartMixin = baseChartMixin;
            this.invokeIfDefined = invokeIfDefined;
        }
    ];

    PieChartProvider.prototype.createWidget = function(element, widgetData) {
        var chart = dc.pieChart(element[0]);
        var invoke = this.invokeIfDefined;
        var raw = widgetData.rawData;

        this.baseChartMixin.configureChart(chart, widgetData);

        invoke(raw, chart, 'slicesCap');
        invoke(raw, chart, 'innerRadius');
        invoke(raw, chart, 'radius');
        invoke(raw, chart, 'cx');
        invoke(raw, chart, 'cy');
        invoke(raw, chart, 'minAngleForLabel');

        chart.render();

        return chart;
    };
})(angular);