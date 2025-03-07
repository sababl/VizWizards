// Define the Angular module
const app = angular.module('myApp', ['ngMaterial', 'ngAria', 'ngAnimate', 'ngMessages']);

// Configure Angular Material theme
app.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('orange');
});

// Define the shared FormController

app.controller('FormController', [
    '$scope',
    '$http',
    'GlobalChartsService',
    'ErrorChartService',
    '$timeout',
    '$location',
    '$anchorScroll',
    '$mdToast',
    'SpiderChartService',
    'BubbleChartService',
    'ViolinChartService',
    function (
        $scope,
        $http,
        GlobalChartsService,
        ErrorChartService,
        $timeout,
        $location,
        $anchorScroll,
        $mdToast,
        SpiderChartService,
        BubbleChartService,
        ViolinChartService
    ) {
        $scope.years = [];
        $scope.regions = [];
        $scope.formData = {
            region: '',
            year: ''
        };

        $scope.countries = [];
        $scope.spiderFormData = {
            selectedCountries: [],
            sex: 'female',
            year: '2021'
        };

        // Add bubble chart specific data
        $scope.beeswarmData = {
            year: 2021
        };


        // Add to FormController scope initialization
        $scope.violinFormData = {
            region: 'all',
            year: '2021'
        };

        // Initialize data on controller load
        function init() {
            // Fetch available years
            $http.get('/years')
                .then(function (response) {
                    $scope.years = response.data.years;
                    if ($scope.years.length > 0) {
                        $scope.formData.year = $scope.years[0];
                    }
                    // console.log($scope.years);
                });

            // Fetch available regions
            $http.get('/regions')
                .then(function (response) {
                    $scope.regions = response.data.regions;
                    if ($scope.regions.length > 0) {
                        $scope.formData.region = $scope.regions[0];
                    }

                    // console.log($scope.regions);
                });

            // Initialize violin chart with default values
            $timeout(function () {
                $scope.generateViolinPlot();
            });

            $http.get('/countries')
                .then(function (response) {
                    $scope.countries = response.data.countries || [];
                    // Provide some default countries if you want automatic chart
                    if ($scope.countries.length >= 2) {
                        $scope.spiderFormData.selectedCountries = [
                            $scope.countries[0],
                            $scope.countries[1],
                            $scope.countries[2]
                        ];
                    } else if ($scope.countries.length > 0) {
                        $scope.spiderFormData.selectedCountries = [$scope.countries[0]];
                    }
                });
        }
        // Call init function when controller loads
        GlobalChartsService.createGlobalTrendsChart();
        init();
        // Scroll function for navigation
        $scope.scrollTo = function (elementId) {
            $timeout(function () {
                var element = document.getElementById(elementId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            });
        };

        // Chart generation functions
        $scope.generateErroPlot = function () {
            if ($scope.formData.year && $scope.formData.region) {
                ErrorChartService.createErrorChart($scope.formData)
                    .then(function () {
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('Chart updated successfully')
                                .position('top right')
                                .hideDelay(3000)
                        );
                    })
                    .catch(function (error) {
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('Error updating chart: ' + error.message)
                                .position('top right')
                                .hideDelay(3000)
                        );
                    });
            } else {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Please select both year and region')
                        .position('top right')
                        .hideDelay(3000)
                );
            }
        };

        // Add watchers for automatic chart updates
        $scope.$watchGroup(['formData.year', 'formData.region'], function (newValues, oldValues) {
            if (newValues !== oldValues && newValues[0] && newValues[1]) {
                $scope.generateErroPlot();
            }
        });
        $scope.generateSpiderPlot = function () {
            if (
                !$scope.spiderFormData.sex ||
                !$scope.spiderFormData.year ||
                !$scope.spiderFormData.selectedCountries.length
            ) {
                // If user hasn't picked all required filters
                return;
            }

            if ($scope.spiderFormData.selectedCountries.length > 10) {
                // Optionally warn about picking too many
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Please select maximum 10 countries')
                        .position('top right')
                        .hideDelay(3000)
                );
                return;
            }

            // Use the radar chart service
            SpiderChartService.createRadarChart(
                $scope.spiderFormData.selectedCountries,
                $scope.spiderFormData.sex,
                $scope.spiderFormData.year
            ).catch(function (error) {
                console.error('Error generating spider plot:', error);
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Error generating spider plot')
                        .position('top right')
                        .hideDelay(3000)
                );
            });
        };

        // 7) Watch for changes in the spider form data
        //    Each time the user changes sex, year, or selectedCountries, auto-generate the chart.
        $scope.$watchGroup(
            [
                'spiderFormData.sex',
                'spiderFormData.year',
                'spiderFormData.selectedCountries'
            ],
            function (newVals, oldVals) {
                if (newVals !== oldVals) {
                    $scope.generateSpiderPlot();
                }
            }
        );

        // Add bubble chart generation function
        $scope.generateBubbleChart = function () {
            BubbleChartService.createBubbleChart($scope.beeswarmData.year);
        };

        // Watch for changes in beeswarm year
        $scope.$watch('beeswarmData.year', function (newYear) {
            if (newYear) {
                $scope.generateBubbleChart();
            }
        });

        // Add violin chart generation function
        $scope.generateViolinPlot = function () {
            if ($scope.violinFormData.year && $scope.violinFormData.region) {
                ViolinChartService.createViolinPlot($scope.violinFormData)
                    .then(() => {
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('Violin chart updated successfully')
                                .position('top right')
                                .hideDelay(3000)
                        );
                    })
                    .catch(error => {
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('Error updating violin chart: ' + error.message)
                                .position('top right')
                                .hideDelay(3000)
                        );
                    });

            }
        };

        // Add watchers for violin chart
        $scope.$watchGroup(['violinFormData.year', 'violinFormData.region'], function (newValues, oldValues) {
            if (newValues !== oldValues && newValues[0] && newValues[1]) {
                $scope.generateViolinPlot();
            }
        });

        // Set initial values
        $http.get('/countries').then(function (response) {
            $scope.countries = response.data.countries || [];
        });

        // Initialize the data structures
        $scope.years = Array.from({ length: 22 }, (_, i) => 2000 + i);
        $scope.countries = []; // Will be populated from data
        $scope.regions = [];   // Will be populated from data
        $scope.updateSlopeChart = function () {
            if ($scope.slopeData.country1 && $scope.slopeData.country2) {
                updateChart($scope.slopeData.country1, $scope.slopeData.country2);
            }
        };
    }]);

const ChartConfig = {
    // Color palette
    colors: {
        primary: {
            main: '#1C554F',
            light: '#019154',
            dark: '#0D3B36'
        },
        secondary: {
            main: '#E05515',
            light: '#FF7439',
            dark: '#B33E06'
        },
        neutral: {
            gray: '#C7CDCC',
            khaki: '#AFAE9F',
            white: '#f8faf9',
            cream: '#EBECEB'
        },
        charts: [
            '#1C554F', // dark green
            '#E05515', // orange
            '#019154', // light green
            '#C7CDCC', // gray
            '#AFAE9F', // khaki
            '#4A90E2', // blue
            '#F5A623', // yellow
            '#7ED321', // lime
            '#9013FE', // purple
            '#50E3C2'  // turquoise
        ]
    },

    // Common chart dimensions
    dimensions: {
        margin: {
            top: 40,
            right: 40,
            bottom: 60,
            left: 60
        },
        aspectRatio: 0.6, // height = width * aspectRatio
        minHeight: 400,
        maxHeight: 600
    },

    // Common chart styling
    styling: {
        fontSize: {
            title: '18px',
            axis: '12px',
            labels: '14px',
            legend: '12px'
        },
        fontFamily: "'Roboto', sans-serif",
        strokeWidth: {
            axis: 1,
            grid: 0.5,
            line: 2
        }
    },

    // Animation settings
    animation: {
        duration: 750,
        delay: 150
    },

    // Shared chart functions
    utils: {
        // Responsive sizing
        getChartDimensions: function (containerId) {
            const container = document.getElementById(containerId);
            if (!container) return null;

            const width = container.offsetWidth;
            const height = Math.min(
                Math.max(width * ChartConfig.dimensions.aspectRatio,
                    ChartConfig.dimensions.minHeight),
                ChartConfig.dimensions.maxHeight
            );

            return {
                width: width - ChartConfig.dimensions.margin.left - ChartConfig.dimensions.margin.right,
                height: height - ChartConfig.dimensions.margin.top - ChartConfig.dimensions.margin.bottom,
                margin: ChartConfig.dimensions.margin
            };
        },

        // Common transitions
        transition: function () {
            return d3.transition()
                .duration(ChartConfig.animation.duration)
                .ease(d3.easeQuadOut);
        },

        // Tooltip creation
        createTooltip: function (containerId) {
            return d3.select(`#${containerId}`)
                .append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0)
                .style('position', 'absolute')
                .style('background-color', 'white')
                .style('border', `1px solid ${ChartConfig.colors.neutral.gray}`)
                .style('padding', '8px')
                .style('border-radius', '4px')
                .style('pointer-events', 'none')
                .style('font-size', ChartConfig.styling.fontSize.labels)
                .style('font-family', ChartConfig.styling.fontFamily);
        }
    }
};