angular.module('freefall')
.config(function($routeProvider){
  $routeProvider.when('/comic/:comicId', {
    templateUrl: 'template/comicPage.html',
    controller: 'ComicCtrl',
    resolve: {
      comic: function($route, ComicData){
        var id = parseInt($route.current.params.comicId, 10);
        return ComicData.get(id);
      }
    }
  });

  $routeProvider.when('/changes', {
    templateUrl: 'template/changes.html',
    controller: 'ChangesCtrl'
  });

  $routeProvider.otherwise({ redirectTo: '/comic/1' });
})
.controller('ChangesCtrl', function ChangesCtrl($scope, ComicData){
  var dataKeys = Object.keys(ComicData.customData),
      dataCount = dataKeys.length,
      groupCount = parseInt((dataCount - 1) / 250 + 1, 10);
  $scope.dataRanges = [ { name: 'All Changes', file: 'all', start: 1, end: dataCount } ];
  for (var i=0; i < groupCount; i++){
    var start = i * 250 + 1,
        end = (i + 1) * 250;
    $scope.dataRanges.push({
      name: 'Changes '+start+' - '+end, file: end, start: start, end: end
    });
  }
  $scope.range = $scope.dataRanges[0];
  $scope.$watch('range', function(range){
    var data = [];
    for (var i = range.start-1; i < range.end && dataKeys[i]; i++){
      data.push(ComicData.customData[dataKeys[i]]);
    }
    $scope.dataForRange = ComicData.format(data);
  });
})
.directive('fFileHref', function fFileHrefDirective($parse){
  return {
    restrict: 'A',
    link: function fFileHrefDirective_link(scope, element, attrs){
      scope.$watch(attrs.fFileHref, function(fileData){
        var blob = new Blob( [ fileData ], {type: 'text/plain'});//'octet/stream'});
        element.attr('href', URL.createObjectURL(blob));
      });
    }
  };
})
.controller('ComicCtrl', function ComicCtrl($scope, comic, ComicData, $routeParams){
  var id;
  if (comic){
    id = parseInt(comic.stripId, 10);
  } else {
    id = parseInt($routeParams.comicId, 10);
    comic = {
      stripId: ''+id,
      panels: []
    };
    var paddedId = '0000' + id,
        group = Math.ceil(id / 100) * 100,
    paddedId = paddedId.slice(paddedId.length - 5);
    if (id < 1253) {
      comic.url = "http://freefall.purrsia.com/ff"+group+"/fv"+paddedId+".gif"
    } else {
      comic.url = "http://freefall.purrsia.com/ff"+group+"/fc"+paddedId+".png"
    }
    ComicData.get(id-1).then(function(previousComic){
      comic.chapter = previousComic.chapter;
      comic.year    = previousComic.year;
    });
  }

  $scope.comic = comic;
  $scope.indexView = 'values';

  $scope.$watch('comic', function(comic){
    ComicData.set(id, comic);
  }, true);

  if (id > 1) $scope.previousComic = "#/comic/" + (id - 1);
  $scope.nextComic = "#/comic/" + (id + 1);
})
.directive('fComic', function fComicDirective(){
  return {
    restrict: 'A',
    templateUrl: 'template/comic.html',
    controller: function fComicDirective_Ctrl($scope){
      $scope.selectedPanel = 0;
      $scope.selectPanel = function fComicDirective_Ctrl_selectPanel(x){
        $scope.selectedPanel = x;
      };
      $scope.addPanel = function fComicDirective_Ctrl_addPanel(){
        var panels = $scope.comic.panels;
        panels.push({ index: panels.length + 1, dialog: [] });
      };
      $scope.removePanel = function fComicDirective_Ctrl_removePanel(panel){
        var panels = $scope.comic.panels,
            panelIndex = panels.indexOf(panel);
        panels.splice(panelIndex, 1);
      };
      $scope.addDialog = function fComicDirective_Ctrl_addDialog(panel){
        panel.dialog.push({});
      };
      $scope.removeDialog = function fComicDirective_Ctrl_removeDialog(panel, dialog){
        var dialogIndex = panel.dialog.indexOf(dialog);
        panel.dialog.splice(dialogIndex, 1);
      };
    }
  };
})
.controller('AppCtrl', function AppCtrl($scope, ComicData){
  $scope.processNewData = function AppCtrl_processNewData(name, text){
    var datas = ComicData.parse(text);
    for (var data, i=0; data = datas[i]; i++){
      ComicData.set(data.stripId, data);
    }
  };

  $scope.hasCustomData = function(){
    return ComicData.hasCustomData();
  };

  $scope.chapters = [];
  var lastChapter;
  ComicData.all().then(function(comics){
    for (var i in comics){
      if (lastChapter !== comics[i].chapter) $scope.chapters.push(comics[i]);
      lastChapter = comics[i].chapter;
    }
  });

  $scope.changes = ComicData.customData;
})
.directive('fFileUploader', function fFileUploaderDirective($parse){
  return {
    restrict: 'A',
    scope: true,
    link: function fFileUploaderDirective_link(scope, element, attrs){
      // function to prevent default behavior (browser loading image)
      var processDragOverOrEnter = function fFileUploaderDirective_processDragOverOrEnter(event){
        event && event.preventDefault()
        event.dataTransfer.effectAllowed = 'copy'
        return false
      };

      var validMimeTypes = attrs.fileDropzone;

      var isTypeValid = function fFileUploaderDirective_isTypeValid(type){
        if (!validMimeTypes || validMimeTypes.indexOf(type) > -1){
          return true;
        } else {
          // return true if no mime types are provided
          //alert "Invalid file type.  File must be one of following types #{validMimeTypes}"
          return false;
        }
      };

      // for dragover and dragenter (IE) we stop the browser from handling the
      // event and specify copy as the allowable effect
      element.bind('dragover', processDragOverOrEnter);
      element.bind('dragenter', processDragOverOrEnter);

      // on drop events we stop browser and read the dropped file via the FileReader
      // the resulting droped file is bound to the image property of the scope of this directive
      element.bind('drop', function(event){
        event && event.preventDefault()
        var reader = new FileReader()
        reader.onload = function(evt){

          if (isTypeValid(type)){
            scope.$apply(function(){
              var fn = $parse(attrs.fFileUploader);
              fn(scope, { text: evt.target.result, name: name});
            });
          }
        };

        var file = event.dataTransfer.files[0]
        var name = file.name
        var type = file.type
        reader.readAsText(file)
        return false
      });

    }
  };
})
.directive('fTagInput', function fTagInput($compile){
  return function fTagInput_link(scope, element, attrs){
    var model = attrs.fTagInput,
        id = model.replace(/\./g, '-');
    element.attr('for', id);
    element.append('<input type="text" id="'+id+'" ng-model="'+model+'" />');
    $compile(element.contents())(scope);
  };
});
