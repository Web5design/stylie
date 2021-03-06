define([

  'jquery'
  ,'underscore'
  ,'backbone'
  ,'minpubsub'

  ,'src/app'
  ,'src/constants'
  ,'src/utils'

], function (

  $
  ,_
  ,Backbone
  ,MinPubSub

  ,app
  ,constant
  ,util

) {

  var $win = $(window);

  return Backbone.View.extend({

    'events': {
      'mousedown .rotation-control': 'onMousedownRotationControl'
    }

    ,'initialize': function (opts) {
      _.extend(this, opts);
      this.$el.dragon({
        'within': this.owner.$el.parent()
        ,'dragStart': _.bind(this.dragStart, this)
        ,'dragEnd': _.bind(this.dragEnd, this)
      });

      this._$crosshairContainer = this.$el.find('.crosshair-container');
      this._$cubelet = this.$el.find('.rotation-control');
      this._$cubelet
        .hide()
        .cubeletInit()
        .cubeletApplyRotationToElement(this._$crosshairContainer);

      this._$cubelet.on('change', _.bind(this.onCubeletChange, this));

      this._rotationModeStartHandle = MinPubSub.subscribe(
          constant.ROTATION_MODE_START, _.bind(this.onRotationModeStart, this));
      this._rotationModeStopHandle = MinPubSub.subscribe(
          constant.ROTATION_MODE_STOP, _.bind(this.onRotationModeStop, this));

      this.model.on('change', _.bind(this.render, this));
      this.model.on('destroy', _.bind(this.tearDown, this));
      this.render();
    }

    ,'onMousedownRotationControl': function (evt) {
      evt.stopPropagation();
    }

    ,'onRotationModeStart': function () {
      this._$cubelet.show();
    }

    ,'onRotationModeStop': function () {
      this._$cubelet.hide();
      MinPubSub.publish(constant.UPDATE_CSS_OUTPUT);
    }

    ,'onCubeletChange': function () {
      this.updateModel();
      this._$cubelet.cubeletApplyRotationToElement(this._$crosshairContainer);
    }

    ,'dragStart': function (evt, ui) {
      this.dimPathLine();
    }

    ,'dragEnd': function (evt, ui) {
      this.updateModel();
      MinPubSub.publish(constant.UPDATE_CSS_OUTPUT);
    }

    ,'render': function () {
      this.$el.css({
        'left': this.model.get('x') + 'px'
        ,'top': this.model.get('y') + 'px'
      });
      var rotationCoords = this._$cubelet.cubeletGetCoords();
      this._$cubelet.cubeletSetCoords({
        'x': this.model.get('rX')
        ,'y': this.model.get('rY')
        ,'z': this.model.get('rZ')
      });
      this._$cubelet.cubeletApplyRotationToElement(this._$crosshairContainer);
    }

    ,'updateModel': function () {
      var rotationCoords = this._$cubelet.cubeletGetCoords();
      var pxTo = util.pxToNumber;
      this.model.set({
        'x': pxTo(this.$el.css('left'))
        ,'y': pxTo(this.$el.css('top'))
        ,'rX': rotationCoords.x
        ,'rY': rotationCoords.y
        ,'rZ': rotationCoords.z
      });
      MinPubSub.publish(constant.PATH_CHANGED);
      this.model.trigger('change');
      app.kapi.update();
    }

    ,'dimPathLine': function () {
      app.view.canvas.backgroundView.update(true);
    }

    ,'tearDown': function () {
      this._$crosshairContainer.remove();
      this._$cubelet.remove();
      this.remove();
      MinPubSub.unsubscribe(this._rotationModeStartHandle);
      MinPubSub.unsubscribe(this._rotationModeStopHandle);
      util.deleteAllProperties(this);
    }

  });

});
