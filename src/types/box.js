// Box Annotation implementation
module.exports = function(Chart) {
  var chartHelpers = Chart.helpers;
  var helpers = require("../helpers.js")(Chart);
  var horizontalKeyword = "horizontal";

  var BoxAnnotation = Chart.Annotation.Element.extend({
    setDataLimits: function() {
      var model = this._model;
      var options = this.options;
      var chartInstance = this.chartInstance;

      var xScale = chartInstance.scales[options.xScaleID];
      var yScale = chartInstance.scales[options.yScaleID];
      var chartArea = chartInstance.chartArea;

      // Set the data range for this annotation
      model.ranges = {};

      if (!chartArea) {
        return;
      }

      var min = 0;
      var max = 0;

      if (xScale && xScale.type !== "time") {
        min = helpers.isValid(options.xMin)
          ? options.xMin
          : xScale.getPixelForValue(chartArea.left);
        max = helpers.isValid(options.xMax)
          ? options.xMax
          : xScale.getPixelForValue(chartArea.right);

        model.ranges[options.xScaleID] = {
          min: Math.min(min, max),
          max: Math.max(min, max)
        };
      }

      if (yScale) {
        min = helpers.isValid(options.yMin)
          ? options.yMin
          : yScale.getPixelForValue(chartArea.bottom);
        max = helpers.isValid(options.yMax)
          ? options.yMax
          : yScale.getPixelForValue(chartArea.top);

        model.ranges[options.yScaleID] = {
          min: Math.min(min, max),
          max: Math.max(min, max)
        };
      }
    },
    configure: function() {
      var model = this._model;
      var options = this.options;
      var chartInstance = this.chartInstance;
      var ctx = chartInstance.chart.ctx;

      var xScale = chartInstance.scales[options.xScaleID];
      var yScale = chartInstance.scales[options.yScaleID];
      var chartArea = chartInstance.chartArea;

      // clip annotations to the chart area
      model.clip = {
        x1: chartArea.left,
        x2: chartArea.right,
        y1: chartArea.top,
        y2: chartArea.bottom
      };

      var left = chartArea.left;
      var top = chartArea.top;
      var right = chartArea.right;
      var bottom = chartArea.bottom;

      var min, max;

      if (xScale) {
        min = helpers.isValid(options.xMin) ? xScale.getPixelForValue(options.xMin) : chartArea.left;
        max = helpers.isValid(options.xMax) ? xScale.getPixelForValue(options.xMax) : chartArea.right;
        left = Math.min(min, max);
        right = Math.max(min, max);
      }

      if (yScale) {
        min = helpers.isValid(options.yMin) ? yScale.getPixelForValue(options.yMin, options.yMin) : chartArea.bottom;
        max = helpers.isValid(options.yMax) ? yScale.getPixelForValue(options.yMax, options.yMax) : chartArea.top;
        top = Math.min(min, max);
        bottom = Math.max(min, max);
      }

      // Ensure model has rect coordinates
      model.left = left;
      model.top = top;
      model.right = right;
      model.bottom = bottom;

      // if we passed in the same left and right points, use the same width has height
      if (model.left === model.right) {
        model.left -= (model.bottom - model.top) / 2;
        model.right += (model.bottom - model.top) / 2;
      }

      // Stylistic options
      model.borderColor = options.borderColor;
      model.borderWidth = options.borderWidth;
      model.backgroundColor = options.backgroundColor;
      
      if (isNaN(min)) {
        return;
      }

      if (this.options.mode == horizontalKeyword) {
        model.x1 = chartArea.left;
        model.x2 = chartArea.right;
        model.y1 = min;
        model.y2 = max;
      } else {
        model.y1 = chartArea.top;
        model.y2 = chartArea.bottom;
        model.x1 = min;
        model.x2 = max;
      }

      model.line = new LineFunction(model);
      model.mode = options.mode;

      // Figure out the label:
      model.labelBackgroundColor = options.label.backgroundColor;
      model.labelFontFamily = options.label.fontFamily;
      model.labelFontSize = options.label.fontSize;
      model.labelFontStyle = options.label.fontStyle;
      model.labelFontColor = options.label.fontColor;
      model.labelXPadding = options.label.xPadding;
      model.labelYPadding = options.label.yPadding;
      model.labelCornerRadius = options.label.cornerRadius;
      model.labelPosition = "topLeft";
      model.labelXAdjust = options.label.xAdjust;
      model.labelYAdjust = options.label.yAdjust;
      model.labelEnabled = options.label.enabled;
      model.labelContent = options.label.content;

      ctx.font = chartHelpers.fontString(
        model.labelFontSize,
        model.labelFontStyle,
        model.labelFontFamily
      );
      var textWidth = ctx.measureText(model.labelContent).width;
      var textHeight = ctx.measureText("M").width;

      model.labelWidth = textWidth + 1 * model.labelXPadding;
      model.labelHeight = textHeight + 2 * model.labelYPadding;

      model.borderDash = options.borderDash || [];
      model.borderDashOffset = options.borderDashOffset || 0;
    },
    inRange: function(mouseX, mouseY) {
      var model = this._model;
      return (
        model &&
        mouseX >= model.left &&
        mouseX <= model.right &&
        mouseY >= model.top &&
        mouseY <= model.bottom
      );
    },
    getCenterPoint: function() {
      var model = this._model;
      return {
        x: (model.right + model.left) / 2,
        y: (model.bottom + model.top) / 2
      };
    },
    getWidth: function() {
      var model = this._model;
      return Math.abs(model.right - model.left);
    },
    getHeight: function() {
      var model = this._model;
      return Math.abs(model.bottom - model.top);
    },
    getArea: function() {
      return this.getWidth() * this.getHeight();
    },
    draw: function() {
      var view = this._view;
      var ctx = this.chartInstance.chart.ctx;

      ctx.save();

      // Canvas setup
      ctx.beginPath();
      ctx.rect(
        view.clip.x1,
        view.clip.y1,
        view.clip.x2 - view.clip.x1,
        view.clip.y2 - view.clip.y1
      );
      ctx.clip();

      // Draw
      var width = view.right - view.left;
      var height = view.bottom - view.top;

      // draw the milestone
      ctx.lineWidth = view.borderWidth;
      ctx.strokeStyle = view.borderColor;
      ctx.fillStyle = view.backgroundColor;

      // // the lines below fill as a box
      if (!view.Shape) {
        ctx.fillRect(view.left, view.top, width, height);
        ctx.strokeRect(view.left, view.top, width, height);
      }

      // draw the label
      if (view.labelEnabled && view.labelContent) {
        ctx.beginPath();
        ctx.rect(
          view.clip.x1,
          view.clip.y1,
          view.clip.x2 - view.clip.x1,
          view.clip.y2 - view.clip.y1
        );
        ctx.clip();
        // Draw the text
        ctx.font = chartHelpers.fontString(
          view.labelFontSize,
          view.labelFontStyle,
          view.labelFontFamily
        );
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = view.labelFontColor;
        ctx.fillText(
          view.labelContent,
          view.left + view.labelXPadding,
          view.top + 2 * view.labelYPadding
        );
      }
      ctx.restore();
    }
  });

  function LineFunction(view) {
    // Describe the line in slope-intercept form (y = mx + b).
    // Note that the axes are rotated 90° CCW, which causes the
    // x- and y-axes to be swapped.
    var m = (view.x2 - view.x1) / (view.y2 - view.y1);
    var b = view.x1 || 0;

    this.m = m;
    this.b = b;

    this.getX = function(y) {
      // Coordinates are relative to the origin of the canvas
      return m * (y - view.y1) + b;
    };

    this.getY = function(x) {
      return (x - b) / m + view.y1;
    };

    this.intersects = function(x, y, epsilon) {
      epsilon = epsilon || 0.001;
      var dy = this.getY(x),
        dx = this.getX(y);
      return (
        (!isFinite(dy) || Math.abs(y - dy) < epsilon) &&
        (!isFinite(dx) || Math.abs(x - dx) < epsilon)
      );
    };
  }

  return BoxAnnotation;
};
