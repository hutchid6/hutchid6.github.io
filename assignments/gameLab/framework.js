/**
* Represents a rectangle on a canvas
* @param x x coordinate
* @param y y coordinate
* @param w width
* @param h height
* @param color background color (String)
*/
Rectangle = function(x, y, w, h, color)
{
  // default: Rectangle(0, 0, 50, 50)
	this.x = x != null ? x : 0;
	this.y = y != null ? y : 0;
	this.width = w != null ? w : 50;
	this.height = h != null ? h : 50;

  /**
  * Determines if this Rectangle contains an (x,y) point
  * @param x x coordinate to check
  * @param y y coordinate to check
  */
	this.contains = function(x, y)
	{
		if (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height)
			return true;
		else
			return false;
	};

  /**
  * Determines if this Rectangle intersects another Rectangle
  * @param rect the Rectangle to check for intersection
  */
	this.intersects = function(rect)
	{
		if (this.contains(rect.x, rect.y)
        || this.contains(rect.x + rect.width, rect.y)
        || this.contains(rect.x, rect.y + rect.height)
        || this.contains(rect.x + rect.width, rect.y + rect.height))
			return true;
		else if (rect.contains(this.x, this.y)
        || rect.contains(this.x + this.width, this.y)
        || rect.contains(this.x, this.y + this.height)
        || rect.contains(this.x + this.width, this.y + this.height))
			return true;

		return false;
	};

  /**
  * Draws this Rectangle onto the canvas
  * @param ctx the canvas context to draw on
  * @param color the color to fill the rectangle with
  * @param offset optional parameter for applting an offset
  */
	this.draw = function(ctx, color, offset)
	{
    var off = offset || {x:0, y:0}; // default no offset
		ctx.fillStyle = color;
		ctx.fillRect(this.x + off.x, this.y + off.y, this.width, this.height);
	};
};

/**
* Erases part of the canvas based on a Rectangle object
* @param ctx the canvas context to erase on
* @param rect the Rectangle to clear
*/
function clearRect(ctx, rect)
{
  ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
}
