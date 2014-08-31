(function(angular) {
    var ngDashboard = angular.module('ngDashboard', []);
    /**
     * @ngdoc service
     * @name ngDashboard.service.invokeIfDefined
     * @description
     * Function that invokes a function on the target with the value of the source property if it is defined on the source.
     *
     * @param source {Object} Object to read the property that is used as parameter for the function call at the target property.
     * @param target {Object} Object that has a function named as the property argument that is invoked.
     * @param property {String} Property that is checked on existence at the source object. Also the name of the function in the target object.
     */
    ngDashboard.factory('invokeIfDefined', function() {
        return function(source, target, property) {
            if (angular.isDefined(source[property])) {
                target[property](source[property]);
            }
        };
    });
})(angular);
(function(angular, crossfilter) {
    var ngDasbhoard = angular.module('ngDashboard');

    ngDasbhoard.provider('widgetGroupLayout', [

        function() {

            var layoutManagers = {};

            this.registerLayoutManager = function(name, layoutManager) {
                layoutManagers[name] = layoutManager;
            };

            this.$get = ['$injector',

                function($inject) {
                    angular.forEach(layoutManagers, function(layoutManager) {
                        if (layoutManager.initialize) {
                            $inject.invoke(layoutManager.initialize, layoutManager);
                        }
                    });

                    return {
                        handleLayout: function(widgetGroupElement, groupData) {
                            var layout = (groupData.layout && groupData.layout.type) ? groupData.layout.type : 'flow';

                            if (!layoutManagers[layout]) {
                                throw 'No LayoutManager ' + layout + ' registered';
                            }

                            layoutManagers[layout].layout(widgetGroupElement, groupData);
                        }
                    };
                }
            ];
        }
    ]);

    ngDasbhoard.directive('widgetGroup', ['widgetGroupLayout',

        function(widgetGroupLayout) {

            return {
                restrict: 'E',
                scope: {
                    groupData: '=groupData'
                },
                controller: ['$scope', '$http',
                    function($scope, $http) {
                        var initializers = [],
                            initialized = false;

                        this.registerWidgetInitializer = function(initializer) {
                            if (initialized) {
                                initializer($scope.crossFilter);
                            } else {
                                initializers.push(initializer);
                            }
                        };

                        function initializeWidgets() {
                            initialized = true;

                            for (var i in initializers) {
                                initializers[i]($scope.crossFilter);
                            }

                            initializers.length = 0;
                        }


                        if (angular.isArray($scope.groupData.data)) {
                            $scope.crossFilter = crossfilter($scope.groupData.data);
                            initializeWidgets();
                        } else if (angular.isString($scope.groupData.dataUrl)) {
                            $http({
                                method: 'GET',
                                url: $scope.groupData.dataUrl
                            })
                                .success(function(data) {
                                    $scope.crossFilter = crossfilter(data);
                                    initializeWidgets();
                                })
                                .error(function(error) {
                                    throw error;
                                });
                        } else {
                            initializeWidgets();
                        }
                    }
                ],
                link: function(scope, element) {
                    element.addClass('widget-group');

                    //call the layoutManager
                    var groupDataWatch = scope.$watch('groupData', function(groupData) {
                        if (groupData) {
                            widgetGroupLayout.handleLayout(element, groupData);

                            groupDataWatch();
                        }
                    });
                },
                template: '<h3 ng-if="groupData.title">{{groupData.title}}</h3>'
            };
        }
    ]);
})(angular, crossfilter);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    function WidgetFactory(widgetProviders) {
        this.widgetProviders = widgetProviders;
    }

    /**
     * @param {Object} widgetData {
     *  dimension: crossfilter.dimension,
     *  group: dimension.group,
     *  rawData: {...} //The raw widget data specified by the application
     * }
     */
    WidgetFactory.prototype.createWidget = function(element, type, widgetData) {
        if (!this.widgetProviders[type]) {
            throw 'No widget with ' + type + ' registered';
        }

        return this.widgetProviders[type].createWidget(element, widgetData);
    };

    ngDashboard.provider('widgetFactory', [

        function() {
            var widgetProviders = {};
            var mixins = {};

            this.registerWidgetProvider = function(name, provider) {
                widgetProviders[name] = provider;
            };

            this.registerChartMixin = function(name, mixin) {
                mixins[name] = mixin;
            };

            this.$get = ['$injector',

                function($injector) {
                    angular.forEach(mixins, function(mixin) {
                        if (mixin.initialize) {
                            $injector.invoke(mixin.initialize, mixin);
                        }
                    });

                    angular.forEach(widgetProviders, function(widgetProvider) {
                        if (widgetProvider.initialize) {
                            $injector.invoke(widgetProvider.initialize, widgetProvider, mixins);
                        }
                    });

                    return new WidgetFactory(widgetProviders);
                }
            ];
        }
    ]);


    ngDashboard.directive('widget', ['widgetFactory',

        function(widgetFactory) {

            return {
                restrict: 'E',
                scope: {
                    widgetData: '=widgetData',
                    crossFilter: '=crossFilter'
                },
                require: '^widgetGroup',
                link: function(scope, element, attrs, widgetGroupCtrl) {
                    var widget, overlays;
                    element.addClass('widget');

                    widgetGroupCtrl.registerWidgetInitializer(function(crossFilter) {
                        var widgetBody = element.find('widget-body');

                        widget = createWidget(widgetBody, scope.widgetData, crossFilter, widgetFactory);

                        if (scope.widgetData.overlays) {
                            overlays = [];

                            for (var i in scope.widgetData.overlays) {
                                var overlayWidget = createWidget(widgetBody,
                                    scope.widgetData.overlays[i],
                                    crossFilter,
                                    widgetFactory);

                                overlays.push(overlayWidget);
                            }
                        }
                    });
                },
                templateUrl: './template/widget.html'
            };
        }
    ]);

    function createWidget(element, widgetData, crossFilter, widgetFactory) {
        return widgetFactory.createWidget(element, widgetData.type, {
            crossfilter: crossFilter,
            rawData: widgetData
        });
    }
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');
    var expressionRegex = /^([^\(]*)\(([^\)]*)\).*$/;

    ngDashboard.factory('widgetExpressionParser', ['$parse',

        function($parse) {
            return {
                /**
                 * @ngdoc method
                 * @name ngDashboard.service.widgetExpressionParser#parse
                 * @methodOf ngDashboard.service.widgetExpressionParser
                 * @description parses the expression and returns the function and parameters
                 *
                 * @return {Object} {
                 *  functionName: 'functionname',
                 *  parameters: <angular expression object>
                 * }
                 */
                parse: function(expression) {
                    var exParts = expressionRegex.exec(expression);
                    var functionName = exParts[1];
                    var functionParams = $parse(exParts[2]);

                    return {
                        functionName: functionName,
                        parameters: functionParams
                    };
                },
                valueFunction: function(expression, contextName) {
                    var getter = $parse(expression);
                    var contextProperty = contextName ? contextName : 'd';

                    function value(d) {
                        var context = {};
                        context[contextProperty] = d;

                        var val = getter(context);

                        return val;
                    }

                    return value;
                }
            };
        }
    ]);
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.provider('scaleParser', [

        function() {
            var scaleProviders = {};

            this.registerScaleProvider = function(name, provider) {
                scaleProviders[name] = provider;
            };

            this.$get = ['$injector',

                function($injector) {

                    angular.forEach(scaleProviders, function(provider) {
                        if (provider.initialize) {
                            $injector.invoke(provider.initialize, provider);
                        }
                    });

                    return new ScaleParser(scaleProviders);
                }
            ];
        }
    ]);

    function ScaleParser(scaleProviders) {
        this.scaleProviders = scaleProviders;
    }

    ScaleParser.prototype.parse = function(scaleData) {
        if (!this.scaleProviders[scaleData.type]) {
            throw 'No scaleprovider ' + scaleData.type + ' registered';
        }

        return this.scaleProviders[scaleData.type].createScale(scaleData.parameters);
    };
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.provider('crossfilterUtils', [

        function() {
            var groupFunctionProviders = {};

            this.addGroupFunctionProvider = function(functionName, provider) {
                groupFunctionProviders[functionName] = provider;
            };


            this.$get = ['widgetExpressionParser', '$injector',
                function(widgetExpressionParser, $injector) {

                    angular.forEach(groupFunctionProviders, function(provider) {
                        if (provider.initialize) {
                            $injector.invoke(provider.initialize, provider);
                        }
                    });


                    return {
                        dimensionFunction: function(expression) {
                            if (!expression) {
                                throw 'Expression is required to create crossfilter dimension';
                            }

                            return widgetExpressionParser.valueFunction(expression);
                        },
                        groupFunctions: function(groupData) {
                            if (!groupData) {
                                throw 'Expression is required to create crossfilter group';
                            }

                            if (!groupFunctionProviders[groupData.functionName]) {
                                throw 'No groupfunction provider for ' + groupData.functionName + ' registered';
                            }

                            return groupFunctionProviders[groupData.functionName].buildGroup(groupData.parameters, groupData.debug);
                        }
                    };
                }
            ];
        }
    ]);
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerWidgetProvider('barchart', new BarChartProvider());
        }
    ]);

    function BarChartProvider() {}

    BarChartProvider.prototype.initialize = ['baseChartMixin', 'coordinateGridMixin', 'marginMixin', 'stackMixin', 'invokeIfDefined', 'colorMixin',
        function(baseChartMixin, coordinateGridMixin, marginMixin, stackMixin, invokeIfDefined, colorMixin) {
            this.baseChartMixin = baseChartMixin;
            this.coordinateGridMixin = coordinateGridMixin;
            this.invokeIfDefined = invokeIfDefined;
            this.marginMixin = marginMixin;
            this.stackMixin = stackMixin;
            this.colorMixin = colorMixin;
        }
    ];

    BarChartProvider.prototype.createWidget = function(element, widgetData) {
        var barChart = dc.barChart(element[0]);
        var invoke = this.invokeIfDefined;
        var raw = widgetData.rawData;

        this.baseChartMixin.configureChart(barChart, widgetData);
        this.stackMixin.configureChart(barChart, widgetData);
        this.coordinateGridMixin.configureChart(barChart, widgetData);
        this.marginMixin.configureChart(barChart, widgetData);
        this.colorMixin.configureChart(barChart, widgetData);

        invoke(raw, barChart, 'outerPadding');
        invoke(raw, barChart, 'gap');

        barChart.render();

        return barChart;
    };
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerWidgetProvider('boxPlot', new BoxPlotProvider());
        }
    ]);

    function BoxPlotProvider() {}

    BoxPlotProvider.prototype.initialize = ['baseChartMixin', 'coordinateGridMixin', 'marginMixin', 'colorMixin',
        function(baseChartMixin, coordinateGridMixin, marginMixin, colorMixin) {
            this.baseChartMixin = baseChartMixin;
            this.coordinateGridMixin = coordinateGridMixin;
            this.marginMixin = marginMixin;
            this.colorMixin = colorMixin;
        }
    ];

    BoxPlotProvider.prototype.createWidget = function(element, widgetData) {
        var chart = dc.boxPlot(element[0]);

        this.baseChartMixin.configureChart(chart, widgetData);
        this.coordinateGridMixin.configureChart(chart, widgetData);
        this.marginMixin.configureChart(chart, widgetData);
        this.colorMixin.configureChart(chart, widgetData);

        chart.render();

        return chart;
    };
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerWidgetProvider('heatmap', new HeatmapProvider());
        }
    ]);

    function HeatmapProvider() {}

    HeatmapProvider.prototype.initialize = ['baseChartMixin', 'coordinateGridMixin', 'marginMixin', 'colorMixin', 'invokeIfDefined',
        function(baseChartMixin, coordinateGridMixin, marginMixin, colorMixin, invokeIfDefined) {
            this.baseChartMixin = baseChartMixin;
            this.coordinateGridMixin = coordinateGridMixin;
            this.invokeIfDefined = invokeIfDefined;
            this.marginMixin = marginMixin;
            this.colorMixin = colorMixin;
        }
    ];

    HeatmapProvider.prototype.createWidget = function(element, widgetData) {
        var chart = dc.heatMap(element[0]);

        this.baseChartMixin.configureChart(chart, widgetData);
        this.coordinateGridMixin.configureChart(chart, widgetData);
        this.marginMixin.configureChart(chart, widgetData);
        this.colorMixin.configureChart(chart, widgetData);

        chart.render();

        return chart;
    };
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerWidgetProvider('linechart', new LineChartProvider());
        }
    ]);

    function LineChartProvider() {}

    LineChartProvider.prototype.initialize = ['baseChartMixin', 'coordinateGridMixin', 'marginMixin', 'stackMixin', 'invokeIfDefined', 'colorMixin',
        function(baseChartMixin, coordinateGridMixin, marginMixin, stackMixin, invokeIfDefined, colorMixin) {
            this.baseChartMixin = baseChartMixin;
            this.coordinateGridMixin = coordinateGridMixin;
            this.invokeIfDefined = invokeIfDefined;
            this.marginMixin = marginMixin;
            this.stackMixin = stackMixin;
            this.colorMixin = colorMixin;
        }
    ];

    LineChartProvider.prototype.createWidget = function(element, widgetData) {
        var lineChart = dc.lineChart(element[0]);

        this.baseChartMixin.configureChart(lineChart, widgetData);
        this.stackMixin.configureChart(lineChart, widgetData);
        this.coordinateGridMixin.configureChart(lineChart, widgetData);
        this.marginMixin.configureChart(lineChart, widgetData);
        this.colorMixin.configureChart(lineChart, widgetData);

        this.invokeIfDefined(widgetData.rawData, lineChart, 'renderArea');
        this.invokeIfDefined(widgetData.rawData, lineChart, 'renderDataPoints');
        this.invokeIfDefined(widgetData.rawData, lineChart, 'interpolate');

        lineChart.render();

        return lineChart;
    };
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerWidgetProvider('piechart', new PieChartProvider());
        }
    ]);

    function PieChartProvider() {}

    PieChartProvider.prototype.initialize = ['baseChartMixin', 'invokeIfDefined', 'colorMixin',
        function(baseChartMixin, invokeIfDefined, colorMixin) {
            this.baseChartMixin = baseChartMixin;
            this.invokeIfDefined = invokeIfDefined;
            this.colorMixin = colorMixin;
        }
    ];

    PieChartProvider.prototype.createWidget = function(element, widgetData) {
        var chart = dc.pieChart(element[0]);
        var invoke = this.invokeIfDefined;
        var raw = widgetData.rawData;

        this.baseChartMixin.configureChart(chart, widgetData);
        this.colorMixin.configureChart(chart, widgetData);

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
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['scaleParserProvider',
        function(scaleParserProvider) {
            scaleParserProvider.registerScaleProvider('linear', new LinearScaleProvider());
        }
    ]);

    function LinearScaleProvider() {}

    LinearScaleProvider.prototype.initialize = ['invokeIfDefined',
        function(invokeIfDefined) {
            this.invokeIfDefined = invokeIfDefined;
        }
    ];

    LinearScaleProvider.prototype.createScale = function(scaleParams) {
        var scale = d3.scale.linear();
        var invoke = this.invokeIfDefined;

        if (scaleParams) {
            invoke(scaleParams, scale, 'domain');
            invoke(scaleParams, scale, 'range');
            invoke(scaleParams, scale, 'rangeRound');
            invoke(scaleParams, scale, 'clamp');
            invoke(scaleParams, scale, 'ticks');
        }

        return scale;
    };
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerChartMixin('baseChartMixin', new BaseChartMixin());
        }
    ]);

    function BaseChartMixin() {}

    BaseChartMixin.prototype.initialize = ['invokeIfDefined', 'widgetExpressionParser', 'crossfilterUtils',
        function(invokeIfDefined, widgetExpressionParser, crossfilterUtils) {
            this.invokeIfDefined = invokeIfDefined;
            this.widgetExpressionParser = widgetExpressionParser;
            this.crossfilterUtils = crossfilterUtils;
        }
    ];

    BaseChartMixin.prototype.configureChart = function(chart, widgetData) {
        var raw = widgetData.rawData;
        var invoke = this.invokeIfDefined;
        var dimension = this.buildDimension(widgetData);
        var group = this.buildGroup(dimension, widgetData);


        chart.dimension(dimension);
        if (raw.group.name) {
            chart.group(group, raw.group.name);
        } else {
            chart.group(group);
        }

        invoke(raw, chart, 'width');
        invoke(raw, chart, 'minWidth');
        invoke(raw, chart, 'height');
        invoke(raw, chart, 'minHeight');
        invoke(raw, chart, 'transitionDuration');
        invoke(raw, chart, 'renderLabel');
        invoke(raw, chart, 'renderTitle');

        if (raw.data) {
            chart.data(this.widgetExpressionParser.valueFunction(raw.data, 'group'));
        }

        if (raw.keyAccessor) {
            chart.keyAccessor(this.widgetExpressionParser.valueFunction(raw.keyAccessor));
        }

        if (raw.valueAccessor) {
            chart.valueAccessor(this.widgetExpressionParser.valueFunction(raw.valueAccessor));
        }

        if (raw.titleAccessor) {
            chart.title(this.widgetExpressionParser.valueFunction(raw.titleAccessor));
        }

        if (raw.labelAccessor) {
            chart.label(this.widgetExpressionParser.valueFunction(raw.labelAccessor));
        }

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

    BaseChartMixin.prototype.buildDimension = function(widgetData) {
        var crossfilter = widgetData.crossfilter;
        var dimensionFunction = this.crossfilterUtils.dimensionFunction(widgetData.rawData.dimension);

        return crossfilter.dimension(dimensionFunction);
    };

    BaseChartMixin.prototype.buildGroup = function(dimension, widgetData) {
        var grouping = this.crossfilterUtils.groupFunctions(widgetData.rawData.group);
        return dimension.group().reduce(grouping.add, grouping.remove, grouping.init);
    };
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerChartMixin('colorMixin', new ColorMixin());
        }
    ]);

    function ColorMixin() {}

    ColorMixin.prototype.initialize = ['invokeIfDefined', '$parse', 'scaleParser',
        function(invokeIfDefined, $parse, scaleParser) {
            this.invokeIfDefined = invokeIfDefined;
            this.$parse = $parse;
            this.scaleParser = scaleParser;
        }
    ];

    ColorMixin.prototype.configureChart = function(chart, widgetData) {
        var raw = widgetData.rawData;
        var invoke = this.invokeIfDefined;

        invoke(raw, chart, 'colorDomain');
        invoke(raw, chart, 'linearColors');
        invoke(raw, chart, 'ordinalColors');

        if (raw.colors) {
            chart.colors(this.scaleParser.parse(raw.colors));
        }

        if (raw.colorAccessor) {
            chart.colorAccessor(colorAccessor(this.$parse(raw.colorAccessor)));
        }


        if (raw.calculateColorDomain) {
            chart.calculateColorDomain();
        }
    };

    function colorAccessor(parsedExpression) {
        function cAccessor(d, i) {
            return parsedExpression({
                d: d,
                i: i
            });
        }

        return cAccessor;
    }
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerChartMixin('coordinateGridMixin', new CoordinateGridMixin());
        }
    ]);

    function CoordinateGridMixin() {}

    CoordinateGridMixin.prototype.initialize = ['scaleParser', 'invokeIfDefined', 'unitsParser',
        function(scaleParser, invokeIfDefined, unitsParser) {
            this.scaleParser = scaleParser;
            this.invokeIfDefined = invokeIfDefined;
            this.unitsParser = unitsParser;
        }
    ];

    CoordinateGridMixin.prototype.configureChart = function(chart, widgetData) {
        var invoke = this.invokeIfDefined;
        var raw = widgetData.rawData;

        if (raw.x) {
            chart.x(this.scaleParser.parse(raw.x));
        }

        invoke(raw, chart, 'yAxisPadding');
        invoke(raw, chart, 'yAxisLabel');
        invoke(raw, chart, 'brushOn');
        invoke(raw, chart, 'elasticX');
        invoke(raw, chart, 'elasticY');
        invoke(raw, chart, 'mouseZoomable');
        invoke(raw, chart, 'renderHorizontalGridLines');
        invoke(raw, chart, 'renderVerticalGridLines');

        if (raw.xUnits) {
            chart.xUnits(this.unitsParser.parse(raw.xUnits));
        }

        if (raw.xAxis) {
            this.configureAxis(chart.xAxis(), raw.xAxis);
        }

        if (raw.yAxis) {
            this.configureAxis(chart.yAxis(), raw.yAxis);
        }
    };

    CoordinateGridMixin.prototype.configureAxis = function(axis, axisData) {
        var invoke = this.invokeIfDefined;

        invoke(axisData, axis, 'orient');
        invoke(axisData, axis, 'ticks');
        invoke(axisData, axis, 'tickValues');
        invoke(axisData, axis, 'tickSize');
        invoke(axisData, axis, 'innerTickSize');
        invoke(axisData, axis, 'outerTickSize');
        invoke(axisData, axis, 'tickPadding');

        if (axisData.tickFormat) {
            axis.tickFormat(d3.format(axisData.tickFormat));
        }
    };
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerChartMixin('marginMixin', new MarginMixin());
        }
    ]);

    function MarginMixin() {}

    MarginMixin.prototype.initialize = ['invokeIfDefined',
        function(invokeIfDefined) {
            this.invokeIfDefined = invokeIfDefined;
        }
    ];

    MarginMixin.prototype.configureChart = function(chart, widgetData) {
        this.invokeIfDefined(widgetData.rawData, chart, 'margins');
    };
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['crossfilterUtilsProvider',
        function(crossfilterUtilsProvider) {

            crossfilterUtilsProvider.addGroupFunctionProvider('array', new ArrayGroupProvider());
        }
    ]);

    function ArrayGroupProvider() {}

    ArrayGroupProvider.prototype.initialize = ['$parse',
        function($parse) {
            this.$parse = $parse;
        }
    ];

    ArrayGroupProvider.prototype.buildGroup = function(groupParams) {
        if (!groupParams) {
            throw 'sum needs a groupParam';
        }

        return arrayGroupBuilder(this.$parse(groupParams.value));
    };

    function arrayGroupBuilder(getter) {
        var arrayGroup = {
            init: function() {
                return [];
            },
            add: function(p, v) {
                var val = getter({
                    v: v
                });

                p.push(val);

                return p;
            },
            remove: function(p, v) {
                var val = getter({
                    v: v
                });

                p.splice(p.indexOf(val), 1);

                return p;
            }
        };

        return arrayGroup;
    }
})(angular);
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['crossfilterUtilsProvider',
        function(crossfilterUtilsProvider) {

            crossfilterUtilsProvider.addGroupFunctionProvider('sum', new SumGroupProvider());
        }
    ]);

    function SumGroupProvider() {}

    SumGroupProvider.prototype.initialize = ['$parse',
        function($parse) {
            this.$parse = $parse;
        }
    ];

    SumGroupProvider.prototype.buildGroup = function(groupParams) {
        if (!groupParams) {
            throw 'sum needs a groupParam';
        }

        return sumGroupBuilder(this.$parse(groupParams.value));
    };

    function sumGroupBuilder(valuGetter) {
        var sumGroup = {
            init: function() {
                return 0;
            },
            add: function(p, v) {
                var val = valuGetter({
                    v: v
                });

                return p + val;
            },
            remove: function(p, v) {
                var val = valuGetter({
                    v: v
                });

                return p - val;
            }
        };


        return sumGroup;

    }
})(angular);
