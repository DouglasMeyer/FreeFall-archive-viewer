describe('ComicData service', function(){
  beforeEach(module('freefall'));

  describe('get(id)', function(){
    var data = {
          11: { stripId: 11 },
          12: { stripId: 12 }
        },
        localChanges = {
          11: { something: 'something' }
        },
        $httpBackend, ComicData;

    beforeEach(module(function($provide){
      var $window = {
        localStorage: {
          getItem: function(){ }
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
});
