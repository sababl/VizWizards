// Define the Angular module
const app = angular.module('myApp', ['ngMaterial', 'ngAria', 'ngAnimate', 'ngMessages']);

// Configure Angular Material theme
app.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('orange');
});

// Define the shared FormController
app.controller('FormController', ['$scope', '$http', '$timeout', '$location', '$anchorScroll', '$mdToast',
function($scope, $http, $timeout, $location, $anchorScroll, $mdToast) {
    // Initialize form data
    $scope.years = [];
    $scope.regions = [];
    $scope.formData = {
        region: '',
        year: ''
    };

    // Fetch available regions
    $http.get('/regions').then(function(response) {
        $scope.regions = response.data.regions
            .toString()
            .split(',')
            .map(region => region.trim())
            .filter(region => region.length > 0);
    });

    // Fetch available years
    $http.get('/years').then(function(response) {
        $scope.years = response.data.years
            .toString()
            .split(',')
            .map(year => year.trim())
            .filter(year => year.length > 0);
    });

    // Scroll function for navigation
    $scope.scrollTo = function(elementId) {
        $timeout(function() {
            var element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        });
    };

    // Chart generation functions
    $scope.generateErroPlot = function() {
        if ($scope.formData.year && $scope.formData.region) {
            createErrorChart($scope.formData);
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
        getChartDimensions: function(containerId) {
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
        transition: function() {
            return d3.transition()
                .duration(ChartConfig.animation.duration)
                .ease(d3.easeQuadOut);
        },

        // Tooltip creation
        createTooltip: function(containerId) {
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