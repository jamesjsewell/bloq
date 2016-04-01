// d
console.log('hey code')

// modify prototypes

Array.prototype.choice = function() {
	var index = Math.floor(Math.random() * this.length)
	return this[index]
}

// constructors

var Block = function(x,y) {
	this.x = x 
	this.y = y
	this.side = sqSide
	return this
}

Block.prototype = {
	fill: function(){
		c2d.fillRect(this.x,this.y,this.side,this.side)
		c2d.strokeRect(this.x,this.y,this.side,this.side)
	},
	setColor: function(color) {
		c2d.fillStyle = color
		this.color = color
	}
}


var canvas = document.querySelector("#gridCanvas"),
	gridWidth = canvas.width,
	gridHeight = canvas.height,
	sqSide = gridWidth / 4,
	colors = ['#2A4F6E','#4C2D73']

c2d = canvas.getContext('2d')
window.c2d = c2d
c2d.strokeStyle = "#ddd"

var y = 0,
	x

while (y <= gridHeight - sqSide) {
	x = 0
	while (x <= gridWidth - sqSide) {
		var b = new Block(x,y)
		b.setColor(colors.choice())
		b.fill()
		x += sqSide
	}
	y += sqSide
}
