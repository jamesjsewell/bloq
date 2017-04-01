"use strict;"

// PROTOTYPE MODS
;(function(){
	Object.prototype.extend = function(attrs) {
		var newObj = {}
		for (var key in this) {
			newObj[key] = this[key]
		}
		for (var key in attrs) {
			if (attrs.hasOwnProperty(key)) newObj[key] = attrs[key]
		}
		return newObj
	}

	Object.prototype.choice = function() {
		if (this instanceof Array) {
			var index = Math.floor(Math.random() * this.length)
			return this[index]
		}
		else {
			return this.values().choice()
		} 
	}

	Object.prototype.values = function() {
		var output = []
		for (var key in this)  {
			if (this.hasOwnProperty(key)) {
				output.push(this[key])
			}
		}
		return output
	}

	Array.prototype.remove = function(el) {
		var i = this.indexOf(el)
		return this.slice(0,i).concat(this.slice(i + 1))
	}

	String.prototype.contains = function(substr) {
		return this.indexOf(substr) !== -1
	}

	Node.prototype.clearChildren = function(){
		while (this.childNodes.length > 0) {
			this.removeChild(this.childNodes[0])
		}
	}

	NodeList.prototype.forEach = HTMLCollection.prototype.forEach = Array.prototype.forEach
	NodeList.prototype.map = HTMLCollection.prototype.map = Array.prototype.map
	NodeList.prototype.indexOf = HTMLCollection.prototype.indexOf = Array.prototype.indexOf	
	NodeList.prototype.reverse = HTMLCollection.prototype.reverse = Array.prototype.reverse = function(){
		var newArray = []
		for (var i = (this.length - 1); i >= 0; i --) {
			newArray.push(this[i])
		}
		return newArray
	}	
})();

var CONSTANTS = {
	numeralToWord: {
		4:"four",
		5:"five",
		6:"six",
		7:"seven",
		8:"eight",
		9:"nine",
		10:"ten",
		11:"eleven",
		12:"twelve",
		13:"thirteen"
	},
	colors: {
		red: 'rgb(170, 77, 57)',
		blue: 'rgb(39, 88, 107)'
	},
	dropIncr: 12,
	fadeIncr: .08,
	invertSpeed: 20,
	rotateIncr: 2.88
}

var EVENTS = {
	eventMap: {},
	off: function(evt,cb) {
		if (cb) {
			this.eventMap[evt] = this.eventMap[evt].remove(cb)
		}
		else {
			this.eventMap[evt] = []
		}
	},
	on: function(evt,cb) {
		if (this.eventMap[evt]) {
			this.eventMap[evt].push(cb)
		}
		else {
			this.eventMap[evt] = [cb]
		}
	},
	trigger: function(evt,arg) {
		if (!this.eventMap[evt]) return
		this.eventMap[evt].forEach(function(cb) {cb(arg)})
	}
}

// APP STATE

var STATE = EVENTS.extend({
	attributes: {
		animating: false,
		level: 3,
		currentRows: 0,
		maxRows: 8,
		matchesThusFar: 0,
		score: 0,
		sqSide: null
	},

	levelDefaults: {
		currentRows: 0,
		matchesThusFar: 0
	},

	get: function(prop) {
		if (this.attributes[prop] === undefined) {
			throw new Error(`property ${prop} does not exist on state.`)
		}
		return this.attributes[prop]
	},

	getGridTop: function() {
		return this.get('currentRows') * this.get('sqSide') || -1
	},

	getRowBlocks: function() {
		return Math.min(this.get('level'), 11)
	},

	getRowWidth: function() {
		return toPx(this.get('sqSide') * this.getRowBlocks())
	},

	levelUp: function() {
		var S = this
		// constant actions at level change
		// trigger level change, grid and width-dependent things will subscribe to it.
		if (this.get('matchesThusFar') < this.get('level')) return 
		disappear($$('#container'))
			.then(function() {
				S.trigger('levelChange')
				S.revealButtons()
				appear($$('#container'))
			})
	},

	resetLevelDefaults: function() {
		this.attributes = this.attributes.extend(this.levelDefaults)
	},

	revealButtons: function() {
		if (this.get('level') >= 1) {
			appear($$('#invert'))
			$$('#invert').onclick = invertPlayerRow
		}
		if (this.get('level') >= 2) {
			appear($$('#flip'))
			$$('#flip').onclick = flipPlayerRow
		}
		if (this.get('level') >= 3) {
			appear($$('#shifters'))
			console.log($$('#shifters'))
			// $$('#shiftLeft').onclick = shiftRowRight
			// $$('#shiftRight').onclick = shiftRowLeft
		}
	},

	set: function(attrs) {
		this.attributes = this.attributes.extend(attrs)
		this.trigger('change')
	},

	updateScore: function(addition) {
		this.set({
			score: this.get('score') + addition,
		})
		this.trigger('scoreUpdate')
	}
})

// TEMPLATES

var TEMPLATES = {
	play: {
		content: TEMPLATES.play,
		init: function() {
			// set dimensions according to device 
			var containerHeight = window.getComputedStyle(document.querySelector("#container")).height
			var sideLength = parseInt(containerHeight) * .087

			var gameContainer = new Component().assignNode('#gameContainer'),
				playerRowContainer = new Component().assignNode('#playerRowContainer'),
				scoreEl = new Component().assignNode('#score'),
				blockCounter = new Component().assignNode('#blockCounter')


			STATE.set({
				sqSide: sideLength,
				gridHeight: STATE.get('maxRows') * sideLength,
				playerRow: new PlayerRow()
			})
			STATE.set({
				grid: new Grid()
			})
			gameContainer.setStyle({
				height: toPx(STATE.get('gridHeight'))
			})
			playerRowContainer.setStyle({
				height: toPx(sideLength)
			})

			// set up subscriptions
			STATE.on('levelChange', initLevel)
			STATE.on('scoreUpdate', function() {
				scoreEl.write(STATE.get('score'))
			})

			// set it off
			STATE.trigger('levelChange')
			STATE.revealButtons()

		},
	},
	settings: {
		content: '\
			<div id="settingsContainer">\
				<p>coming soon</p>\
			</div>',
		init: function() {

		}
	},
	home: {
		content: '\
			<div id="titleWrapper" class="home">\
		    	<h1>block12</h1>\
		    </div>\
		    <div id="menu">\
				<div class="menu-item top">\
					<i id="play" class="material-icons">play_arrow</i>\
				</div>\
				<div class="menu-item top">\
					<i id="tutorial" class="material-icons">help</i>\
				</div>\
				<div class="menu-item">\
					<i id="settings" class="material-icons">settings</i>\
				</div>\
				<div class="menu-item">\
					<i id="about" class="material-icons">pets</i>\
				</div>\
			</div>',
		init: function() {
			var ids = ['play','tutorial','settings','about']
			ids.forEach(function(id) {
				$$('#' + id).onclick = function() {loadTemplate(id)}
			})
		}
	},
	about: {
		content: '',
		init: function() {

		}
	}
}


// COMPONENTS

function Component(sel) {
	this.sel = sel
	// if the node is being read, we find it. otherwise, we
		// create it and make it a div by default
	this.node = $$(sel) || document.createElement('div')
}

Component.prototype = EVENTS.extend({

	assignNode: function(sel) {
		this.node = $$(sel)
		return this
	},

	get: function(key) {
		return this.node.getAttribute(key)
	},

	getStyle: function(key) {
		var val = this.node.style[key]
		// parse to a number if possible
		return parseInt(val) ? parseInt(val) : val
	},

	makeNode: function(tag) {
		this.node = document.createElement(tag)
		return this
	},

	set: function(attrs) {
		Object.keys(attrs).forEach(function(key) {
			this.node.setAttribute(key,attrs[key])						
		}.bind(this))
		return this
	},

	setStyle: function(attrs) {
		for (var prop in attrs) {
			if (typeof prop === 'number') prop = toPx(prop)
			this.node.style[prop] = attrs[prop]
		}
		return this
	},

	getNode: function() {
		return $$(this.sel)
	},

	write: function(content) {
		this.node.innerHTML = content
	}
})

function Grid() {
	// assign node and height
	this.assignNode('#grid')
	this.setStyle({
		height: toPx(STATE.get('sqSide') * STATE.get('maxRows'))
	})

	// set up subscriptions
		// add a row whenever it's time to do so
	var addRow = this.addRow.bind(this),
		checkForMatch = this.checkForMatch.bind(this)
	EVENTS.on('drop', addRow)

		// check for match whenever playerRowChanges
	EVENTS.on('playerRowChange', checkForMatch)
}

Grid.prototype = Component.prototype.extend({
	addRow: function() {		
		var row = new GridRow()
		row.fill()
		if (arraysEqual(row.colors(),this.playerRow.colors())) {
			return this.addRow()
		}
		row.set({
			'data-position': STATE.get('currentRows')
		})
		STATE.set({
			currentRows: STATE.get('currentRows') + 1
		})
		row.setStyle({
			bottom: toPx(STATE.get('gridHeight')),
			width: STATE.getRowWidth()
		})
		this.node.appendChild(row.node)
		return this.sendRowDown(row)
	},

	checkForMatch: function() {
		var gridRows = this.node.children,
			playerColors = this.playerRow.node.children.map(function(el) {
				return el.style.background
			}),
			matchedRows = []
		gridRows.forEach(function(row) {
			var colors = row.children.map(function(el) {
				return el.style.background
			})
			if (arraysEqual(playerColors,colors)) {
				matchedRows.push(row)
			}
		})
		if (matchedRows.length) {
			this.handleMatches(matchedRows).then(STATE.levelUp.bind(STATE))
		}
	},

	clear: function() {
		this.node.clearChildren()
	},

	getRows: function() {
		return this.node.querySelectorAll('.gridRow')
	},

	handleMatches: function(matches) {
		var grid = this
		var ps = matches.map(function(row) {
			// handle scoring
			var points = STATE.getRowBlocks() * 10
			var score = new Score({
				bottomPos: row.style.bottom,
				val: points
			})
			grid.node.appendChild(score.node)
			STATE.updateScore(points)
			setTimeout(function() {
				disappear(score.node)
			}, 350)

			// handle row mechanics
			STATE.set({
				currentRows: STATE.get('currentRows') - 1,
				matchesThusFar: STATE.get('matchesThusFar') + 1
			}) // update currentRows *before* the row has disappeared,
				// so that the next row knows where to land
			return disappear(row).then(function() {
				grid.node.removeChild(row)
			})
		}) // each disappearance returns a promise
		window.all = Promise.all(ps)
		return Promise.all(ps).then(function() {
			grid.resetIndices()
			grid.sendAllDown()
		})
	},

	resetIndices: function() {
		var rows = this.getRows()
		for (var i = 0; i < rows.length; i ++) {
			rows[i].setAttribute('data-position',i)
		}
	},

	sendAllDown: function() {
		this.getRows().forEach(function(el) {
			var rowComp = new Row()
			rowComp.node = el
			this.sendRowDown(rowComp)
		}.bind(this))
	},

	sendRowDown: function(rowComp) {
		return animate(function(res) {
			var incr = CONSTANTS.dropIncr,
				rockBottom = rowComp.get('data-position') * STATE.get('sqSide')
			var inchDown = function() {
				var newBottom = rowComp.getStyle('bottom') - incr
				rowComp.setStyle({
					bottom: newBottom > rockBottom ? 
						toPx(newBottom) : toPx(rockBottom)
				})
				if (rowComp.getStyle('bottom') > rockBottom) {
					requestAnimationFrame(inchDown)
				}
				else {
					
					res()
				}	
			}
			inchDown()
		})
	}
})

function Row() {
}

Row.prototype = Component.prototype.extend({
	blocks: function() {
		return this.node.querySelectorAll('.block')
	},

	colors: function() {
		return this.blocks().map(function(el) {
			return el.style.background
		})
	},

	empty: function() {
		this.node.clearChildren()
		return this
	},

	fill: function() {
		this.node.clearChildren()
		var blocksCalledFor = Math.min(STATE.get('level'),11)
		while (blocksCalledFor > this.node.children.length) {
			this.node.appendChild(new Block().node)
		}
		return this
	},

	reverseBlocks: function() {
		var reversedBlocks = this.blocks().reverse()
		this.empty()
		reversedBlocks.forEach(function(blockEl) {
			this.node.appendChild(blockEl)
		}.bind(this))
	}
})

function GridRow() {
	this.node = document.createElement('div')
	this.node.className = 'gridRow'
}

GridRow.prototype = Row.prototype.extend({

})	

function PlayerRow() {
	this.assignNode('#playerRow')
}

PlayerRow.prototype = Row.prototype.extend({

})

function Block() {
	var block = document.createElement('div')
	block.className = 'block'
	block.style.width = block.style.height = toPx(STATE.get('sqSide'))
	block.style.background = CONSTANTS.colors.choice()
	block.onclick = function(event) {
		var bgColor = event.target.style.background
		event.target.style.background = 
			bgColor === CONSTANTS.colors.red ? 
			CONSTANTS.colors.blue : CONSTANTS.colors.red
		EVENTS.trigger('drop')
		EVENTS.trigger('playerRowChange')
	}
	this.node = block
}

Block.prototype = Component.prototype.extend({

})

function Score(opts) {
	this.makeNode('p')	
	this.setStyle({
		bottom: opts.bottomPos,
		lineHeight: toPx(STATE.get('sqSide')),
		opacity: 1
	})
	this.set({
		class: 'scoreAnimation'
	})
	this.node.textContent = '+ ' + opts.val
}

Score.prototype = Component.prototype.extend({

})

// GLOBAL FUNCTIONS

function $$(sel) {
	return document.querySelector(sel)
}
	
function animate(cb) {
	STATE.set({
		animating: true
	})
	return new Promise(function(res) {
		cb(res)
	}).then(function() {
		STATE.set({
			animating: false
		})
	})
}

function arraysEqual(arr1,arr2) {
	if (arr1.length !== arr2.length) return false
	for (var i = 0; i < arr1.length; i ++) {
		if (arr1[i] !== arr2[i]) return false
	}
	return true
}

function appear(el) {
	el.style.opacity = 0
	el.style.visibility = 'visible'
	return animate(function(res) {
		var brighten = function() {
			el.style.opacity = parseFloat(el.style.opacity) + CONSTANTS.fadeIncr
			if (el.style.opacity < 1) {
				requestAnimationFrame(brighten)
			}
			else {
				res()
			}
		}
		requestAnimationFrame(brighten)
	})
}

function disappear(el) {
	el.style.opacity = 1
	return animate(function(res) {
		var dimIt = function() {
			el.style.opacity = parseFloat(el.style.opacity) - CONSTANTS.fadeIncr
			if (el.style.opacity > 0) {
				requestAnimationFrame(dimIt)
			}
			else {
				res()
			}
		}
		requestAnimationFrame(dimIt)
	})
}

function flipPlayerRow() {
	if (STATE.get('animating')) return
	var rowComp = STATE.get('playerRow'),
		origTransform = rowComp.getStyle('transform').split(' ').filter(function(transPart) {
			return !transPart.includes('rotate')
		}).join(' '),
		deg = 0
	rowComp.setStyle({
		transform: 'rotateY(0deg)'
	})
	return animate(function(res) {
		var pivot = function() {
			deg += CONSTANTS.rotateIncr
			rowComp.setStyle({
				transform: origTransform + ' rotateY(' + deg + 'deg)'
			})
			// console.log()
			if (deg >= 180) {
				rowComp.setStyle({
					transform: origTransform + ' rotateY(180deg)'
				})
				res()
			}
			else {
				requestAnimationFrame(pivot)
			}
		}
		pivot()
	}).then(function() {
		rowComp.setStyle({
			transform: origTransform + ' rotateY(0deg)'
		})
		rowComp.reverseBlocks()
	})
}
function getRGBObj(str) {
	var pat = /rgb\((\d+),\s*(\d+),\s*(\d+)/
	var arr = str.match(pat)
	return {
		red: parseInt(arr[1]),
		green: parseInt(arr[2]),
		blue: parseInt(arr[3])
	}
}

function getRGBStr(obj) {
	return 'rgb(' + parseInt(obj.red) + ',' + parseInt(obj.green) + ',' + parseInt(obj.blue) + ')'
}

function initLevel() {
	//update state
	STATE.resetLevelDefaults()
	STATE.set({
		level: STATE.get('level') + 1,
	})
	
	//update readout
	levelEl = new Component().assignNode('#level')
	levelEl.write(CONSTANTS.numeralToWord[STATE.get('level')])

	//update widths
	var newWidth = STATE.getRowWidth()
	$$('#gameContainer').style.width = newWidth
	$$('#playerRowContainer').style.width = newWidth

	// refill rows
	var row = STATE.get('playerRow')
	row.fill()
	var grid = STATE.get('grid')
	grid.playerRow = row
	grid.clear()
	grid.addRow()
}

function invertBlock(blockNode) {
	return animate(function(res) {
		var currentColors = getRGBObj(blockNode.style.background),
			targetColors = getRGBObj(blockNode.style.background === CONSTANTS.colors.red ? 
			CONSTANTS.colors.blue : CONSTANTS.colors.red),
			redIncr = (targetColors.red - currentColors.red) / CONSTANTS.invertSpeed,
			greenIncr = (targetColors.green - currentColors.green) / CONSTANTS.invertSpeed,
			blueIncr = (targetColors.blue - currentColors.blue) / CONSTANTS.invertSpeed

		function blend() {
			currentColors.red = currentColors.red + redIncr
			currentColors.green = currentColors.green + greenIncr
			currentColors.blue = currentColors.blue + blueIncr
			blockNode.style.background = getRGBStr(currentColors)
			if (currentColors.red * redIncr > targetColors.red * redIncr) { 
				// the above formula allows us to accommodate both those values that were 
					// ascending and those that were descending.
				blockNode.style.background = getRGBStr(targetColors)
				res()
			}
			else {
				requestAnimationFrame(blend)
			}
		}
		requestAnimationFrame(blend)
	})
}

function invertPlayerRow() {
	if (STATE.get('animating')) return 
	var playerRow = STATE.get('playerRow')
	var ps = playerRow.blocks().map(invertBlock)
	return Promise.all(ps).then(function(){
		console.log('triggering')
		EVENTS.trigger('playerRowChange')
	})
}

function loadTemplate(name) {
	
	$$('#container').innerHTML = TEMPLATES[name].content
	TEMPLATES[name].init()
}

function main() {
	loadTemplate('home')
}

function shiftRowLeft() {

}

function toPx(val) {
	return val + 'px'
}

main()