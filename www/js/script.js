// COMPONENTS
var COMPONENTS = {
	attributes: {
	},
	init: function() {
		this.set({
			grid: new Grid(),
			playerRow: new PlayerRow(),
			counterRow: new CounterRow(),
			scoreTotal: new Component().assignNode('#score'),
			blockCounter: new Component().assignNode('#blockCounter')
		})
		EVENTS.on(EVENTS.names.scoreUpdate + ' ' + EVENTS.names.sync, function() {
			this.get('scoreTotal').write(STATE.get('score'))
			saveScore()
		}.bind(this))
	}
}


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
		gridChanged: 'gridChanged',
		levelComplete: 'levelComplete',
		levelStart: 'levelStart',
		match: 'match',
		playerRowChange: 'playerRowChange',
		scoreUpdate: 'scoreUpdate',
		sync: 'sync'
	}
}

// APP STATE
var STATE = EVENTS.extend({
	attributes: {
		advancing: false,
		animating: false,
		gridRows: [],
		tutorialStage: 0,
		level: 4,
		currentRows: 0,
		maxRows: 8,
		matchesThusFar: 0,
		playerBlocks: Array(4).fill(SETTINGS.colors.choice()),
		score: 0,
		sqSide: null,
		view: 'home'
	},

	defaultAttributes: {
		advancing: false,
		animating: false,
		gridRows: [],
		tutorialStage: 0,
		level: 4,
		currentRows: 0,
		maxRows: 8,
		matchesThusFar: 0,
		playerBlocks: Array(4).fill(SETTINGS.colors.choice()),
		score: 0,
		sqSide: null,
		view: 'home'
	},

	levelDefaults: {
		currentRows: 0,
		matchesThusFar: 0
	},

	getDefaults: function() {
		defaults = JSON.parse(JSON.stringify(this.defaultAttributes))
		return defaults
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

	getSavedState: function() {
		return JSON.parse(window.localStorage.getItem('bloq_state'))
	},

	initPlay: function() {
		this.set(this.defaultAttributes)
		this.set('view','play')

		// set dimensions according to device
		var containerHeight = window.getComputedStyle(document.querySelector("#container")).height
		var sideLength = parseInt(containerHeight) * .087

		// add a new grid and player row to state
		this.set({
			sqSide: sideLength,
			gridHeight: toPx(sideLength * STATE.get('maxRows'))
		})
	},

	levelUp: function() {
		var S = this
		// constant actions at level change
		// trigger level change, grid and width-dependent things will subscribe to it.
		if (this.get('matchesThusFar') < this.get('level')) return 
		if (closeTutorial()) {
			return
		}
		playSound('level_up')
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
				return disappear($('#container'))
			}).then(function() {
				EVENTS.trigger(EVENTS.names.levelComplete)
				S.revealButtons()
				appear($('#container'))
				STATE.set({
					advancing: false
				})
			})

		}, 500)
	},

	load: function(oldState) {
		console.log(oldState)
		this.set(oldState)
	},

	resetLevelDefaults: function() {
		this.attributes = this.attributes.extend(this.levelDefaults)
	},

	reset: function() {
		STATE.set(this.getDefaults())
		console.log(STATE.get('view'))
		window.localStorage.setItem('bloq_state', null) 
		window.localStorage.setItem('bloq_grid', null) 
		window.localStorage.setItem('bloq_player_row', null) 
		loadView('play')
	},

	revealButtons: function() {
		if (this.get('level') >= 5) {
			appear($('#invert'))
			$('#invert').addEventListener(CONTACT_EVENT,invertPlayerRow)
		}
		if (this.get('level') >= 6) {
			appear($('#flip'))
			$('#flip').addEventListener(CONTACT_EVENT,flipPlayerRow)
		}
		if (this.get('level') >= 7) {
			appear($('#shiftLeft'))
			appear($('#shiftRight'))
			$('#shiftLeft').addEventListener(CONTACT_EVENT,function() {
				shiftRow('left')
			})
			$('#shiftRight').addEventListener(CONTACT_EVENT,function() {
				shiftRow('right')
			})
		}
	},

	save: function() {
		window.localStorage.setItem('bloq_state', JSON.stringify(this.attributes))
	},

	sync: function() {
		// set row and grid width according to state
		$('#playerRowContainer').style.width = STATE.getRowWidth()
		$('#gameContainer').style.width = STATE.getRowWidth()
		var lvl = STATE.get('level')
		this.revealButtons()
		EVENTS.trigger(EVENTS.names.sync)
	},

	updateScore: function(addition) {
		this.set({
			score: this.get('score') + addition,
		})
		EVENTS.trigger(EVENTS.names.scoreUpdate)
		return this
	}
})

// TEMPLATES
var VIEWS = {
	play: {
		content: TEMPLATES.play,
		init: function(opts) {
			opts = opts || {}
			EVENTS.clear() // clear zombie event submissions
			COMPONENTS.init() // create global components
			STATE.initPlay() // set state defaults

			// set heights according to device dimensions
			$('#playerRowContainer').style.height = toPx(STATE.get('sqSide'))
			$('#grid').style.height = STATE.get('gridHeight')

			// set up subscriptions
			EVENTS.on(EVENTS.names.levelStart, runLevel)
			EVENTS.on(EVENTS.names.levelComplete, initLevel)

			// set up listeners

				// update local storage in response to various events
			EVENTS.on(`${EVENTS.names.playerRowChange} ${EVENTS.names.levelStart} ${EVENTS.names.levelComplete} ${EVENTS.names.scoreUpdate}`, function() {
				if (STATE.get('view') == 'tutorial') return 
				STATE.set('playerBlocks', $('#playerRow').children.map(function(node) {
					return node.style.background
					})
				)
				STATE.set('gridRows', 
					$('#grid').children.map(function(rowEl) {
						return rowEl.children.map(function(blockEl) {
							return blockEl.style.background
						})
					})
				)
				STATE.save()
			})

			if (opts.tutorial) {
				STATE.set('tutorialStage', 1)
				STATE.set('view', 'tutorial')
				EVENTS.trigger(EVENTS.names.levelStart)
			}
			else {
				// load extra state data in, if it's there
				if (STATE.getSavedState()) {
					STATE.load(STATE.getSavedState())
					STATE.sync()

				}
				else {
					// otherwise, start the first level
					STATE.sync()
					EVENTS.trigger(EVENTS.names.levelStart)
				}
			}

		},
	},
	settings: {
		content: TEMPLATES.settings,
		init: function() {
			STATE.set('view','settings')
			SETTINGS.init()
		}
	},
	home: {
		content: TEMPLATES.home,
		init: function() {
			STATE.set('view','home')
			var ids = ['play','tutorial','settings','about']
			ids.forEach(function(id) {
				$('#' + id).addEventListener(CONTACT_EVENT,function() {loadView(id)})
			})
			document.querySelector('#high-score .score').innerHTML = localStorage.getItem('blockTwelveHighScore') || 0
		}
	},
	about: {
		content: TEMPLATES.about,
		init: function() {
			STATE.set('view','about')
		}
	},
	tutorial: {
		content: TEMPLATES.play,
		init: function() {
			VIEWS.play.init({tutorial: true})
			STATE.set('view','tutorial')
			COMPONENTS.get('playerRow').class('pulsing')
			var dropRow = function() {
				return COMPONENTS.get('grid').addRow()
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
	this.node = $(sel) || document.createElement('div')
}

Component.prototype = EVENTS.extend({

	assignNode: function(input) {
		if (typeof input === 'string') {
			this.node = $(input)
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

	console.log(STATE.attributes)

	// set up subscriptions
		// add a row whenever it's time to do so
	var addRow = this.addRow.bind(this),
		checkForMatch = this.checkForMatch.bind(this)
	EVENTS.on(EVENTS.names.drop, addRow)

		// check for match whenever playerRowChanges
	EVENTS.on(EVENTS.names.playerRowChange, checkForMatch)

	// rehydrate state if we ever click away
	EVENTS.on(EVENTS.names.sync, function() {
		STATE.get('gridRows').forEach(function(colorArr, i) {
			this.loadRow(colorArr, i)
		}.bind(this))
	}.bind(this))
}

Grid.prototype = Component.prototype.extend({
	addRow: function(colors) {		
		var row = new GridRow()
		// fill randomly or specifically, depending on use case
		row.fill()
		if (arraysEqual(row.colors(),COMPONENTS.get('playerRow').colors())) {
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
			playerColors = COMPONENTS.get('playerRow').node.children.map(function(el) {
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

	loadRow: function(colors, i) {
		var row = new GridRow()
		row.setBlocks(colors)
		row.set({
			'data-position': i
		})
		row.setStyle({
			bottom: toPx(i * STATE.get('sqSide')),
			width: STATE.getRowWidth()
		})
		this.node.appendChild(row.node)
		return this
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
				var willTravel = rowComp.getStyle('bottom') > rockBottom
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
					if (willTravel) playSound('land')
					EVENTS.trigger('gridChanged')
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

	addBlock: function(b) {
		this.node.appendChild(b.node)
	},

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
			this.addBlock(this.makeBlock().randomFill())
		}
		return this
	},

	makeBlock: function() {
		return new Block()
	},

	reverseBlocks: function() {
		var reversedBlocks = this.blocks().reverse()
		this.empty()
		reversedBlocks.forEach(function(blockEl) {
			this.node.appendChild(blockEl)
		}.bind(this))
	},

	setBlocks: function(colorArr) {
		colorArr.forEach(function(color) {
			var b = this.makeBlock().fill(color)
			this.addBlock(b)
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
	EVENTS.on(EVENTS.names.sync, function() {
		this.setBlocks(STATE.get('playerBlocks'))
	}.bind(this))
}

PlayerRow.prototype = Row.prototype.extend({
	makeBlock: function() {
		var b = new Block()
		b.listen(CONTACT_EVENT, function(event) {
			playSound('basic_tap')		
			if (STATE.get('advancing') || STATE.get('animating')) return 
			var bgColor = event.target.style.background
			event.target.style.background = 
				bgColor === SETTINGS.colors.red ? 
				SETTINGS.colors.blue : SETTINGS.colors.red
			EVENTS.trigger('playerRowChange')
			if (STATE.get('tutorialStage') === 1) return
			EVENTS.trigger('drop')
		})
		return b
	}
})

function CounterRow() {
	this.assignNode('#blockCounter')
	EVENTS.on(EVENTS.names.sync + ' ' + EVENTS.names.scoreUpdate + ' ' + EVENTS.names.levelStart, this.update.bind(this))
	EVENTS.on(EVENTS.names.sync + ' ' + EVENTS.names.levelStart, this.fill.bind(this))
}

CounterRow.prototype = Row.prototype.extend({

	glowForTutorial: function(miniEl) {
		brieflyGlow(miniEl).then(function() {
			if (STATE.get('tutorialStage')) COMPONENTS.get('playerRow').class('pulsing')
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

function Block(inputColor) {
	this.makeNode('div')
	this.class('block')
	this.setStyle({
		width: toPx(STATE.get('sqSide')),
		height: toPx(STATE.get('sqSide'))
	})
}

Block.prototype = Component.prototype.extend({
	fill: function(color) {
		return this.setStyle({
			background: color
		})
	},

	randomFill: function() {
		return this.setStyle({
			background: SETTINGS.colors.choice()
		})
	}
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
	if (el instanceof Array) {
		el.forEach(appear)
	}
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
	}).then(function() { STATE.set('animating', false)})
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
	}).then(function() {
		STATE.set('animating',false)
	})
}

function closeTutorial() {
	if (STATE.get('tutorialStage') > 0) {
		// if we've just finished the tutorial 
		EVENTS.clear()
		setTimeout(showPlayButton,1000)
		STATE.set('tutorialStage',0)
		COMPONENTS.get('playerRow').removeClass('pulsing')
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
	playSound('flip')
	var rowComp = COMPONENTS.get('playerRow'),
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
		saveScore()
		STATE.reset()
		showPlayButton()
		$('#playerRowContainer').innerHTML = '<p id="loseMessage">YOU LOSE</p>'
	}
}

function handleRowScore(loc,timeout) {
	var points = STATE.getRowBlocks() * 10
	var score = new Score({
		bottomPos: toPx(loc),
		val: points
	})
	COMPONENTS.get('grid').node.appendChild(score.node)
	STATE.updateScore(points)
	return new Promise(function(res,rej) {
		setTimeout(res, timeout)
	}).then( function() {
		return disappear(score.node)
	})
}

function handleTutorialMatch(rowComp) {
	COMPONENTS.get('playerRow').removeClass('pulsing')
	STATE.set('animating',true)
	return new Promise(function(res) {
		if (STATE.get('tutorialStage') === 0) {
			res()
		}
		else {
			rowComp.setStyle({
				zIndex: 99
			})
			brieflyGlow(rowComp.node,COMPONENTS.get('playerRow').node).then(res)
		}
	}).then(function() {
		STATE.set('animating',false)
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
			targetColors = getRGBObj(blockNode.style.background === SETTINGS.colors.red ? 
			SETTINGS.colors.blue : SETTINGS.colors.red),
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
	playSound('invert')
	var playerRow = COMPONENTS.get('playerRow')
	var ps = playerRow.blocks().map(invertBlock)
	return Promise.all(ps).then(function(){
		EVENTS.trigger(EVENTS.names.playerRowChange)
	})
}

function loadView(name) {
	EVENTS.clear()
	$('#container').innerHTML = VIEWS[name].content
	console.log(STATE)
	STATE.set('view',name)
	VIEWS[name].init()
	if (name === 'play') {
		$('#reset').style.visibility = 'visible'
	}
	else {
		$('#reset').style.visibility = 'hidden'		
		console.log($('#reset'))
	}
}

function main() {
	loadView('home')
}

function playSound(soundName) {
	if (SETTINGS.sounds) $('#' + soundName + '_sound').play()
}

function runLevel() {
	//update readout
	levelEl = new Component().assignNode('#level')
	levelEl.write(CONSTANTS.numeralToWord[STATE.get('level')])

	//update widths
	var newWidth = STATE.getRowWidth()
	$('#gameContainer').style.width = newWidth
	$('#playerRowContainer').style.width = newWidth

	// refill rows
	var row = COMPONENTS.get('playerRow')
	console.log(row.__proto__)
	row.fill()
	var grid = COMPONENTS.get('grid')
	grid.playerRow = row
	grid.clear()
	if (STATE.get('tutorialStage') === 0) {
		grid.addRow()
	}
}

function saveScore() {
	if (STATE.get('score') > localStorage.getItem('blockTwelveHighScore')) {
		localStorage.setItem('blockTwelveHighScore', STATE.get('score'))
	}
}

function shiftRow(way) {
	if (STATE.get('animating')) return 
	playSound('slide')
	STATE.set('animating',true) // seems redundant because animate (below) does this
		// but we're experiencing a bug wherein it allows you to shift mid shift
		// and ruins the row
	var rowComp = COMPONENTS.get('playerRow'),
		spd = STATE.get('sqSide') / 26,
		firstBlock = rowComp.blocks()[0],
		lastBlock = rowComp.blocks()[rowComp.blocks().length - 1],
		oldBLockWidth = STATE.get('sqSide'),
		newBlockWidth = 0

	if (way === 'left') {
		oldBlockComp = new Block().assignNode(firstBlock)
		newBlockComp = new Block().fill(oldBlockComp.getStyle('background'))
		rowComp.node.appendChild(newBlockComp.node)
	}

	else {
		oldBlockComp = new Block().assignNode(lastBlock)
		newBlockComp = new Block().fill(oldBlockComp.getStyle('background'))
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
	appear($('#playButton'))
	$('#playButton').addEventListener(CONTACT_EVENT,function() {
		loadView('play')
	})
}

function toPx(val) {
	return val.slice && val.slice(-2) === 'px' ? val : val + 'px'
}

// SET GLOBAL EVENT LISTENERS
$('#goBack').addEventListener(CONTACT_EVENT, function() {
	console.log('clicked me')
	if (STATE.get('animating') || STATE.get('advancing')) return
	saveScore()
	loadView('home')
})

$('#reset').addEventListener(CONTACT_EVENT, function() {
	if (STATE.get('animating')) return
	STATE.reset()
})

main()
