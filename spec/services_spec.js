describe('ComicData service', function(){
  var data = {
        11: { stripId: 11 },
        12: { stripId: 12 }
      },
      localChanges = {
        11: { something: 'something' }
      },
      $httpBackend, ComicData;

  beforeEach(module('freefall', function($provide){
    var $window = {
      localStorage: {
        getItem: function(){ },
        setItem: function(){ }
      }
    }
    $provide.value('$window', $window);
    spyOn($window.localStorage, 'getItem').andReturn(localChanges);
  }));
  beforeEach(inject(function($injector){
    $httpBackend = $injector.get('$httpBackend');
    ComicData = $injector.get('ComicData');
    $httpBackend.when('GET', 'data.json').respond(data);
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

    it('saves differences from server data to localStorage', inject(function($window){
      spyOn($window.localStorage, 'setItem')
      var expectedLocalStore = angular.extend({}, localChanges, {
        12: { prop: 'prop' }
      });
      ComicData.set(12, { prop: 'prop' });

      $httpBackend.flush();

      expect($window.localStorage.setItem).toHaveBeenCalledWith(jasmine.any(String), expectedLocalStore);
    }));
  });
});
