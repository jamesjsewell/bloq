"use strict;"

// SET TOUCH VS CLICK
var CONTACT_EVENT = 'click'
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	CONTACT_EVENT = 'touchend'
}

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

// CONSTANTS
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
	dropIncr: 10,
	fadeIncr: .04,
	invertSpeed: 20,
	rotateIncr: 2.88,
	// slideSpeed: STATE.get('sqSide') / 16 // this needs to be computed after page load. hrmm. 
}
 
// EVENTS
var EVENTS = {
	eventMap: {},

	clear: function() {
		this.eventMap = {}
	},

	off: function(evt,cb) {
		if (cb) {
			this.eventMap[evt] = this.eventMap[evt].remove(cb)
		}
		else {
			this.eventMap[evt] = []
		}
	},
	on: function(evts,cb) {
		if (evts === undefined || evts.includes('undefined')) {
			throw new ReferenceError('attempted to use undefined event name.')
		}
		evts.split(' ').forEach(function(evt) {
			if (this.eventMap[evt]) {
				this.eventMap[evt].push(cb)
			}
			else {
				this.eventMap[evt] = [cb]
			}
		}.bind(this))
	},

	trigger: function(evt,arg) {
		if (!this.eventMap[evt]) return
		this.eventMap[evt].forEach(function(cb) {cb(arg)})
	},

	names: {
		drop: 'drop',
		levelComplete: 'levelComplete',
		levelStart: 'levelStart',
		match: 'match',
		playerRowChange: 'playerRowChange',
		scoreUpdate: 'scoreUpdate'
	}
}

// APP STATE
var STATE = EVENTS.extend({
	attributes: {
		advancing: false,
		animating: false,
		tutorialStage: 0,
		level: 4,
		currentRows: 0,
		maxRows: 8,
		matchesThusFar: 0,
		score: 0,
		sqSide: null,
		view: 'home'
	},

	defaultAttributes: {
		advancing: false,
		animating: false,
		tutorialStage: 0,
		level: 4,
		currentRows: 0,
		maxRows: 8,
		matchesThusFar: 0,
		score: 0,
		sqSide: null,
		view: 'home'
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

	getDefaults: function() {
		return JSON.parse(JSON.stringify(this.defaultAttributes))
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
		if (closeTutorial()) {
			
			return
		}
		STATE.set({
			advancing: true
		})
		// pause for dramatic effect
		setTimeout(function() {
			// for every empty row space remaining, run handleRowScore at that location
			var ps = []
			for (var i = STATE.get('currentRows'); i < STATE.get('maxRows'); i ++) {
				var bottom = i * STATE.get('sqSide')
				ps.push(handleRowScore(bottom,750))
			}
			STATE.resetLevelDefaults() // prevents level jumps while transitioning

			// when all those animations are complete, then fade out the container etc
			Promise.all(ps).then(function() {
				return disappear($$('#container'))
			}).then(function() {
				EVENTS.trigger(EVENTS.names.levelComplete)
				S.revealButtons()
				appear($$('#container'))
				STATE.set({
					advancing: false
				})
			})

		}, 500)
	},

	load: function() {
		var oldState = JSON.parse(window.localStorage.getItem('bloq_state'))			
		this.attributes = oldState || this.defaultAttributes
	},

	resetLevelDefaults: function() {
		this.attributes = this.attributes.extend(this.levelDefaults)
	},

	reset: function() {
		EVENTS.clear()
		this.attributes = this.getDefaults()
	},

	revealButtons: function() {
		if (this.get('level') >= 5) {
			appear($$('#invert'))
			$$('#invert').addEventListener(CONTACT_EVENT,invertPlayerRow)
		}
		if (this.get('level') >= 6) {
			appear($$('#flip'))
			$$('#flip').addEventListener(CONTACT_EVENT,flipPlayerRow)
		}
		if (this.get('level') >= 7) {
			appear($$('#shiftLeft'))
			appear($$('#shiftRight'))
			$$('#shiftLeft').addEventListener(CONTACT_EVENT,function() {
				shiftRow('left')
			})
			$$('#shiftRight').addEventListener(CONTACT_EVENT,function() {
				shiftRow('right')
			})
		}
	},

	save: function() {
		window.localStorage.setItem('bloq_state', JSON.stringify(this.attributes))
	},

	set: function(attrs, val) {
		// allow terser syntax for one property
		if (typeof attrs === 'string') {
			this.attributes[attrs] = val
			return this
		}
		this.attributes = this.attributes.extend(attrs)
		EVENTS.trigger('change')
	},

	updateScore: function(addition) {
		this.set({
			score: this.get('score') + addition,
		})
		EVENTS.trigger(EVENTS.names.scoreUpdate)
	}
})

// TEMPLATES
var VIEWS = {
	play: {
		content: TEMPLATES.play,
		init: function(opts) {
			opts = opts || {}
			// load state from local storage if there's anything there.
			STATE.reset() // clear zombie event submissions
			STATE.set('view','play')
			if (opts.tutorial) {
				
				STATE.set('tutorialStage', 1)
			}
			// set dimensions according to device 
			var containerHeight = window.getComputedStyle(document.querySelector("#container")).height
			var sideLength = parseInt(containerHeight) * .087

			var gameContainer = new Component().assignNode('#gameContainer'),
				playerRowContainer = new Component().assignNode('#playerRowContainer'),
				scoreTotal = new Component().assignNode('#score'),
				counterRow = new CounterRow(),
				blockCounter = new Component().assignNode('#blockCounter')

			playerRowContainer.setStyle({
				height: toPx(sideLength)
			})

			STATE.set({
				sqSide: sideLength,
				playerRow: new PlayerRow(),
				gridHeight: sideLength * STATE.get('maxRows')
			})

			STATE.set({
				grid: new Grid()
			})

			// set up subscriptions
			EVENTS.on(EVENTS.names.levelStart, runLevel)
			EVENTS.on(EVENTS.names.levelComplete, initLevel)
			EVENTS.on(EVENTS.names.scoreUpdate, function() {
				scoreTotal.write(STATE.get('score'))
			})
			EVENTS.on(EVENTS.names.levelStart + ' ' + EVENTS.names.playerRowChange + ' ' + EVENTS.names.scoreUpdate, 
				STATE.save.bind(STATE))

			// set it off
			EVENTS.trigger(EVENTS.names.levelStart)
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
		content: TEMPLATES.home,
		init: function() {
			var ids = ['play','tutorial','settings','about']
			ids.forEach(function(id) {
				$$('#' + id).addEventListener(CONTACT_EVENT,function() {loadView(id)})
			})
			document.querySelector('#high-score .score').innerHTML = localStorage.getItem('blockTwelveHighScore') || 0
		}
	},
	about: {
		content: TEMPLATES.about,
		init: function() {

		}
	},
	tutorial: {
		content: TEMPLATES.play,
		init: function() {
			VIEWS.play.init({tutorial: true})
			STATE.set('view','tutorial')
			STATE.get('playerRow').class('pulsing')
			// var dropRow = function() {
			// 	STATE.get('grid').addRow()
			// 	if (STATE.get('currentRows') < 4) {
			// 		setTimeout(dropRow, STATE.get('currentRows') * 125)
			// 	}
			// }
			var dropRow = function() {
				
				return STATE.get('grid').addRow()
			}
			var promise = dropRow()
			for (var i = 0; i < 3; i ++) {
				promise = promise.then(dropRow)
			}
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

	assignNode: function(input) {
		if (typeof input === 'string') {
			this.node = $$(input)
		}
		else {
			this.node = input
		}
		return this
	},

	class: function(className) {
		if (className) {
			this.node.className += ' ' + className
			return this
		}
		else {
			return this.node.className
		}
	},

	get: function(key) {
		return this.node.getAttribute(key)
	},

	getStyle: function(key) {
		var val = this.node.style[key]
		// parse to a number if possible
		return parseInt(val) ? parseInt(val) : val
	},

	listen: function(evt,cb) {
		this.node.addEventListener(evt,cb)
	},

	makeNode: function(tag) {
		this.node = document.createElement(tag || 'div')
		return this
	},

	removeClass: function(name) {
		this.node.classList.remove(name)
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
	EVENTS.on(EVENTS.names.drop, addRow)

		// check for match whenever playerRowChanges
	EVENTS.on(EVENTS.names.playerRowChange, checkForMatch)
}

Grid.prototype = Component.prototype.extend({
	addRow: function() {		
		var row = new GridRow()
		row.fill()
		if (arraysEqual(row.colors(),STATE.get('playerRow').colors())) {
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
		var promise = this.handleMatches(matchedRows).then(STATE.levelUp.bind(STATE))
		
		return promise
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
			return handleTutorialMatch(new Row().assignNode(row))
				.then(function() {
					// handle row mechanics
					STATE.set({
						currentRows: STATE.get('currentRows') - 1,
						matchesThusFar: STATE.get('matchesThusFar') + 1
					}) // update currentRows *before* the row has disappeared,
						// so that the next row knows where to land

					// handle scoring
					var btm = row.style.bottom
					handleRowScore(btm,550)
					return disappear(row)
				})
				.then(function() {
					grid.node.removeChild(row)
				})
		}) // each disappearance returns a promise
		// Promise.all will resolve immediately if the array is empty.
		return Promise.all(ps).then(function() {
			grid.resetIndices()
			handleLoss()
			return grid.sendAllDown()
		})
	},

	resetIndices: function() {
		var rows = this.getRows()
		for (var i = 0; i < rows.length; i ++) {
			rows[i].setAttribute('data-position',i)
		}
	},

	sendAllDown: function() {
		var ps = []
		this.getRows().forEach(function(el) {
			var rowComp = new Row()
			rowComp.node = el
			ps.push(this.sendRowDown(rowComp))
		}.bind(this))
		return Promise.all(ps)
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
	this.node.className = 'row gridRow'
}

GridRow.prototype = Row.prototype.extend({

})	

function PlayerRow() {
	this.assignNode('#playerRow')
}

PlayerRow.prototype = Row.prototype.extend({
	fill: function() {
		this.node.clearChildren()
		var blocksCalledFor = Math.min(STATE.get('level'),11)
		while (blocksCalledFor > this.node.children.length) {
			this.node.appendChild(new PlayerBlock().node)
		}
		return this
	}
})

function CounterRow() {
	this.assignNode('#blockCounter')
	EVENTS.on(EVENTS.names.scoreUpdate + ' ' + EVENTS.names.levelStart, this.update.bind(this))
	EVENTS.on(EVENTS.names.levelStart, this.fill.bind(this))
}

CounterRow.prototype = Row.prototype.extend({

	glowForTutorial: function(miniEl) {
		brieflyGlow(miniEl).then(function() {
			if (STATE.get('tutorialStage')) STATE.get('playerRow').class('pulsing')
			STATE.set('animating',false)
		})
	},

	fill: function() {
		this.empty()
		var blocksCalledFor = Math.min(STATE.get('level'),11)
		while (blocksCalledFor > this.node.children.length) {
			this.node.appendChild(new Component().makeNode().class('miniBlock').node)
		}
		return this
	},

	update: function() {
		var timeout = STATE.get('tutorialStage') ? 1250 : 0 
		setTimeout( function() {
			this.node.children.forEach(function(miniEl,i){
				if (STATE.get('matchesThusFar') > i) {
					miniEl.classList.add('filled')
					if (timeout) this.glowForTutorial(miniEl)
				}
			}.bind(this))
		}.bind(this), timeout)
	}
})

function Block() {
	this.init()
}

Block.prototype = Component.prototype.extend({
	init: function() {
		this.makeNode('div')
		this.class('block')
		this.setStyle({
			width: toPx(STATE.get('sqSide')),
			height: toPx(STATE.get('sqSide')),
			background: CONSTANTS.colors.choice()
		})
	}
})

function PlayerBlock() {
	this.init()
	this.listen(CONTACT_EVENT, function(event) {
		if (STATE.get('advancing') || STATE.get('animating')) return 
		var bgColor = event.target.style.background
		event.target.style.background = 
			bgColor === CONSTANTS.colors.red ? 
			CONSTANTS.colors.blue : CONSTANTS.colors.red
		EVENTS.trigger('playerRowChange')
		if (STATE.get('tutorialStage') === 1) return
		EVENTS.trigger('drop')
	})
}

PlayerBlock.prototype = Block.prototype.extend({
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
	this.write('+ ' + opts.val)
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

function brieflyGlow() {
	var nodes = arguments
	return new Promise(function(res) {
		// need for each here because of closures and i
		Array.prototype.forEach.call(nodes,function(node) {
			node.classList.add('glowing')
			STATE.set('animating',true)
			setTimeout(function() {
				node.classList.remove('glowing')
				// pause for effect
				setTimeout(res,500)
			}, 1500)
		})
	})
}

function closeTutorial() {
	if (STATE.get('tutorialStage') > 0) {
		// if we've just finished the tutorial 
		EVENTS.clear()
		setTimeout(showPlayButton,1000)
		STATE.set('tutorialStage',0)
		STATE.get('playerRow').removeClass('pulsing')
		return true
	}
	return false
}

function disappear(el) {
	el.style.opacity = 1
	return animate(function(res) {
		var dimIt = function() {
			el.style.opacity = Math.max(parseFloat(el.style.opacity) - CONSTANTS.fadeIncr, 0)
			if (el.style.opacity === '0') {
				res()
			}
			else {
				requestAnimationFrame(dimIt)
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
			deg = Math.min(deg + CONSTANTS.rotateIncr, 180)
			rowComp.setStyle({
				transform: origTransform + ' rotateY(' + deg + 'deg)'
			})
			// 
			if (deg === 180) {
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
		EVENTS.trigger(EVENTS.names.playerRowChange)
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

function handleLoss() {
	if (STATE.get('currentRows') > STATE.get('maxRows')) {
		if (STATE.get('score') > localStorage.getItem('blockTwelveHighScore')) {
			localStorage.setItem('blockTwelveHighScore', STATE.get('score'))
		}
		STATE.reset()
		showPlayButton()
		$$('#playerRowContainer').innerHTML = '<p id="loseMessage">YOU LOSE</p>'
	}
}

function handleRowScore(loc,timeout) {
	var points = STATE.getRowBlocks() * 10
	var score = new Score({
		bottomPos: toPx(loc),
		val: points
	})
	STATE.get('grid').node.appendChild(score.node)
	STATE.updateScore(points)
	return new Promise(function(res,rej) {
		setTimeout(res, timeout)
	}).then( function() {
		return disappear(score.node)
	})
}

function handleTutorialMatch(rowComp) {
	STATE.get('playerRow').removeClass('pulsing')
	STATE.set('animating', true)
	return new Promise(function(res) {
		if (STATE.get('tutorialStage') === 0) {
			res()
		}
		else {
			rowComp.setStyle({
				zIndex: 99
			})
			brieflyGlow(rowComp.node,STATE.get('playerRow').node).then(res)
		}
	})
}

function initLevel() {
	
	//update state
	STATE.resetLevelDefaults()
	STATE.set({
		level: STATE.get('level') + 1,
	})
	
	EVENTS.trigger(EVENTS.names.levelStart)
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
		EVENTS.trigger(EVENTS.names.playerRowChange)
	})
}

function loadView(name) {
	EVENTS.clear()
	$$('#container').innerHTML = VIEWS[name].content
	STATE.set('view',name)
	VIEWS[name].init()
	if (name === 'play') {
		$$('#reset').style.visibility = 'visible'
	}
	else {
		$$('#reset').style.visibility = 'hidden'		
		console.log($$('#reset'))
	}
}

function main() {
	loadView('home')
}

function runLevel() {
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
	if (STATE.get('tutorialStage') === 0) {
		grid.addRow()
	}
}

function shiftRow(way) {
	if (STATE.get('animating')) return 
	STATE.set('animating',true) // seems redundant because animate (below) does this
		// but we're experiencing a bug wherein it allows you to shift mid shift
		// and ruins the row
	var rowComp = STATE.get('playerRow'),
		spd = STATE.get('sqSide') / 26,
		firstBlock = rowComp.blocks()[0],
		lastBlock = rowComp.blocks()[rowComp.blocks().length - 1],
		oldBLockWidth = STATE.get('sqSide'),
		newBlockWidth = 0

	if (way === 'left') {
		oldBlockComp = new Block().assignNode(firstBlock)
		newBlockComp = new Block().setStyle({background: oldBlockComp.getStyle('background')})
		rowComp.node.appendChild(newBlockComp.node)
	}

	else {
		oldBlockComp = new Block().assignNode(lastBlock)
		newBlockComp = new Block().setStyle({background: oldBlockComp.getStyle('background')})
		rowComp.node.insertBefore(newBlockComp.node, rowComp.blocks()[0])
	}	

	return animate(function(res) {
		var inchLeft = function() {
			newBlockWidth = Math.min(STATE.get('sqSide'), newBlockWidth + spd)
			oldBLockWidth = Math.max(oldBLockWidth - spd,0)
			oldBlockComp.setStyle({
				width: toPx(oldBLockWidth)
			})
			newBlockComp.setStyle({
				width: toPx(newBlockWidth)
			})
			if (oldBlockComp.getStyle('width') === '0px') {
				res()
			}
			else {
				requestAnimationFrame(inchLeft)
			}
		}
		inchLeft()
	}).then(function() {
		
		rowComp.node.removeChild(oldBlockComp.node)
		EVENTS.trigger('playerRowChange')
	})
}

function showPlayButton() {
	appear($$('#playButton'))
	$$('#playButton').addEventListener(CONTACT_EVENT,function() {
		loadView('play')
	})
}

function toPx(val) {
	return val.slice && val.slice(-2) === 'px' ? val : val + 'px'
}

// SET GLOBAL EVENT LISTENERS
$$('#goBack').addEventListener(CONTACT_EVENT, function() {
	if (STATE.get('animating')) return
	loadView('home')
})
$$('#reset').addEventListener(CONTACT_EVENT, function() {
	if (STATE.get('animating')) return
	loadView(STATE.get('view'))
})

main()
