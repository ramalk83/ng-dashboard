(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerChartMixin('baseChartMixin', new BaseChartMixin());
        }
    ]);

    function BaseChartMixin() {}

    BaseChartMixin.prototype.initialize = ['invokeIfDefined', '$parse',
        function(invokeIfDefined, $parse) {
            this.invokeIfDefined = invokeIfDefined;
            this.$parse = $parse;
        }
    ];

    BaseChartMixin.prototype.configureChart = function(chart, widgetData) {
        var raw = widgetData.rawData;
        var invoke = this.invokeIfDefined;

        chart.dimension(widgetData.dimension)
            .group(widgetData.group);

        invoke(raw, chart, 'width');
        invoke(raw, chart, 'minWidth');
        invoke(raw, chart, 'height');
        invoke(raw, chart, 'minHeight');
        invoke(raw, chart, 'transitionDuration');

        this.setupLegend(chart, raw.legend);
    };

    BaseChartMixin.prototype.setupLegend = function(chart, legendData) {
        if (!legendData) {
            return;
        }

        var invoke = this.invokeIfDefined;
        var legend = dc.legend();

        invoke(legendData, legend, 'x');
        invoke(legendData, legend, 'y');
        invoke(legendData, legend, 'gap');
        invoke(legendData, legend, 'itemHeight');
        invoke(legendData, legend, 'horizontal');
        invoke(legendData, legend, 'legendWidth');
        invoke(legendData, legend, 'itemWidth');

        chart.legend(legend);
    };
})(angular);