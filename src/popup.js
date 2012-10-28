goog.provide('annotorious.viewer');

goog.require('goog.style');
goog.require('goog.dom');
goog.require('goog.dom.query');

/**
 * A popup bubble widget to show annotation details.
 * @param {element} parentEl the DOM element to attach to
 * @param {annotorious.modules.image.ImageAnnotator} annotator reference to the annotator
 * @constructor
 */
annotorious.viewer.Popup = function(parentEl, annotator) {
  /** @private **/
  this._annotator = annotator;  
  
  /** @private **/
  this._element = goog.soy.renderAsElement(annotorious.templates.popup);
  
  /** @private **/
  this._currentAnnotation;

  /** @private **/
  this._text = goog.dom.query('.yuma-popup-text', this._element)[0];

  /** @private **/
  this._buttons = goog.dom.query('.yuma-popup-action-delete', this._element)[0];
  
  /** @private **/
  this._popupHideTimer;
  
  /** @private **/
  this._buttonHideTimer;

  /** @private **/
  this._cancelHide = false;

  var btnDelete = goog.dom.query('.yuma-popup-action-delete', this._element)[0];

  var self = this;
  goog.events.listen(btnDelete, goog.events.EventType.CLICK, function(event) {
    goog.style.setOpacity(self._element, 0.0); 
    annotator.fireEvent(annotorious.events.EventType.POPUP_BTN_DELETE,
      { annotation: self._currentAnnotation, mouseEvent: event });
  });
  
  goog.events.listen(this._buttons, goog.events.EventType.MOUSEOVER, function(event) {
    goog.style.setOpacity(self._buttons, 0.9);
  });
  
  goog.events.listen(this._buttons, goog.events.EventType.MOUSEOUT, function() {
    goog.style.setOpacity(self._buttons, 0.4);
  });
  
  goog.events.listen(this._element, goog.events.EventType.MOUSEOVER, function(event) {
    window.clearTimeout(self._buttonHideTimer);
    if (goog.style.getStyle(self._buttons, 'opacity') < 0.4)
      goog.style.setOpacity(self._buttons, 0.4);
    self.clearHideTimer();
  });
  
  goog.events.listen(this._element, goog.events.EventType.MOUSEOUT, function(event) {
    goog.style.setOpacity(self._buttons, 0);
    self.startHideTimer();
  });
    
  goog.style.setOpacity(this._buttons, 0.0);
  goog.style.setOpacity(this._element, 0.0);
  goog.dom.appendChild(parentEl, this._element);
}

/**
 * Start the popup hide timer.
 */
annotorious.viewer.Popup.prototype.startHideTimer = function() {
  this._cancelHide = false;
  if (!this._popupHideTimer) {
    var self = this;
    this._popupHideTimer = window.setTimeout(function() {
      self._annotator.fireEvent(annotorious.events.EventType.BEFORE_POPUP_HIDE);
      if (!self._cancelHide) {
        goog.style.setOpacity(self._element, 0.0);
        goog.style.setOpacity(self._buttons, 0.4);
        delete self._popupHideTimer;
      }
    }, 300);
  }
}

/**
 * Clear the popup hide timer.
 */
annotorious.viewer.Popup.prototype.clearHideTimer = function() {
  this._cancelHide = true;
  if (this._popupHideTimer) {
    window.clearTimeout(this._popupHideTimer);
    delete this._popupHideTimer;
  }
}

/**
 * Show the popup, loaded with the specified annotation, at the specified coordinates.
 * @param {Object} annotation the annotation
 * @param {number} x coordinate (relative to the image)
 * @param {number} y coordiante (relative to the image)
 */
annotorious.viewer.Popup.prototype.show = function(annotation, x, y) {
  this.clearHideTimer();
  
  if (annotation && x && y) {
    // New annotation and position - reset
    this._currentAnnotation = annotation;
    this._text.innerHTML = annotorious.viewer.Popup.toHTML(annotation.text);
    this.setPosition(x, y);
    
    if (this._buttonHideTimer)
      window.clearTimeout(this._buttonHideTimer);
      
    goog.style.setOpacity(this._buttons, 0.4);
    var self = this;
    this._buttonHideTimer = window.setTimeout(function() {
      goog.style.setOpacity(self._buttons, 0);
    }, 1000);
  }

  goog.style.setOpacity(this._element, 0.9); 
}

/**
 * Set the position of the popup.
 * @param {number} x coordinate (relative to the image)
 * @param {number} y coordinate (realtive to the image)
 */
annotorious.viewer.Popup.prototype.setPosition = function(x, y) {
  goog.style.setPosition(this._element, new goog.math.Coordinate(x, y));
}

annotorious.viewer.Popup.toHTML = function(text) {
  var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return text.replace(exp,"<a href=\"$1\" target=\"blank\">$1</a>"); 
}

