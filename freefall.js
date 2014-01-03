angular.module('freefall', ['ng'])
  .service('ComicData', function ComicDataService(){
    var comicData = {},
        prefix = 'FreeFall-archive-viewer_',
        customData = localStorage.getItem(prefix + 'customData') || {},
        ComicData = {};

    ComicData.parse = function ComicDataService_parse(string){
      var s = String.fromCharCode(-3),
          datas = [],
          lines = string.split(/\r?\n/),
          data, panel, dialog, inTags,
          match,
          year, chapter, dayDescription;
      for (var line, i=0; i < lines.length; i++){
        line = lines[i];
        if (line.match(/^\s*$/)) {
          // noop
        } else if (match = line.match("^    "+s+"(.+)"+s+"$")){
          data.tags.push(match[1]);
        } else if (match = line.match(/^~(\d{4})~$/)){
          year = match[1];
        } else if (match = line.match(/^~(.*)~$/)){
          chapter = match[1];
        } else if (match = line.match(/^_ _ _ (.*) _ _ _$/)){
          dayDescription = match[1];
        } else if (match = line.match(/^    # (\d{4})$/)){
          data = { year: year, chapter: chapter, dayDescription: dayDescription, panels: [], tags: [] };
          dayDescription = undefined;
          inTags = false;
          datas.push(data);
          data.stripId = match[1];
        } else if (match = line.match(/^          -(.*)-$/)){ //FIXME: "->, " means something
          data.place = match[1];
        } else if (match = line.match(/^        \* #(\d+)$/)){
          panel = { index: match[1], dialog: [] };
          data.panels.push(panel);
        } else if (match = line.match(/^          (.+):$/)){
          dialog = { character: match[1] };
          panel.dialog.push(dialog);
        } else if (match = line.match(/^          *(.+)*$/)){
          dialog.action = match[1];
        } else if (match = line.match(/^    Tags:$/)){
          inTags = true;
        } else {
          debugger;
          throw "Unexpected input: \""+line+"\"";
        }
      }
      return datas;
    };
    ComicData.get = function ComicDataService_get(id){
      var comic = comicData[id],
          data;
      if (!comic){
        var paddedId = '0000' + id,
            group = Math.ceil(id / 100) * 100;
        paddedId = paddedId.slice(paddedId.length - 5);
        comic = {};
        if (id < 1253) {
          comic.url = "http://freefall.purrsia.com/ff"+group+"/fv"+paddedId+".gif"
        } else {
          comic.url = "http://freefall.purrsia.com/ff"+group+"/fc"+paddedId+".png"
        }
      }
      if (data = customData[id]){
        comic.data = data;
      }
      return comic;
    };
    ComicData.hasCustomData = function ComicDataService_hasCustomData(){
      for (var p in customData){
        if (customData.hasOwnProperty(p)) return true;
      }
      return false;
    };
    ComicData.setData = function ComicDataService_set(id, data){
      var comic = ComicData.get(id);
      if (angular.equals(comic.data, data)){
        delete customData[id];
      } else {
        customData[id] = data;
      }
      localStorage.setItem(prefix + 'customData', angular.toJson(customData));
      if (!ComicData.hasCustomData()){
        localStorage.removeItem(prefix | 'customData');
      }
    };
    return ComicData;
  })
  .controller('ComicCtrl', function ComicCtrl($scope, ComicData){
    $scope.doShowData = false;
    $scope.showData = function ComicCtrl_showData(val){ $scope.doShowData = val; };

    $scope.comic = ComicData.get('1');
    $scope.indexView = 'values';
  })
  .directive('fComic', function fComicDirective(){
    return {
      restrict: 'A',
      templateUrl: 'template/comic.html',
      controller: 'ComicCtrl'
    };
  })
  .controller('AppCtrl', function AppCtrl($scope, ComicData){
    $scope.processNewData = function AppCtrl_processNewData(name, text){
      var datas = ComicData.parse(text);
      for (var data, i=0; data = datas[i]; i++){
        ComicData.setData(data.stripId, data);
      }
    };

    $scope.hasCustomData = function(){
      return ComicData.hasCustomData();
    };
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
          //var size = file.size
          reader.readAsText(file)
          return false
        });

      }
    };
  });
