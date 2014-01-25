describe('ComicData service', function(){
  var data = {
        11: { stripId: 11, panels: [] },
        12: { stripId: 12 }
      },
      $window, $httpBackend, ComicData;

  beforeEach(module('freefall', function($provide){
    var $window = {
      localStorage: {
        getItem: function(){ },
        setItem: function(){ },
        removeItem: function(){ }
      }
    }
    $provide.value('$window', $window);
  }));
  beforeEach(inject(function($injector){
    $window = $injector.get('$window');
    $httpBackend = $injector.get('$httpBackend');

    $httpBackend.when('GET', 'data.json').respond(data);
    spyOn($window.localStorage, 'getItem').andReturn(angular.toJson({
      11: { something: 'something' },
      14: { something: 'something' }
    }));
    ComicData = $injector.get('ComicData');
  }));

  describe('get(id)', function(){
    it('returns a promise for a comic', function(){
      var comic = ComicData.get(12),
          promiseResolved = false;
      expect(comic.then).toBeDefined();

      comic.then(function(actual){
        expect(actual).toEqual({ stripId: 12 })
        promiseResolved = true;
      });

      $httpBackend.flush();

      expect(promiseResolved).toBe(true);
    });

    it('is populated with changes from local storage', function(){
      var promiseResolved = false;
      ComicData.get(11).then(function(comic){
        expect(comic.something).toEqual('something');
        promiseResolved = true;
      });
      $httpBackend.flush();
      expect(promiseResolved).toBe(true);
    });

    it('resolves to a copy that can be safely modified', function(){
      var promiseResolved = false;
      ComicData.get(11).then(function(comic1){
        comic1.panels = [ { index: 1 } ];

        ComicData.get(11).then(function(comic2){
          promiseResolved = true;

          expect(comic2.panels.length).toBe(0);
        });
      });
      $httpBackend.flush();
      expect(promiseResolved).toBe(true);
    });

    it('resolves to a copy from localStorage, if there is no server data', function(){
      var promiseResolved = false;
      ComicData.get(14).then(function(){
        promiseResolved = true;
      });
      expect(function(){
        $httpBackend.flush();
      }).not.toThrow();
      expect(promiseResolved).toBe(true);
    });

    it('resolves to undefined, if comic is not found', function(){
      var promiseResolved = false;
      ComicData.get(13).then(function(comic){
        expect(comic).toBeUndefined();
        promiseResolved = true;
      });
      $httpBackend.flush();
      expect(promiseResolved).toBe(true);
    });
  });

  describe('all()', function(){
    it('gives a promise for all comic data', function(){
      var promiseResolved = false;
      ComicData.all().then(function(comics){
        var expectedComics = {},
            store = angular.fromJson($window.localStorage.getItem());
        for (var p in data){
          expectedComics[p] = angular.extend({}, data[p], store[p]);
        }
        expect(comics).toEqual(expectedComics);
        promiseResolved = true;
      });
      $httpBackend.flush();
      expect(promiseResolved).toBe(true);
    });
  });

  describe('set(id, data)', function(){
    it('persists the data for the next get(id)', function(){
      var promiseResolved = false;
      ComicData.set(12, { prop: 'prop' });

      ComicData.get(12).then(function(comic2){
        expect(comic2.prop).toEqual('prop');
        promiseResolved = true;
      });
      $httpBackend.flush();
      expect(promiseResolved).toBe(true);
    });

    it('saves differences from server data to localStorage', function(){
      spyOn($window.localStorage, 'setItem')
      var expectedLocalStore = angular.toJson(angular.extend({},
          angular.fromJson($window.localStorage.getItem('the key')),
          {
            12: { prop: 'prop' }
          }));
      ComicData.set(12, { prop: 'prop' });

      $httpBackend.flush();

      expect($window.localStorage.setItem).toHaveBeenCalledWith(jasmine.any(String), expectedLocalStore);
    });

    it('removes the comic from the localStorage if there is no difference from server', function(){
      spyOn($window.localStorage, 'setItem')
      ComicData.set(12, data[12]);

      $httpBackend.flush();

      expect($window.localStorage.setItem).toHaveBeenCalledWith(jasmine.any(String), $window.localStorage.getItem('the key'));
    });

    it('clears the localStorage if all changes are identical to server', function(){
      spyOn($window.localStorage, 'removeItem')
      ComicData.set(11, data[11]);
      ComicData.set(12, data[12]);
      ComicData.set(14, data[14]);

      $httpBackend.flush();

      expect($window.localStorage.removeItem).toHaveBeenCalledWith(jasmine.any(String));
    });
  });

  it('hasCustomData()', function(){
    expect(ComicData.hasCustomData()).toBe(true);

    ComicData.set(11, data[11]);
    ComicData.set(14, data[14]);
    $httpBackend.flush();

    expect(ComicData.hasCustomData()).toBe(false);
  });

  it('has customData set to the custom data', function(){
    var store = angular.fromJson($window.localStorage.getItem());
    expect(ComicData.customData).toEqual(store);
  });


  describe('parse(input)', function(){
    it('converts string data to json data', function(){
      var dataInput = "\r\n"+
            "\r\n"+
            "~1998~\r\n"+
            "\r\n"+
            "\r\n"+
            "\r\n"+
            "~The adventure begins!~\r\n"+
            "\r\n"+
            "\r\n"+
            "\r\n"+
            "_ _ _ 1st day, Thursday _ _ _\r\n"+
            "\r\n"+
            "\r\n"+
            "    # 0001\r\n"+
            "\r\n"+
            "\r\n"+
            "          ->, Sam's ship-\r\n"+
            "\r\n"+
            "        * #1\r\n"+
            "          Sam & Helix:\r\n"+
            "          *walk along talking*\r\n"+
            "          Helix:\r\n"+
            "          *looks at Sam*\r\n"+
            "          We're really getting an engineer, Sam?\r\n"+
            "          Sam:\r\n"+
            "          *turns to Helix*\r\n"+
            "          We need one, Helix.\r\n"+
            "\r\n"+
            "        * #2\r\n"+
            "          Sam:\r\n"+
            "          *looks at thin air, hopeful*\r\n"+
            "          With an engineer on board, we may finally get our starship flying again.\r\n"+
            "\r\n"+
            "        * #3\r\n"+
            "          Helix:\r\n"+
            "          *reminds Sam*\r\n"+
            "          We almost got it flying last month.\r\n"+
            "          Sam:\r\n"+
            "          *looks down, sad*\r\n"+
            "          Yes. It's a shame the parade commitee made us give their balloons back.\r\n"+
            "\r\n"+
            "    Tags:\r\n"+
            "    �masochist�\r\n"+
            "Remote.\r\n"+
            "\r\n"+
            "\r\n"+
            "\r\n"+
            "\r\n";
      var expected = {
            year: 1998,
            chapter: "The adventure begins!",
            dayDescription: "1st day, Thursday",
            place: ">, Sam's ship",
            stripId: 1,
            tags: [ "masochist", "Remote." ]
          },
          expectedPanels = [
            { index: 1, dialog: [
              { character: 'Sam & Helix', action: 'walk along talking' },
              { character: 'Helix', action: 'looks at Sam', text: "We're really getting an engineer, Sam?" },
              { character: 'Sam', action: 'turns to Helix', text: "We need one, Helix." }
            ] },
            { index: 2, dialog: [
              { character: 'Sam', action: 'looks at thin air, hopeful', text: "With an engineer on board, we may finally get our starship flying again." }
            ] },
            { index: 3, dialog: [
              { character: 'Helix', action: 'reminds Sam', text: "We almost got it flying last month." },
              { character: 'Sam', action: 'looks down, sad', text: "Yes. It's a shame the parade commitee made us give their balloons back." }
            ] }
          ],
          actual = ComicData.parse(dataInput)[0];
      for (var prop in expected){
        expect(actual[prop]).toEqual(expected[prop]);
      }
      expect(actual.panels.length).toEqual(3);
      for (var i=0; i < expectedPanels.length; i++){
        for (var prop in expectedPanels[i]){
          expect(actual.panels[i][prop]).toEqual(expectedPanels[i][prop]);
        }
      }
    });
  });

  describe('format(data)', function(){
    it('converts json data to string data', function(){
      var dataJson = {
            year: 1998,
            chapter: "The adventure begins!",
            dayDescription: "1st day, Thursday",
            place: ">, Sam's ship",
            stripId: 1,
            tags: [ "masochist", "Remote." ],
            panels: [
              { index: 1, dialog: [
                { character: 'Sam & Helix', action: 'walk along talking' },
                { character: 'Helix', action: 'looks at Sam', text: "We're really getting an engineer, Sam?" },
                { character: 'Sam', action: 'turns to Helix', text: "We need one, Helix." }
              ] },
              { index: 2, dialog: [
                { character: 'Sam', action: 'looks at thin air, hopeful', text: "With an engineer on board, we may finally get our starship flying again." }
              ] },
              { index: 3, dialog: [
                { character: 'Helix', action: 'reminds Sam', text: "We almost got it flying last month." },
                { character: 'Sam', action: 'looks down, sad', text: "Yes. It's a shame the parade commitee made us give their balloons back." }
              ] }
            ]
          };
      expect(ComicData.format([dataJson])).toEqual("\r\n"+
        "\r\n"+
        "~1998~\r\n"+
        "\r\n"+
        "\r\n"+
        "\r\n"+
        "~The adventure begins!~\r\n"+
        "\r\n"+
        "\r\n"+
        "\r\n"+
        "_ _ _ 1st day, Thursday _ _ _\r\n"+
        "\r\n"+
        "\r\n"+
        "    # 0001\r\n"+
        "\r\n"+
        "\r\n"+
        "          ->, Sam's ship-\r\n"+
        "\r\n"+
        "        * #1\r\n"+
        "          Sam & Helix:\r\n"+
        "          *walk along talking*\r\n"+
        "          Helix:\r\n"+
        "          *looks at Sam*\r\n"+
        "          We're really getting an engineer, Sam?\r\n"+
        "          Sam:\r\n"+
        "          *turns to Helix*\r\n"+
        "          We need one, Helix.\r\n"+
        "\r\n"+
        "        * #2\r\n"+
        "          Sam:\r\n"+
        "          *looks at thin air, hopeful*\r\n"+
        "          With an engineer on board, we may finally get our starship flying again.\r\n"+
        "\r\n"+
        "        * #3\r\n"+
        "          Helix:\r\n"+
        "          *reminds Sam*\r\n"+
        "          We almost got it flying last month.\r\n"+
        "          Sam:\r\n"+
        "          *looks down, sad*\r\n"+
        "          Yes. It's a shame the parade commitee made us give their balloons back.\r\n"+
        "\r\n"+
        "    Tags:\r\n"+
        "masochist\r\n"+
        "Remote.\r\n"+
        "\r\n"+
        "\r\n"+
        "\r\n"+
        "\r\n");
    });

    it('does not throw for incomplete data', function(){
      expect(function(){
        ComicData.format([{}]);
      }).not.toThrow();
    });
  });
});
