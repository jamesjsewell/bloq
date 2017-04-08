"use strict;"

// modify prototypes
Array.prototype.choice = function() {
	var index = Math.floor(Math.random() * this.length)
	return this[index]
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

var numeralToWord = {
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
}

// helper functions
var $$ = function(selector) {
	if (selector[0] === '.') {
		return document.getElementsByClassName(selector.slice(1))
	}
	return document.querySelector(selector)
}

// assigning click for desktop, touchstart for mobile
var eventType = 'click'
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	eventType = 'touchstart'
}

var addCSSRule = function(sheet, selector, rules, index) {
	if("insertRule" in sheet) {
		sheet.insertRule(selector + "{" + rules + "}", index);
	}
	else if("addRule" in sheet) {
		sheet.addRule(selector, rules, index);
	}
}

// render functions

var addGridRow = function() {
	var row = makeRow()

	if (arraysEqual(getColors(playerRowEl),getColors(row))) { //if this is already a match
		addGridRow()
		return
	}
	row.className = 'gridRow'
	gridEl.appendChild(row)
	sendRowDown(row)
	state.currentRows += 1
}

var addPowerUp = function(){
	if (state.level >= 5) {
		// invert enters the arena
		powerUpContainerEl.querySelector('#invert').style.opacity = 1
		powerUpContainerEl.querySelector('#invert').style.visibility = "visible"	
	}
	if (state.level >= 6) {
		powerUpContainerEl.querySelector('#reverse').style.opacity = 1
		powerUpContainerEl.querySelector('#reverse').style.visibility = "visible"	
	}
	if (state.level >= 7) {
		powerUpContainerEl.querySelector('#shiftLeft').style.opacity = 1
		powerUpContainerEl.querySelector('#shiftLeft').style.visibility = "visible"	
		powerUpContainerEl.querySelector('#shiftRight').style.opacity = 1
		powerUpContainerEl.querySelector('#shiftRight').style.visibility = "visible"	
	}
}

var advanceLevel = function() {

	// animate clearance points
	var remainingRows = state.maxRows - state.currentRows,
		topMostBorder = state.currentRows * getActualSqSide()

	for (var rowTop = topMostBorder; rowTop < getGridHeight(); rowTop += getActualSqSide()) {
		animateScore(getGridHeight() - rowTop,.5,true)
	}

	state.score += remainingRows * 5 * getRowBlocks()
	updateReadout()
	state.level += 1
	state.matchesThusFar = 0
	state.totalMatchesNeeded += 1

	var disappearTimeout = remainingRows ? 2500: 500
	var theyDisappeared = new Promise(function(resolve,reject) {
		setTimeout(function() {
			disappear(leftSideEl,gameContainerEl)
			resolve()
		},disappearTimeout)
	})
	theyDisappeared.then(function() {
		setTimeout(initLevel,1000)
	})
}

var animateScore = function(distanceFromTop,multiplier,endLevel) {
	return new Promise(function(res,rej) {
		var removalTimeout = 1000,
			fadeoutTimeout = 500
		var scoreMsg = document.createElement('p')
		scoreMsg.style.top = UTILS.toPX(parseFloat(distanceFromTop) - getActualSqSide())
		scoreMsg.style.lineHeight = UTILS.toPX(getActualSqSide())
		scoreMsg.className = "scoreAnimation"
		scoreMsg.textContent = '+ ' + getRowBlocks() * 10 * multiplier
		gridEl.appendChild(scoreMsg)
		if (endLevel) {
			removalTimeout = 2000
			fadeoutTimeout = 1500
			scoreMsg.style.opacity = 0
			setTimeout(function(){scoreMsg.style.opacity = 1},50)
		}
		setTimeout(function(){
			scoreMsg.style.opacity = 0
			setTimeout(function(){
				gridEl.removeChild(scoreMsg)
			},removalTimeout)
		},fadeoutTimeout)		
		res()
	})
}

var appear = function() {
	Array.prototype.forEach.call(arguments,function(arg){
        arg.style.opacity = 1
	})
}


var arraysEqual = function(a1,a2) {
    return JSON.stringify(a1)==JSON.stringify(a2);
}

var calcFallDistance = function(row,rowIndex) {
	// calculations are based on the bottom border of the row
	var landingPlace = getActualSqSide() * rowIndex 
	var startingPlace = getGridHeight() - row.distanceFromTop
	return startingPlace - landingPlace + 2
}

var changeColors = function(block) {
	var eligibleColors = COLORS.filter(function(item){
		return item !== block.style.backgroundColor 
	})
	block.style.backgroundColor = eligibleColors.choice()
}

var disappear = function() {
	Array.prototype.forEach.call(arguments,function(arg){
        arg.style.opacity = 0
	})
}

var evaluateMove = function() {
	var playerColors = getColors(playerRowEl)
	var matched = []
	gridEl.children.forEach(function(row){
		var rowColors = getColors(row)
		if (arraysEqual(playerColors,rowColors)) {
			matched.push(row)
		}
	})
	return matched
}

var exposePlayButton = function(text) {
	
	$$("#playButton").style.opacity = 1
	$$("#playButton").style.visibility = 'visible'
	$$("#playButton").textContent = text
}

var getColors = function(row) {
	return row.children.map(function(block) {
		return block.style.backgroundColor
	})
}

var getActualSqSide = function(){
	return state.sqSide + 2
}

var getGridHeight = function() {
	return state.maxRows * (getActualSqSide()) - 2 // fiddling height to accommodate outlines
}

var getPlayerRowWidth = function() {
	return UTILS.toPX(state.sqSide * getRowBlocks() + 4)
}

var getPlayerRowHeight = function() {
	return UTILS.toPX(state.sqSide + 5)
}

var getRowBlocks = function(){
	return Math.min(state.level,11)
}

var handleLoss = function() {
	if (state.instructions.stage > -1) return
	state.lost = true
	setTimeout(function(){
		
		exposePlayButton('again')
	},750)
}

var handleMatched = function(matched,res){
	matched.forEach(function(row){
		animateScore(row.distanceFromTop,1).then(function(){
			removeGridRow(row)
			gridEl.querySelectorAll('.gridRow').forEach(sendRowDown)
			res()
		}).catch(logErrors)
		state.matchesThusFar += 1
		state.score += getRowBlocks() * 10
	})
	updateReadout()
	
	if (matched.length && (state.instructions.stage === 1)) {
		setTimeout(function(){
			$$("#powerUpAdvice").style.opacity = 1
			$$('.powerUp').forEach(function(pu){pu.style.opacity = 1;pu.style.visibility = 'visible'})
		},600)
		state.instructions.stage += 1
	}

	// don't allow someone in tutorial mode to advance levels
	if (state.instructions.stage > -1) {
		if (state.matchesThusFar === state.totalMatchesNeeded - 1) {
			return
		}
	}
}

var initFromStorage = function() {
	state = JSON.parse(localStorage.block12_state)

	gameContainerEl.style.width = UTILS.toPX(state.sqSide * getRowBlocks())
	gridEl.style.height = UTILS.toPX(getGridHeight())
	playerRowContainerEl.style.width = getPlayerRowWidth()	
	playerRowContainerEl.style.height = UTILS.toPX(state.sqSide + 8)

	// playerRowEl.innerHTML = localStorage.block12_playerRow
	// gridEl.innerHTML = localStorage.block12_gridRows
	var playerBlocks = JSON.parse(localStorage.block12_playerRow)
	
	var rowFromData = function(arr) {
		var htmlString = ''
		arr.forEach(function(bgColor) {
			var styleString = "width: " + state.sqSide + "px; height: " + state.sqSide + "px; background-color: " + bgColor + ";"
			htmlString += '<div class="block" style="' + styleString + '"></div>'
		})
		return htmlString
	}	

	var objToInlineStyle = function(obj) {
		var styleString = ''
		for (var prop in obj) {
			styleString += prop + ':' + obj[prop] + '; '
		}
		return styleString
	}

	playerRowEl.innerHTML = rowFromData(playerBlocks)

	var gridRows = JSON.parse(localStorage.block12_gridRows)
	var rowEls = gridRows.map(function(rowObj) {
		var htmlString = '<div class="gridRow" style="' + objToInlineStyle(rowObj.style) + '">' 
		var htmlString = '' 
		rowObj.blocks.forEach(function(blockEl){
			htmlString += '<div class="block" style="' + objToInlineStyle(blockEl.style) + ';"></div>' 
		})
		var rowEl = document.createElement('div')
		rowEl.distanceFromTop = rowObj.distanceFromTop
		rowEl.classList.add('gridRow')
		rowEl.style.top = rowObj.style.top
		rowEl.style.transition = rowObj.style.transition
		rowEl.style.transform = rowObj.style.transform
		rowEl.innerHTML = htmlString
		gridEl.appendChild(rowEl)
	})

	// gridEl.innerHTML = htmlString
	addPowerUp()
	makeMiniBlocks()
	updateReadout()
}

var initLevel = function() {

	state.advancing = false
	state.matchesThusFar = 0
	state.currentRows = 0


	// reassign heights and widths
	gameContainerEl.style.width = UTILS.toPX(state.sqSide * getRowBlocks())
	gridEl.style.height = UTILS.toPX(getGridHeight())
	playerRowContainerEl.style.width = getPlayerRowWidth()
	playerRowContainerEl.style.height = UTILS.toPX(state.sqSide + 8)

	// make possible updates to readouts/display
	updatePlayerRow()
	addPowerUp()
	makeMiniBlocks()
	updateReadout()

	// refresh grid
	gridEl.clearChildren()
	appear(gameContainerEl)
	appear(leftSideEl)
	addGridRow()
}

var initState = function() {
	var containerHeight = window.getComputedStyle(document.querySelector("#container")).height
	var sideLength = parseInt(containerHeight) * .087
	state = {
		advancing: false,
		animating: false,
		currentRows: 0,
		instructions: {stage:-1},
		level: 4,
		lost: false,
		match: false,
		maxRows: 8,
		matchesThusFar: 0,
		score: 0,
		sqSide: sideLength,
		totalMatchesNeeded: 4,
	}
	window.state = state
}

var invertColors = function(res) {
	state.animating = true
	playerRowEl.children.forEach(function(block){
		block.style.transition = "background .5s ease"
		changeColors(block)
		setTimeout(function(){
			block.style.transition = "none"
			state.animating = false
			res()
		},500)
	})
}

var logErrors = function(e) {
	console.log(e)
}

var makeBlock = function() {
	var block = document.createElement('div')
	block.className = 'block'
	block.style.width = UTILS.toPX(state.sqSide)
	block.style.height = UTILS.toPX(state.sqSide)
	block.style.backgroundColor = COLORS.choice()
	return block
}

var makeLossMessage = function() {
	var msg = document.createElement('h2')
	msg.style.fontSize = UTILS.toPX(state.sqSide * .75)
	msg.style.lineHeight = UTILS.toPX(state.sqSide)
	msg.style.top = UTILS.toPX(state.sqSide * -1)
	msg.innerHTML = "you lose"
	msg.id = "loseMessage" 
	setTimeout(function(){msg.style.opacity = 1},10)
	return msg
}

var makeMiniBlocks = function() {
	var htmlStr = ''
	for (var i = 0; i < state.level; i ++) {
		htmlStr += '<div class="miniBlock"></div>'
	}
	blockCounterEl.innerHTML = htmlStr
}

var makeRow = function() {
	var rowEl = document.createElement('div')
	var i = 0
	while (i < getRowBlocks()) {
		var block = makeBlock()
		rowEl.appendChild(block)
		i += 1
	}
	rowEl.distanceFromTop = -2 //topVal is used internally to track the position. actual location is handled via 3d-transform
	rowEl.style.top = UTILS.toPX(-1 * state.sqSide - 2)
	return rowEl
}

var moveHandler = function(e){
	if (state.animating || state.advancing || state.lost) return

	// handle tutorial mode
	if (e.target.className.contains('block') && (state.instructions.stage === 0)) {
		setTimeout(function(){
			$$("#gridAdvice").style.opacity = 1
			state.instructions.stage += 1
		},600)
	}
	if (e.target.className.contains('powerUp') && (state.instructions.stage === 2)) {
		setTimeout(function(){
			exposePlayButton('play')
		},2000)
	}

	// do what they meant to do
	if (e.target.className.contains('block')) {
		var p = new Promise(function(res,rej) {
			changeColors(e.target)
			addGridRow() 
			res()
		})
	}
	else if (e.target.id === "invert") {
			var p = new Promise(function(res,rej) {
			invertColors(res)
		})
	}
	else if (e.target.id === "reverse") var p = new Promise(function(res,rej) {
		reverseColors(res)	
	})	
	else if (e.target.id === "shiftLeft") var p = new Promise(function(res,rej){
		shiftLeft(res)
	})		
	else if (e.target.id === "shiftRight") var p = new Promise(function(res,rej){
		shiftRight(res)
	})	
	else return
	p.then(respondToMove)
	saveState()
}

var removeGridRow = function(row) {
	gridEl.removeChild(row)
	state.currentRows -= 1 
}

var respondToMove = function() {

	var matched = evaluateMove() // returns true if at least one match was found
	if (!matched.length && (state.currentRows > state.maxRows)) {
		handleLoss()
		return
	}
	var p = new Promise(function(res,rej) {
		handleMatched(matched,res)
	})
	p.then(function() {
		if (state.matchesThusFar >= state.totalMatchesNeeded) {
				setTimeout(advanceLevel,1000)
				state.advancing = true
			}

	}).catch(logErrors)
}

var restart = function() {
	state.lost = false
	$$(".powerUp").forEach(function(el){
		el.style.opacity = 0
		setTimeout(function(){
			el.style.visibility = 'hidden'
		},500)
	})

	setTimeout(function(){$$("#playButton").style.visibility = "hidden"},750)
	$$(".advice").forEach(function(el){
		el.style.opacity = 0
	})
	initState()
	initLevel()
}

var reverseColors = function(res) {
	var reversed = playerRowEl.childNodes.reverse()

	// the animation does a superficial rotation, leaving the original row intact.
	// it must be followed up with an actual transformation of the data, 
	// then the superficial changes must be reversed.
	state.animating = true
	playerRowEl.style.textAlign = "center"
	playerRowEl.style.left = "-26%" //fudged to accommodate outline
	if (playerRowEl.style.transform === "rotateY(180deg)") {
		playerRowEl.style.transform = "rotateY(0deg)"
	}
	else playerRowEl.style.transform = "rotateY(180deg)"

	setTimeout(function() {
		playerRowEl.clearChildren()
		playerRowEl.style.transition = "none"
		playerRowEl.style.textAlign = "left"
		playerRowEl.style.left = "2px"
		playerRowEl.style.transform = "rotateY(0deg)"
		reversed.forEach(function(block){
			playerRowEl.appendChild(block)
		})
		state.animating = false
		res()
	},730) 
	playerRowEl.style.transition = ".75s transform ease"
}
// <div class="gridRow" style="top: -72.035px; transition: all 1.08552s ease; transform: translate3d(0px, 504.245px, 0px);"><div class="block" style="width: 70.035px; height: 70.035px; background-color: rgb(39, 88, 107);"></div><div class="block" style="width: 70.035px; height: 70.035px; background-color: rgb(170, 77, 57);"></div><div class="block" style="width: 70.035px; height: 70.035px; background-color: rgb(39, 88, 107);"></div><div class="block" style="width: 70.035px; height: 70.035px; background-color: rgb(170, 77, 57);"></div></div>
// <div class="block" style="width: 70.035px; height: 70.035px; background-color: rgb(170, 77, 57);"></div>
var saveState = function() {
	localStorage.block12_state = JSON.stringify(state)
	localStorage.block12_gridRows = JSON.stringify(gridEl.querySelectorAll('.gridRow').map(
		function(rowEl) {
			return {
				style: {
					top: rowEl.style.top,
					transition: rowEl.style.transition,
					transform: rowEl.style.transform
				},
				distanceFromTop: rowEl.distanceFromTop,
				blocks: rowEl.querySelectorAll('.block').map(function(blockEl) {
						return {
							style: {
								"background-color": blockEl.style.backgroundColor,
								width: blockEl.style.width,
								height: blockEl.style.height
							}
						}
					})
			} 
		})
	)
	// localStorage.block12_gridRows = JSON.stringify(gridEl.querySelectorAll('.gridRow'))
	
	localStorage.block12_playerRow = JSON.stringify(
		playerRowEl.querySelectorAll('.block').map(function(blockEl) {
				return blockEl.style.backgroundColor
			})
		)

	// localStorage.block12_playerRow = playerRowEl.innerHTML
	// localStorage.block12_gridRows = gridEl.innerHTML
}

// important! the interpretation of actualFallDistance is "distance from the top"

var sendRowDown = function(row) {
	var rowList = gridEl.querySelectorAll('.gridRow')
	var currentRows = rowList.length,
		rowIndex = rowList.indexOf(row),
		animatedFallDistance = getGridHeight() - 
			currentRows * state.sqSide, // these are different
			// because rows that drop only one square length should
			// not actually fall as quickly as they should mathematically.
		actualFallDistance = calcFallDistance(row,rowIndex),
		newTransform = actualFallDistance + row.distanceFromTop
		time = animatedFallDistance / 400 // formula for making uniform falling rate, where 400px/s is the desired rate
	row.style.transition = time + 's ease all'
	var dropped = new Promise(function(res,rej) {
		setTimeout(function(){
			row.distanceFromTop = newTransform 
			row.style.transform = "translate3d(0," + UTILS.toPX(newTransform) + ",0)"
			row.style.webkitTransform = "translate3d(0," + UTILS.toPX(newTransform) + ",0)"
			row.style.MozTransform = "translate3d(0," + UTILS.toPX(newTransform) + ",0)"
			saveState()
			res()
		},50)
	})
}

var shiftLeft = function(res) {
	state.animating = true
	var firstClone = playerRowEl.children[0].cloneNode()
	playerRowEl.appendChild(firstClone)
	playerRowEl.style.transition = ".5s left linear"
	setTimeout(function(){playerRowEl.style.left = UTILS.toPX(-1 * state.sqSide)},15)
	setTimeout(function(){
		playerRowEl.style.transition = "none"
		playerRowEl.removeChild(playerRowEl.children[0])
		playerRowEl.style.left = "2px"
		state.animating = false
		res()
		},500)
	}

var shiftRight = function(res) {
	state.animating = true
	var blocks = playerRowEl.childNodes
	var lastClone = blocks[blocks.length - 1].cloneNode()
	// playerRowEl.removeChild(blocks[0])
	playerRowEl.style.transition = "none"
	playerRowEl.style.left = UTILS.toPX(-1 * state.sqSide)
	playerRowEl.insertBefore(lastClone,blocks[0]) 
	
	setTimeout(function(){
		playerRowEl.style.transition = ".5s all linear"
		playerRowEl.style.left = "2px"
		},30)
	setTimeout(function(){
		playerRowEl.removeChild(blocks[blocks.length - 1])
		state.animating = false
		res()
	},500)
}

var updatePlayerRow = function() {
	playerRowEl.clearChildren()
	var blocksCalledFor = Math.min(state.level,11)
	while (blocksCalledFor > playerRowEl.children.length) {
		playerRowEl.appendChild(makeBlock())
	}
}

var updateReadout = function() {
	readoutEl.querySelector("#level").textContent = numeralToWord[state.level]
	scoreEl.innerHTML = state.score
	blockCounterEl.children.forEach(function(miniEl,i){
		if (state.matchesThusFar > i) miniEl.classList.add('filled')
	})
}

// assign global variables
var state
var gameContainerEl,
	gridEl,
	leftSideEl,
	matchedDisplayEl,
	powerUpContainerEl,
	playerRowContainerEl,
	readoutEl,
	COLORS = ['rgb(170, 77, 57)','rgb(39, 88, 107)'],
	playerRowEl,
	scoreEl,
	blockCounterEl


var UTILS = {
	activateGameboard: function() {
		var state
		var gameContainerEl = state.gameContainerEl = $$('#gameContainer')
			gridEl = state.gridEl = $$("#grid"),
			leftSideEl = state.leftSideEl = $$('#leftSide')
			matchedDisplayEl = state.matchedDisplayEl = $$('#matchedDisplay'),
			powerUpContainerEl = state.powerUpContainerEl = $$('#powerUpContainer'),
			playerRowContainerEl = state.playerRowContainerEl = $$('#playerRowContainer'),
			readoutEl = state.readoutEl= $$("#readout")
			COLORS = state.COLORS = ['rgb(170, 77, 57)','rgb(39, 88, 107)'],
			playerRowEl = state.playerRowEl = $$("#playerRow"),
			scoreEl = state.scoreEl = $$("#score"),
			blockCounterEl = $$("#blockCounter")

		// event listeners
		
		powerUpContainerEl.addEventListener(eventType,moveHandler)
		playerRowEl.addEventListener(eventType,moveHandler)
		playerRowEl.addEventListener(eventType,moveHandler)
		$$("#playButton").addEventListener(eventType,restart)
		$$("#restart").addEventListener(eventType,restart)
		$$("#goBack").addEventListener(eventType,renderHomeView)
		$$("#reset").addEventListener(eventType,restart)
	},

	toPX: function(val) {
		return val + 'px'
	}
}

var PLAY = {
	template: '\
	    <p id="nav" class="day" >\
	    	<a id="tutorial" href="#">how.</a>\
	    	<a href="#" id="restart">restart.</a>\
	    	<a target="_blank" href="http://github.com/magentanova/bloq">github.</a>\
	    	<a id="night" href="#">night.</a>\
	    </p>\
	    <div id="leftSide">\
	        <div id="powerUpContainer">\
	            <div id="shifters">\
	                <i id="shiftLeft" class="material-icons powerUp powerUpLeft">chevron_left</i>\
	                <i id="shiftRight" class="material-icons powerUp powerUpRight">chevron_right</i>\
	            </div>\
	            <i id="reverse" class="material-icons powerUp powerUpRight">compare_arrows</i>\
	            <i id="invert" class="material-icons powerUp powerUpLeft">invert_colors</i>\
	            <p></p>\
	        </div>\
	    </div>\
	    <div id="gameContainer">\
	        <p class="advice" id="playButton">play</p>\
	    	<div id="readout">\
	    		<div id="readoutData">\
	                <p id="score">0</p><p id="level">four</p>\
	            </div>\
	            <div id="blockCounter"></div>\
	    	</div>\
	    	<div id="grid"></div>\
	    	<div id="playerRowContainer">\
	    		<div id="playerRow">\
	    		</div>\
	    	</div>\
	    	<div style="display:none" id="tutorialContainer">\
	    		<p class="advice" id="blockAdvice">click on a block to change its color</p>\
	    		<p class="advice" id="gridAdvice">match your row to a row in the grid</p>\
	    		<p class="advice" id="powerUpAdvice">new levels bring new abilities. you can invert, flip, or slide your row.</p>\
	    	</div>\
	    </div>',
	begin: function() {
		$$("#container").innerHTML = this.template
		UTILS.activateGameboard()
		if (localStorage.block12_state) {
			initFromStorage()
			return
		}
		
		initState()
		initLevel()
		if (tutorial) showInstructions()
	}
}	

var TEMPLATE = {
	begin: function() {
		UTILS.activateGameboard()
		
	}
}

var renderPlayView = function() {	
	PLAY.begin()
}

var renderAbout = function() {
	var photos = ['business.jpg'],
		imgSrc = 'img/' + photos.choice(),
		htmlString = '<img src="' + imgSrc + '">'
	$$("#container").innerHTML = aboutHTML + htmlString
}

var renderHomeView = function() {
	$$("#container").innerHTML = homeHTML
	$$("#goBack").style.display = "none"
	$$("#reset").style.display = "none"

	var toggleView = function(e) {
		var view = e.target.getAttribute('which')
		$$("#goBack").style.display = "block"
		$$("#reset").style.display = "block"
		var funcMap = {
			play: renderPlayView,
			tutorial: renderTutorial,
			about: renderAbout,
			settings: renderSettings
		}
		funcMap[view]()
	}
	$$("#menu").addEventListener(eventType,toggleView)	
}

var renderSettings = function() {
	$$("#container").innerHTML = settingsHTML
}

var renderTutorial = function() {
	$$("#container").innerHTML = tutorialHTML
	$$("#tutorialContainer").children.forEach(function(adviceP,i) {
		setTimeout(function(){
			adviceP.style.opacity = 1
			adviceP.style.visibility = 'visible'
		}, i * 2000)
	})
	$$("#playButton").addEventListener(eventType,renderPlayView)
}

$$("#goBack").addEventListener(eventType,renderHomeView)
renderHomeView()