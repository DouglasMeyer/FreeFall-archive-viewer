angular.module('freefall')
.service('ComicData', function ComicDataService($http, $window){
  var ComicData = {},
      theData = $http.get('data.json').then(function(r){ return r.data; }),
      prefix = 'FreeFall-archive-viewer_',
      customData;

  customData = angular.fromJson(
    $window.localStorage.getItem(prefix + 'customData') || '{}'
  );

  ComicData.get = function ComicData_get(id){
    return theData.then(function(data){
      return angular.extend({}, data[id], customData[id]);
    });
  };

  return ComicData;
});
