angular.module('freefall')
.service('ComicData', function ComicDataService($http, $window){
  var ComicData = {},
      dataRequest = $http.get('data.json').then(function(r){
        serverData = r.data;
        return serverData;
      }),
      prefix = 'FreeFall-archive-viewer_',
      serverData,
      customData;

  customData = angular.fromJson(
    $window.localStorage.getItem(prefix + 'customData') || '{}'
  );

  ComicData.get = function ComicData_get(id){
    return dataRequest.then(function(data){
      return angular.extend({}, data[id], customData[id]);
    });
  };

  ComicData.set = function ComicData_set(id, data){
    dataRequest.then(function(){
      var comic = angular.extend({}, customData[id], data);
      for (var prop in comic){
        if (comic.hasOwnProperty(prop) && comic[prop] === serverData[id]){
          delete comic[prop];
        }
      }
      customData[id] = comic;
      $window.localStorage.setItem(prefix + 'customData', customData);
    });
  };

  return ComicData;
});