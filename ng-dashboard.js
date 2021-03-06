/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
/**
 * Copyright 2014 Daniel Furtlehner
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.provider('crossfilterUtils', [

        function() {
            var groupFunctionProviders = {};

            this.addGroupFunctionProvider = function(type, provider) {
                groupFunctionProviders[type] = provider;
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

                            if (!groupFunctionProviders[groupData.type]) {
                                throw 'No groupfunction provider for ' + groupData.type + ' registered';
                            }

                            return groupFunctionProviders[groupData.type].buildGroup(groupData.parameters, groupData.debug);
                        },
                        getDistinctValuesFromDimension: function(dimension) {
                            if (!dimension) {
                                return [];
                            }

                            var group = dimension.group();
                            var allValues = group.all();
                            var valueArray = [];


                            if (allValues) {
                                for (var index in allValues) {
                                    valueArray.push(allValues[index].key);
                                }
                            }

                            group.dispose();

                            return valueArray;
                        }
                    };
                }
            ];
        }
    ]);
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.provider('widgetGroupFilter', function() {

        var filterProviders = {};

        this.registerWidgetGroupFilter = function(name, filterProvider) {
            filterProviders[name] = filterProvider;
        };

        this.$get = ['$injector',
            function($injector) {
                angular.forEach(filterProviders, function(provider) {
                    if (provider.initialize) {
                        $injector.invoke(provider.initialize, provider);
                    }
                });


                return {
                    buildFilter: function(element, filterData, crossfilter, widgetGroupName) {
                        if (!filterData.type) {
                            throw 'A Filtertype is required';
                        }

                        if (!filterProviders[filterData.type]) {
                            throw 'No widgetGroupFilterProvider ' + filterData.type + ' registered';
                        }

                        filterProviders[filterData.type].buildFilter(element, filterData, crossfilter, widgetGroupName);
                    }
                };
            }
        ];
    });

    ngDashboard.directive('filter', ['widgetGroupFilter',
        function(widgetGroupFilter) {

            return {
                restrict: 'E',
                scope: {
                    filterData: '=filterData',
                    crossfilter: '=crossfilter',
                    widgetGroupName: '=widgetGroupName'
                },
                link: function(scope, element) {
                    var filterWatch = scope.$watch('crossfilter', function(crossfilter) {
                        if (crossfilter) {
                            widgetGroupFilter.buildFilter(element, scope.filterData, crossfilter, scope.widgetGroupName);

                            filterWatch();
                        }
                    });
                }
            };
        }
    ]);


})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.provider('unitsParser', [

        function() {
            var unitProviders = {};

            this.registerUnitProvider = function(name, provider) {
                unitProviders[name] = provider;
            };

            this.$get = ['$injector',

                function($injector) {

                    angular.forEach(unitProviders, function(provider) {
                        if (provider.initialize) {
                            $injector.invoke(provider.initialize, provider);
                        }
                    });

                    return new UnitParser(unitProviders);
                }
            ];
        }
    ]);

    function UnitParser(unitProviders) {
        this.unitProviders = unitProviders;
    }

    UnitParser.prototype.parse = function(unitData) {
        if (!this.unitProviders[unitData.type]) {
            throw 'No scaleprovider ' + unitData.type + ' registered';
        }

        return this.unitProviders[unitData.type].createUnit(unitData.parameters);
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
                    widgetData: '=widgetData'
                },
                require: '^widgetGroup',
                link: function(scope, element, attrs, widgetGroupCtrl) {
                    var widget, overlays;
                    element.addClass('widget');

                    widgetGroupCtrl.registerWidgetInitializer(function(crossFilter, namedGroups, widgetGroupName, rawData) {
                        if (!widgetGroupName) {
                            throw 'widget-group name is required for charts';
                        }

                        var widgetBody = element.find('widget-body');

                        widget = createWidget(widgetBody, widgetFactory, {
                            crossfilter: crossFilter,
                            namedGroups: namedGroups,
                            rawData: scope.widgetData,
                            data: rawData,
                            widgetGroupName: widgetGroupName
                        });

                        if (scope.widgetData.overlays) {
                            overlays = [];

                            for (var i in scope.widgetData.overlays) {
                                var overlayWidget = createWidget(widgetBody, widgetFactory, {
                                    crossfilter: crossFilter,
                                    namedGroups: namedGroups,
                                    rawData: scope.widgetData.overlays[i],
                                    widgetGroupName: widgetGroupName
                                });

                                overlays.push(overlayWidget);
                            }
                        }
                    });
                },
                template: '<div class="panel panel-default">' +
                    '<div class="panel-heading" ng-if="widgetData.title">' +
                    '<h3 class="panel-title">{{widgetData.title}}</h3>' +
                    '</div>' +
                    '<widget-body class="panel-body">' +
                    '</widget-body>' +
                    '</div>'
            };
        }
    ]);

    function createWidget(element, widgetFactory, widgetData) {
        return widgetFactory.createWidget(element, widgetData.rawData.type, widgetData);
    }
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
                controller: ['$scope', '$http', 'crossfilterUtils',
                    function($scope, $http, crossfitlerUtils) {
                        var initializers = [],
                            initialized = false;

                        this.registerWidgetInitializer = function(initializer) {
                            if (initialized) {
                                initializer($scope.crossFilter, $scope.namedGroups, $scope.groupData.name);
                            } else {
                                initializers.push(initializer);
                            }
                        };

                        function initializeWidgets() {
                            initialized = true;

                            for (var i in initializers) {
                                initializers[i]($scope.crossFilter, $scope.namedGroups, $scope.groupData.name, $scope.rawData);
                            }

                            initializers.length = 0;
                        }


                        if (angular.isArray($scope.groupData.data)) {
                            $scope.rawData = $scope.groupData.data;
                            $scope.crossFilter = crossfilter($scope.groupData.data);
                            $scope.namedGroups = buildNamedGroups($scope.groupData.groups, $scope.crossFilter, crossfitlerUtils);
                            initializeWidgets();
                        } else if (angular.isString($scope.groupData.dataUrl)) {
                            $http({
                                method: 'GET',
                                url: $scope.groupData.dataUrl
                            })
                                .success(function(data) {
                                    $scope.rawData = data;
                                    $scope.crossFilter = crossfilter(data);
                                    $scope.namedGroups = buildNamedGroups($scope.groupData.groups, $scope.crossFilter, crossfitlerUtils);
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
                template: '<div class="widget-group-header">' +
                    '<h3 ng-if="groupData.title">{{groupData.title}}</h3>' +
                    '<filter filter-data="groupFilter" widget-group-name="groupData.name" ng-class="groupFilter.type" class="group-filter" crossfilter="crossFilter" ng-repeat="groupFilter in groupData.filters"></filter>' +
                    '</div>'
            };
        }
    ]);

    function buildNamedGroups(groupsData, crossfilter, crossfitlerUtils) {
        if (groupsData && crossfilter) {
            var namedGroups = {};

            angular.forEach(groupsData, function(groupData, groupName) {
                if (!groupData.dimension) {
                    throw 'A dimension is required for named groups';
                }

                if (!groupData.group) {
                    throw 'A group is required for named groups';
                }

                var dimensionFunction = crossfitlerUtils.dimensionFunction(groupData.dimension);
                var dimension = crossfilter.dimension(dimensionFunction);

                var grouping = crossfitlerUtils.groupFunctions(groupData.group);
                var group = dimension.group().reduce(grouping.add, grouping.remove, grouping.init);

                namedGroups[groupName] = {
                    dimension: dimension,
                    group: group
                };
            });

            return namedGroups;
        }
    }
})(angular, crossfilter);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetGroupFilterProvider',
        function(widgetGroupFilterProvider) {
            widgetGroupFilterProvider.registerWidgetGroupFilter('checkbox', new CheckboxFilter());
        }
    ]);

    var template = '<span ng-repeat="value in values">' +
        '<label>{{value.label}}</label>' +
        '<input type="checkbox" ng-click="filterChanged(value.key)">' +
        '</span>';

    function CheckboxFilter() {}

    CheckboxFilter.prototype.initialize = ['$compile', '$rootScope', 'crossfilterUtils', '$parse',
        function($compile, $rootScope, crossfilterUtils, $parse) {
            this.$compile = $compile;
            this.$rootScope = $rootScope;
            this.crossfilterUtils = crossfilterUtils;
            this.$parse = $parse;
        }
    ];

    CheckboxFilter.prototype.buildFilter = function(element, filterData, crossfilter, widgetGroupName) {
        var dimension = crossfilter.dimension(this.crossfilterUtils.dimensionFunction(filterData.dimension));
        var data = this.setupData(filterData, dimension);

        var filterElement = angular.element(template);
        element.append(filterElement);

        var filterScope = this.$rootScope.$new();
        filterScope.values = data.values;

        filterScope.filterChanged = function(value) {
            data.appliedFilters[value] = !data.appliedFilters[value];

            if (data.appliedFilters[value]) {
                data.appliedFilters._filtercount_++;
            } else {
                data.appliedFilters._filtercount_--;
            }

            dimension.filter(function(d) {
                return data.appliedFilters._filtercount_ === 0 || data.appliedFilters[d];
            });

            dc.redrawAll(widgetGroupName);
        };

        this.$compile(filterElement)(filterScope);
    };

    CheckboxFilter.prototype.setupData = function(filterData, dimension) {
        var index, value, labelGetter,
            values = this.crossfilterUtils.getDistinctValuesFromDimension(dimension),
            calculatedValues = [];

        if (filterData.labelAccessor) {
            labelGetter = this.$parse(filterData.labelAccessor);
        } else {
            labelGetter = function(d) {
                return d;
            };
        }

        var appliedFilters = {
            _filtercount_: 0
        };

        for (index in values) {
            value = values[index];
            appliedFilters[value] = false;
            calculatedValues.push({
                key: value,
                label: labelGetter({
                    v: value
                })
            });
        }

        return {
            appliedFilters: appliedFilters,
            values: calculatedValues
        };
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetGroupFilterProvider',
        function(widgetGroupFilterProvider) {
            widgetGroupFilterProvider.registerWidgetGroupFilter('select', new SelectFilter());
        }
    ]);

    var template = '<label>{{filterData.title}}</label>' +
        '<select ng-model="selected" ng-options="value for value in values" ng-change="filterChanged()">' +
        '<option value="">{{filterData.allTitle}}</option>' +
        '</select>';

    function SelectFilter() {}

    SelectFilter.prototype.initialize = ['$compile', '$rootScope', 'crossfilterUtils',
        function($compile, $rootScope, crossfilterUtils) {
            this.$compile = $compile;
            this.$rootScope = $rootScope;
            this.crossfilterUtils = crossfilterUtils;
        }
    ];

    SelectFilter.prototype.buildFilter = function(element, filterData, crossfilter, widgetGroupName) {
        var filterElement = angular.element(template);
        element.append(filterElement);

        var dimension = crossfilter.dimension(this.crossfilterUtils.dimensionFunction(filterData.dimension));

        var filterScope = this.$rootScope.$new();
        filterScope.filterData = filterData;
        filterScope.values = this.crossfilterUtils.getDistinctValuesFromDimension(dimension);

        filterScope.filterChanged = function() {
            if (!filterScope.selected || filterScope.selected === '') {
                dimension.filter(null);
            } else {
                dimension.filter(filterScope.selected);
            }
            dc.redrawAll(widgetGroupName);
        };

        this.$compile(filterElement)(filterScope);
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['crossfilterUtilsProvider',
        function(crossfilterUtilsProvider) {

            crossfilterUtilsProvider.addGroupFunctionProvider('conditional', new ConditionalGroupProvider());
        }
    ]);

    function ConditionalGroupProvider() {}

    ConditionalGroupProvider.prototype.initialize = ['$parse', '$log',
        function($parse, $log) {
            this.$parse = $parse;
            this.$log = $log;
        }
    ];

    ConditionalGroupProvider.prototype.buildGroup = function(groupParams, debug) {
        if (!groupParams) {
            throw 'conditional needs a groupParam';
        }

        return conditionalGroupBuilder(groupParams, this.$parse, debug, this.$log);
    };

    function conditionalGroupBuilder(groupParams, $parse, debug, $log) {
        var conditions = prepare(groupParams.conditions, $parse);
        var addHandlers = prepare(groupParams.handlers.add, $parse);
        var removeHandlers = prepare(groupParams.handlers.remove, $parse);

        var conditionalGroup = {
            init: function() {
                var initData = angular.copy(groupParams.init);

                if (debug) {
                    $log.info(initData);
                }

                return initData;
            },
            add: function(p, v) {
                handleConditions(conditions, addHandlers, {
                    p: p,
                    v: v
                });

                return p;
            },
            remove: function(p, v) {
                handleConditions(conditions, removeHandlers, {
                    p: p,
                    v: v
                });

                return p;
            }
        };


        return conditionalGroup;
    }

    function handleConditions(conditions, handlers, context) {
        if (handlers.pre) {
            angular.forEach(handlers.pre, function(preHandler) {
                preHandler.setter(context, preHandler.getter(context));
            });
        }

        for (var conditionKey in conditions) {
            if (conditions[conditionKey](context)) {
                for (var handlerKey in handlers[conditionKey]) {
                    var handler = handlers[conditionKey][handlerKey];
                    handler.setter(context, handler.getter(context));
                }

                break;
            }
        }

        if (handlers.post) {
            angular.forEach(handlers.post, function(postHandler) {
                postHandler.setter(context, postHandler.getter(context));
            });
        }
    }

    function prepare(expressions, $parse) {
        var prepared = {};

        angular.forEach(expressions, function(expression, key) {
            if (angular.isObject(expression)) {
                var preparedObject = {};

                angular.forEach(expression, function(e, k) {
                    preparedObject[k] = {
                        setter: $parse(k).assign,
                        getter: $parse(e)
                    };
                });

                prepared[key] = preparedObject;
            } else {
                prepared[key] = $parse(expression);
            }
        });

        return prepared;
    }
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetGroupLayoutProvider',
        function(widgetGroupLayoutProvider) {
            widgetGroupLayoutProvider.registerLayoutManager('flow', new FlowLayoutManager());
        }
    ]);

    var template = '<div class="widget-group-flow">' +
        '<widget widget-data="widget" ng-repeat="widget in groupData.widgets"></widget>' +
        '</div>';

    function FlowLayoutManager() {}

    FlowLayoutManager.prototype.initialize = ['$compile', '$rootScope',
        function($compile, $rootScope) {
            this.$compile = $compile;
            this.$rootScope = $rootScope;
        }
    ];

    FlowLayoutManager.prototype.layout = function(widgetGroupElement, groupData) {
        var layoutContainer = angular.element(template);
        widgetGroupElement.append(layoutContainer);

        var layoutScope = this.$rootScope.$new();
        layoutScope.groupData = groupData;

        this.$compile(layoutContainer)(layoutScope);
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetGroupLayoutProvider',
        function(widgetGroupLayoutProvider) {
            widgetGroupLayoutProvider.registerLayoutManager('grid', new GridLayoutManager());
        }
    ]);

    var template = '<div class="widget-group-grid">' +
        '<div class="widget-group-row" ng-repeat="row in rows">' +
        '<div class="widget-group-column" ng-repeat="column in row.columns">' +
        '<widget widget-data="widget" ng-repeat="widget in column.widgets"></widget>' +
        '</div>' +
        '</div>' +
        '</div>';

    function GridLayoutManager() {}

    GridLayoutManager.prototype.initialize = ['$compile', '$rootScope',
        function($compile, $rootScope) {
            this.$compile = $compile;
            this.$rootScope = $rootScope;
        }
    ];

    GridLayoutManager.prototype.layout = function(widgetGroupElement, groupData) {
        this.checkParameters(groupData.layout);

        var layoutContainer = angular.element(template);
        widgetGroupElement.append(layoutContainer);

        var layoutScope = this.$rootScope.$new();
        layoutScope.rows = this.buildGrid(groupData);

        this.$compile(layoutContainer)(layoutScope);
    };

    GridLayoutManager.prototype.checkParameters = function(layoutParams) {
        if (!layoutParams) {
            throw 'No layoutparameters for gridLayout defined';
        }

        if (!layoutParams.columns) {
            throw 'Grid layout needs a columns parameter';
        }

        if (!layoutParams.rows) {
            throw 'Grid layout needs a rows parameter';
        }
    };

    GridLayoutManager.prototype.buildGrid = function(groupData) {
        if (!groupData) {
            return;
        }

        var rows = [];

        for (var r = 0; r < groupData.layout.rows; r++) {
            var row = {
                columns: []
            };

            for (var c = 0; c < groupData.layout.columns; c++) {
                row.columns.push({
                    widgets: []
                });
            }

            rows.push(row);
        }

        angular.forEach(groupData.widgets, function(widget) {
            checkWidgetParameters(rows, widget);

            rows[widget.gridRow].columns[widget.gridColumn].widgets.push(widget);
        });

        return rows;
    };

    function checkWidgetParameters(rows, widget) {
        if (!angular.isDefined(widget.gridRow)) {
            throw 'Widget ' + widget.name + ' does not define the gridRow';
        }

        if (!angular.isDefined(widget.gridColumn)) {
            throw 'Widget ' + widget.name + ' does not define the gridColumn';
        }

        if (rows.length <= widget.gridRow) {
            throw 'Widget ' + widget.name + ' defines the gridRow ' + widget.gridRow +
                '. But only ' + rows.length + ' (zero based) rows are available';
        }

        if (rows[widget.gridRow].columns.length <= widget.gridColumn) {
            throw 'Widget ' + widget.name + ' defines the gridColumn ' + widget.gridColumn +
                '. But only ' + rows[widget.gridRow].columns.length + ' (zero based) rows are available';
        }
    }
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
        if (raw.namedGroup && raw.namedGroup.name) {
            chart.group(group, raw.namedGroup.name);
        } else if (raw.group && raw.group.name) {
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
        if (widgetData.rawData.namedGroup) {
            var groupName = widgetData.rawData.namedGroup.group;
            if (!widgetData.namedGroups || !widgetData.namedGroups[groupName]) {
                throw 'No named group ' + groupName + ' defined';
            }

            return widgetData.namedGroups[groupName].dimension;
        } else {
            var crossfilter = widgetData.crossfilter;
            var dimensionFunction = this.crossfilterUtils.dimensionFunction(widgetData.rawData.dimension);

            return crossfilter.dimension(dimensionFunction);
        }
    };

    BaseChartMixin.prototype.buildGroup = function(dimension, widgetData) {
        if (widgetData.rawData.namedGroup) {
            var groupName = widgetData.rawData.namedGroup.group;
            if (!widgetData.namedGroups || !widgetData.namedGroups[groupName]) {
                throw 'No named group ' + groupName + ' defined';
            }

            return widgetData.namedGroups[groupName].group;
        } else {
            var grouping = this.crossfilterUtils.groupFunctions(widgetData.rawData.group);
            return dimension.group().reduce(grouping.add, grouping.remove, grouping.init);
        }
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerChartMixin('bubbleMixin', new BubbleMixin());
        }
    ]);

    function BubbleMixin() {}

    BubbleMixin.prototype.initialize = ['scaleParser', 'widgetExpressionParser',
        function(scaleParser, widgetExpressionParser) {
            this.scaleParser = scaleParser;
            this.widgetExpressionParser = widgetExpressionParser;
        }
    ];

    BubbleMixin.prototype.configureChart = function(chart, widgetData) {
        var raw = widgetData.rawData;
        //        var invoke = this.invokeIfDefined;

        if (raw.r) {
            chart.r(this.scaleParser.parse(raw.r));
        }

        if (raw.radiusValueAccessor) {
            chart.radiusValueAccessor(this.widgetExpressionParser.valueFunction(raw.radiusValueAccessor));
        }
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerChartMixin('stackMixin', new StackMixin());
        }
    ]);

    function StackMixin() {}

    StackMixin.prototype.initialize = ['invokeIfDefined', 'crossfilterUtils', 'widgetExpressionParser',
        function(invokeIfDefined, crossfilterUtils, widgetExpressionParser) {
            this.invokeIfDefined = invokeIfDefined;
            this.crossfilterUtils = crossfilterUtils;
            this.widgetExpressionParser = widgetExpressionParser;
        }
    ];

    StackMixin.prototype.configureChart = function(chart, widgetData) {
        var raw = widgetData.rawData;

        //Nothing to do here if no stacks are defined
        if (!raw.stacks) {
            return;
        }
        var invoke = this.invokeIfDefined,
            dim = chart.dimension(),
            mixin = this;

        angular.forEach(raw.stacks, function(stack) {
            var grouping = mixin.crossfilterUtils.groupFunctions(stack);
            var group = dim.group().reduce(grouping.add, grouping.remove, grouping.init);
            var valueAccessor;

            if (stack.valueAccessor) {
                valueAccessor = mixin.widgetExpressionParser.valueFunction(stack.valueAccessor);
            }

            if (stack.name && valueAccessor) {
                chart.stack(group, stack.name, valueAccessor);
            } else if (valueAccessor) {
                chart.stack(group, valueAccessor);
            } else if (stack.name) {
                chart.stack(group, stack.name);
            } else {
                chart.stack(group);
            }
        });

        invoke(raw, chart, 'hideableStacks');

    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['scaleParserProvider',
        function(scaleParserProvider) {
            scaleParserProvider.registerScaleProvider('category10', new Category10ScaleProvider());
        }
    ]);

    function Category10ScaleProvider() {}

    Category10ScaleProvider.prototype.createScale = function(scaleParams) {
        var scale = d3.scale.category10();

        return scale;
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['scaleParserProvider',
        function(scaleParserProvider) {
            scaleParserProvider.registerScaleProvider('ordinal', new OrdinalScaleProvider());
        }
    ]);

    function OrdinalScaleProvider() {}
    OrdinalScaleProvider.prototype.initialize = ['invokeIfDefined',
        function(invokeIfDefined) {
            this.invokeIfDefined = invokeIfDefined;
        }
    ];

    OrdinalScaleProvider.prototype.createScale = function(scaleParams) {
        var scale = d3.scale.ordinal();
        var invoke = this.invokeIfDefined;

        if (scaleParams) {
            invoke(scaleParams, scale, 'domain');
            invoke(scaleParams, scale, 'range');
        }

        return scale;
    };

})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['unitsParserProvider',
        function(scaleParserProvider) {
            scaleParserProvider.registerUnitProvider('ordinal', new OrdinalUnitsProvider());
        }
    ]);

    function OrdinalUnitsProvider() {}

    OrdinalUnitsProvider.prototype.createUnit = function() {
        return dc.units.ordinal;
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
        var barChart = dc.barChart(element[0], widgetData.widgetGroupName);
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
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
        var chart = dc.boxPlot(element[0], widgetData.widgetGroupName);

        this.baseChartMixin.configureChart(chart, widgetData);
        this.coordinateGridMixin.configureChart(chart, widgetData);
        this.marginMixin.configureChart(chart, widgetData);
        this.colorMixin.configureChart(chart, widgetData);

        chart.render();

        return chart;
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerWidgetProvider('bubbleoverlay', new BubbleOverlayProvider());
        }
    ]);

    function BubbleOverlayProvider() {}

    BubbleOverlayProvider.prototype.initialize = ['baseChartMixin', 'bubbleMixin', 'colorMixin', 'invokeIfDefined',
        function(baseChartMixin, bubbleMixin, colorMixin, invokeIfDefined) {
            this.baseChartMixin = baseChartMixin;
            this.bubbleMixin = bubbleMixin;
            this.invokeIfDefined = invokeIfDefined;
            this.colorMixin = colorMixin;
        }
    ];

    BubbleOverlayProvider.prototype.createWidget = function(element, widgetData) {
        var chart = dc.bubbleOverlay(element[0], widgetData.widgetGroupName),
            raw = widgetData.rawData;

        chart.svg(d3.select(element.find('svg')[0]));

        this.baseChartMixin.configureChart(chart, widgetData);
        this.bubbleMixin.configureChart(chart, widgetData);
        this.colorMixin.configureChart(chart, widgetData);

        if (raw.points) {
            for (var i in raw.points) {
                var point = raw.points[i];

                chart.point(point.name, point.x, point.y);
            }
        }

        chart.render();

        return chart;
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
        var chart = dc.heatMap(element[0], widgetData.widgetGroupName);

        this.baseChartMixin.configureChart(chart, widgetData);
        this.coordinateGridMixin.configureChart(chart, widgetData);
        this.marginMixin.configureChart(chart, widgetData);
        this.colorMixin.configureChart(chart, widgetData);

        chart.render();

        return chart;
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
        var lineChart = dc.lineChart(element[0], widgetData.widgetGroupName);

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
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
        var chart = dc.pieChart(element[0], widgetData.widgetGroupName);
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
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerWidgetProvider('raw', new RawProvider());
        }
    ]);


    function RawProvider() {}

    RawProvider.prototype.createWidget = function(element, widgetData) {

        if (widgetData.rawData.content) {
            element.append(widgetData.rawData.content);
        }

        return element;
    };
})(angular);
/**
 * Copyright 2014 Daniel Furtlehner
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(angular) {
    var ngDashboard = angular.module('ngDashboard');

    ngDashboard.config(['widgetFactoryProvider',
        function(widgetFactoryProvider) {
            widgetFactoryProvider.registerWidgetProvider('svg', new SvgProvider());
        }
    ]);


    function SvgProvider() {}

    SvgProvider.prototype.createWidget = function(element, widgetData) {
        var svg = d3.select(element[0]).append('svg');

        var raw = widgetData.rawData;

        if (raw.width) {
            svg.attr('width', raw.width);
        }

        if (raw.height) {
            svg.attr('height', raw.height);
        }

        this.handleElements(svg, raw.elements);

        return svg;
    };

    SvgProvider.prototype.handleElements = function(parent, elements) {
        var svgProvider = this;

        angular.forEach(elements, function(element) {
            var node = parent.append(element.type);


            svgProvider.handleAttributes(node, element);

            if (element.elements) {
                svgProvider.handleElements(node, element.elements);
            }
        });
    };

    SvgProvider.prototype.handleAttributes = function(node, attributes) {
        angular.forEach(attributes, function(value, key) {
            if (key !== 'elements' && key !== 'type') {
                node.attr(key, value);
            }
        });
    };
})(angular);
