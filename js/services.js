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

  try {
    customData = angular.fromJson(
      $window.localStorage.getItem(prefix + 'customData') || '{}'
    );
  } catch(e) {
    customData = {};
  }

  ComicData.get = function ComicData_get(id){
    return dataRequest.then(function(data){
      var serverComic = data[id],
          customComic = customData[id];
      if (!serverComic && !customComic) return;
      var comic = angular.copy(serverComic || {});
      angular.extend(comic, customComic);
      return comic;
    });
  };

  ComicData.all = function ComicData_all(){
    return dataRequest.then(function(data){
      var allData = {};
      for (var p in serverData){
        allData[p] = angular.extend({}, serverData[p], customData[p]);
      }
      return allData;
    });
  };

  ComicData.set = function ComicData_set(id, data){
    dataRequest.then(function(){
      var comic = angular.extend({}, data);
      for (var prop in comic){
        if (comic.hasOwnProperty(prop) && angular.equals(comic[prop], (serverData[id] || {})[prop])){
          delete comic[prop];
        }
      }
      if (Object.keys(comic).length === 0){
        delete customData[id];
      } else {
        customData[id] = comic;
      }
      if (Object.keys(customData).length === 0){
        $window.localStorage.removeItem(prefix + 'customData');
      } else {
        $window.localStorage.setItem(prefix + 'customData', angular.toJson(customData));
      }
    });
  };

  ComicData.hasCustomData = function ComicData_hasCustomData(){
    return Object.keys(customData).length !== 0;
  };

  ComicData.customData = customData;

  ComicData.parse = function ComicData_parse(string){
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
        year = parseInt(match[1], 10);
      } else if (match = line.match(/^~(.*)~$/)){
        chapter = match[1];
      } else if (match = line.match(/^_ _ _ (.*) _ _ _$/)){
        dayDescription = match[1];
      } else if (match = line.match(/^    # (\d{4})$/)){
        data = { year: year, chapter: chapter, dayDescription: dayDescription, panels: [], tags: [] };
        dayDescription = undefined;
        inTags = false;
        datas.push(data);
        data.stripId = parseInt(match[1], 10);
      } else if (match = line.match(/^          -(.*)-$/)){ //FIXME: "->, " means something
        data.place = match[1];
      } else if (match = line.match(/^        \* #(\d+)$/)){
        panel = { index: parseInt(match[1], 10), dialog: [] };
        data.panels.push(panel);
      } else if (match = line.match(/^          (.+):$/)){
        dialog = { character: match[1], action: 'says' };
        panel.dialog.push(dialog);
      } else if (match = line.match(/^          \*(.+)\*$/)){
        dialog.action = match[1];
      } else if (match = line.match(/^          (.+)$/)){
        dialog.text = match[1];
      } else if (match = line.match(/^    Tags:$/)){
        inTags = true;
      } else if (inTags){
        data.tags.push(line);
      } else {
        console.log("Unexpected input ("+i+"): \""+line+"\"");
      }
    }
    return datas;
  };

  ComicData.format = function ComicData_format(jsons){
    var output = [''];
    for (var id in jsons){
      var data = jsons[id],
          stripId = '000' + data.stripId;
      stripId = stripId.slice(stripId.length - 4);
      output.push("");
      output.push("~"+data.year+"~");
      output.push("");
      output.push("");
      output.push("");
      output.push("~"+data.chapter+"~");
      output.push("");
      output.push("");
      output.push("");
      output.push("_ _ _ "+data.dayDescription+" _ _ _");
      output.push("");
      output.push("");
      output.push("    # "+stripId);
      output.push("");
      output.push("");
      output.push("          -"+data.place+"-");
      for (var i=0, panel; panel = (data.panels || [])[i]; i++){
        output.push("");
        output.push("        * #"+(i+1));
        for (var j=0, dialog; dialog = panel.dialog[j]; j++){
          output.push("          "+dialog.character+":");
          if (dialog.action != 'says'){
            output.push("          *"+dialog.action+"*");
          }
          if (dialog.text){
            output.push("          "+dialog.text);
          }
        }
      }
      output.push("");
      output.push("    Tags:");
      for (var i=0, tag; tag = (data.tags || [])[i]; i++){
        output.push(tag);
      }
      output.push("");
      output.push("");
      output.push("");
      output.push("");
      output.push("");
    }
    return output.join("\r\n");
  };

  return ComicData;
});
