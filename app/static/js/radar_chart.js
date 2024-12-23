
var app = angular.module('myApp', ['ngMaterial']);

app.controller('FormController', ['$scope', '$http', function ($scope, $http) {
    
    $scope.states = {
        "001": "Alabama",
        "002": "Arizona",
        "003": "Arkansas",
        "004": "California",
        "005": "Colorado",
        "006": "Connecticut",
        "007": "Delaware",
        "008": "Florida",
        "009": "Georgia",
        "010": "Idaho",
        "011": "Illinois",
        "012": "Indiana",
        "013": "Iowa",
        "014": "Kansas",
        "015": "Kentucky",
        "016": "Louisiana",
        "017": "Maine",
        "018": "Maryland",
        "019": "Massachusetts",
        "020": "Michigan",
        "021": "Minnesota",
        "022": "Mississippi",
        "023": "Missouri",
        "024": "Montana",
        "025": "Nebraska",
        "026": "Nevada",
        "027": "New Hampshire",
        "028": "New Jersey",
        "029": "New Mexico",
        "030": "New York",
        "031": "North Carolina",
        "032": "North Dakota",
        "033": "Ohio",
        "034": "Oklahoma",
        "035": "Oregon",
        "036": "Pennsylvania",
        "037": "Rhode Island",
        "038": "South Carolina",
        "039": "South Dakota",
        "040": "Tennessee",
        "041": "Texas",
        "042": "Utah",
        "043": "Vermont",
        "044": "Virginia",
        "045": "Washington",
        "046": "West Virginia",
        "047": "Wisconsin",
        "048": "Wyoming",
        "050": "Alaska",
        "101": "Northeast Region",
        "102": "East North Central Region",
        "103": "Central Region",
        "104": "Southeast Region",
        "105": "West North Central Region",
        "106": "South Region",
        "107": "Southwest Region",
        "108": "Northwest Region",
        "109": "West Region",
        "110": "National (contiguous 48 States)"
        };

    $scope.stateList = Object.entries($scope.states).map(([code, name]) => ({ code, name }));
    // Filter out invalid or empty states
    $scope.years = Array.from({ length: 2024 - 1895 + 1 }, (_, i) => 1895 + i); // Generate years from 1895 to 2024

    $scope.formData = {
        state: '',
        years: [],
    };


    console.log('State List:', $scope.stateList);

    console.log('States:', $scope.states);
    console.log('Years:', $scope.years);

    // console.log($scope.states);
    $scope.generateSpiderPlot = function () {
        if ($scope.formData.years.length > 10) {
            alert('Please select up to 10 years only.');
            return;
        }

        console.log('State:', $scope.formData.state);
        console.log('Years:', $scope.formData.years);
        alert('Spider Plot Generated! (This is a placeholder action)');
    };
}]);
