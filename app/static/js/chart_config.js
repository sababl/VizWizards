// Define the Angular module
const app = angular.module('myApp', ['ngMaterial', 'ngAria', 'ngAnimate', 'ngMessages']);

// Configure Angular Material theme
app.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('orange');
});

// Add filter to format section names
app.filter('replace', function() {
    return function(input, from, to) {
        if (input === undefined) return '';
        return input.replace(new RegExp(from, 'g'), to);
    };
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
            sex: 'Male',
            year: '2021'
        };

        // Add bubble chart specific data
        $scope.beeswarmData = {
            year: 2021
        };

        // Add this near the start of the controller
        $scope.sections = ['global-overview', 'regional-insights', 'country-comparisons', 'gender-analysis'];
        $scope.selectedTab = 0;

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
                    // Sort countries alphabetically
                    $scope.countries = (response.data.countries || []).sort((a, b) => a.localeCompare(b));
                    
                    // Set default selected countries if available
                    if ($scope.countries.length >= 3) {
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
                // .then(function () {
                //     $mdToast.show(
                //         $mdToast.simple()
                //             .textContent('Chart updated successfully')
                //             .position('top right')
                //             .hideDelay(3000)
                //     );
                // })
                // .catch(function (error) {
                //     $mdToast.show(
                //         $mdToast.simple()
                //             .textContent('Error updating chart: ' + error.message)
                //             .position('top right')
                //             .hideDelay(3000)
                //     );
                // });
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
                    // .then(() => {
                    //     $mdToast.show(
                    //         $mdToast.simple()
                    //             .textContent('Violin chart updated successfully')
                    //             .position('top right')
                    //             .hideDelay(3000)
                    //     );
                    // })
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
        $scope.countries = [].sort((a, b) => a.localeCompare(b));
        $scope.regions = [];
        $scope.updateSlopeChart = function () {
            if ($scope.slopeData.country1 && $scope.slopeData.country2) {
                updateChart($scope.slopeData.country1, $scope.slopeData.country2);
            }
        };

        // In chart_config.js, add this after initializing spiderFormData
        SpiderChartService.setDefaults($scope);

        // In chart_config.js, add to FormController
        function updateActiveTab() {
            const sections = [
                'global-overview',
                'regional-insights',
                'country-comparisons',
                'gender-analysis'
            ];
            
            const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            
            // Find which section is currently in view
            for (let i = 0; i < sections.length; i++) {
                const section = document.getElementById(sections[i]);
                if (!section) continue;
                
                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top + scrollPosition;
                const sectionMiddle = sectionTop + (rect.height / 2);
                
                // If scroll position is within this section's bounds
                if (scrollPosition >= sectionTop - 100 && 
                    scrollPosition < sectionTop + rect.height - 100) {
                    
                    // Update the selected tab without triggering scroll
                    $timeout(function() {
                        $scope.$apply(function() {
                            $scope.selectedTab = i;
                        });
                    });
                    break;
                }
            }
        }

        // Add scroll event listener
        var content = document.getElementById('mainContent');
        if (content) {
          content.addEventListener('scroll', debounce(updateActiveTab, 50));
        }
        // Update initial state
        $timeout(updateActiveTab, 10);
    }]);

// Add custom debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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
                .style('font-family', ChartConfig.styling.fontFamily)
                .style('box-shadow', '0 2px 5px rgba(0, 0, 0, 0.2)')
                .style('transition', 'opacity 0.3s ease-in-out');
        }
    }
};