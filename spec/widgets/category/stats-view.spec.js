var cdb = require('cartodb.js');
var CategoryWidgetModel = require('../../../src/widgets/category/category-widget-model');
var StatsView = require('../../../src/widgets/category/stats/stats-view');

describe('widgets/category/stats-view', function () {
  beforeEach(function () {
    var vis = cdb.createVis(document.createElement('div'), {
      datasource: {
        maps_api_template: 'asd',
        user_name: 'pepe'
      },
      layers: [{
        type: 'torque'
      }]
    });
    this.dataviewModel = vis.dataviews.createCategoryDataview(vis.map.layers.first(), {});
    this.widgetModel = new CategoryWidgetModel({}, {
      dataviewModel: this.dataviewModel
    });
    this.view = new StatsView({
      widgetModel: this.widgetModel,
      dataviewModel: this.dataviewModel
    });
  });

  describe('render', function () {
    it('should render properly data stats', function () {
      this.view.render();
      expect(this.view.$('.CDB-Widget-infoCount').length).toBe(2);
    });

    it('should say "of total" words when it is rendered', function () {
      this.dataviewModel._data.reset([
        { name: 'ES', agg: false, value: 2 },
        { name: 'FR', agg: false, value: 2 },
        { name: 'Other', agg: true, value: 1 }
      ]);
      this.view.render();
      expect(this.view.$('.CDB-Widget-infoDescription:eq(1)').text()).toContain('of total');
    });

    describe('search', function () {
      it('should show number of results when a search is applied', function () {
        spyOn(this.widgetModel, 'isSearchEnabled').and.returnValue(true);
        spyOn(this.dataviewModel, 'isSearchApplied').and.returnValue(true);
        spyOn(this.dataviewModel, 'getSearchCount').and.returnValue(10);
        this.view.render();
        expect(this.view.$('.CDB-Widget-infoCount').length).toBe(1);
        var totalString = this.view.$('.CDB-Widget-infoCount').text() + ' ' + this.view.$('.CDB-Widget-infoDescription').text();
        expect(totalString).toContain('10 found');
      });

      it('should nothing when search is enabled but not applied', function () {
        spyOn(this.widgetModel, 'isSearchEnabled').and.returnValue(true);
        spyOn(this.dataviewModel, 'isSearchApplied').and.returnValue(false);
        this.view.render();
        expect(this.view.$('.CDB-Widget-infoCount').length).toBe(0);
      });
    });
  });

  describe('bind', function () {
    beforeEach(function () {
      spyOn(this.dataviewModel, 'bind');
      spyOn(this.widgetModel, 'bind');
      this.view._initBinds();
    });

    it('should render when any of this events are triggered from data dataviewModel', function () {
      var bind = this.dataviewModel.bind.calls.argsFor(0);
      expect(bind[0]).toContain('change:data');
      expect(bind[0]).toContain('change:totalCount');
      expect(bind[1]).toEqual(this.view.render);
    });

    it('should render when search or locked is enabled/disabled', function () {
      var bind = this.widgetModel.bind.calls.argsFor(0);
      expect(bind[0]).toContain('change:search');
      expect(bind[0]).toContain('change:locked');
      expect(bind[1]).toEqual(this.view.render);
    });
  });
});
