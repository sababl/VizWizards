var app = angular.module('myApp', ['ngMaterial']);
app.controller('FormController', ['$scope', '$http', '$mdToast', function ($scope, $http, $mdToast) {


type="text/javascript">anychart.onDocumentReady(function () {
  
    // create a heatmap
    let chart = anychart.heatMap(getData());


    // name the heatmap
    chart.title("Comparing CO2 emission types in ten top countries");
  
    // set the container for the heatmap
    chart.container("container");
  
    // draw the heatmap
    chart.draw();
    
  
  });
     
  // add the data
  function getData() {
    return [
    {
        x: "United States",
        y: "Annual CO₂ emissions from land-use change",
        heat: 80213570.0
      },
      {
        x: "United States",
        y: "Annual CO₂ emissions from fossil",
        heat: 5612983000.0
      },
      {
        x: "China",
        y: "Annual CO₂ emissions from land-use change",
        heat: 1143726100.0
      },
      {
        x: "China",
        y: "Annual CO₂ emissions from fossil",
        heat: 3508818200.0
      },
      {
        x: "Brazil",
        y: "Annual CO₂ emissions from land-use change",
        heat: 1753184100.0
      },
      {
        x: "Brazil",
        y: "Annual CO₂ emissions from fossil",
        heat: 289311000.0
      },
      {
        x: "Russia",
        y: "Annual CO₂ emissions from land-use change",
        heat: 440798850.0
      },
      {
        x: "Russia",
        y: "Annual CO₂ emissions from fossil",
        heat: 1586822100.0
      },
      {
        x: "Japan",
        y: "Annual CO₂ emissions from land-use change",
        heat: -5057492.5
      },
      {
        x: "Japan",
        y: "Annual CO₂ emissions from fossil",
        heat: 1251545700.0
      },
      {
        x: "India",
        y: "Annual CO₂ emissions from land-use change",
        heat: 162782580.0
      },
      {
        x: "India",
        y: "Annual CO₂ emissions from fossil",
        heat: 823620700.0
      },
      {
        x: "Indonesia",
        y: "Annual CO₂ emissions from land-use change",
        heat: 730092860.0
      },
      {
        x: "Indonesia",
        y: "Annual CO₂ emissions from fossil",
        heat: 253065010.0
      },
      {
        x: "Germany",
        y: "Annual CO₂ emissions from land-use change",
        heat: -19220574.0
      },
      {
        x: "Germany",
        y: "Annual CO₂ emissions from fossil",
        heat: 959653300.0
      },
      {
        x: "Canada",
        y: "Annual CO₂ emissions from land-use change",
        heat: 230453520.0
      },
      {
        x: "Canada",
        y: "Annual CO₂ emissions from fossil",
        heat: 508196640.0
      },
      {
        x: "United Kingdom",
        y: "Annual CO₂ emissions from land-use change",
        heat: 13399761.0
      },
      {
        x: "United Kingdom",
        y: "Annual CO₂ emissions from fossil",
        heat: 586760700.0
      },
  
    ];
  }
}]);