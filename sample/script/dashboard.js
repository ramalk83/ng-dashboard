(function(angular) {
    var dashboard = angular.module('dashboard', ['ngDashboard']);

    dashboard.controller('ChartController', ['crime', 'experiments',

        function(crime, experiments) {
            this.intro = {
                title: 'ng-dashboard',
                name: 'intro',
                widgets: [{
                    name: 'intro',
                    type: 'raw',
                    content: 'This sample page uses data from <a href="https://github.com/dc-js/dc.js/tree/master/web" target="_blank">dc.js</a>'
                }]
            };

            this.experiments = experiments;

            this.crime = crime;

        }
    ]);
})(angular);