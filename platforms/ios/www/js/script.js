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
		window.nodes = this.childNodes
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

// helper functions

var $$ = function(selector) {
	if (selector[0] === '.') {
		return document.getElementsByClassName(selector.slice(1))
	}
	return document.querySelector(selector)
}

var addCSSRule = function(sheet, selector, rules, index) {
	if("insertRule" in sheet) {
		sheet.insertRule(selector + "{" + rules + "}", index);
	}
	else if("addRule" in sheet) {
		sheet.addRule(selector, rules, index);
	}
}

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
	if (state.level === 2) {
		// invert enters the arena
		powerUpContainerEl.querySelector('#invert').style.opacity = 1
		powerUpContainerEl.querySelector('#invert').style.visibility = "visible"	
	}
	if (state.level === 3) {
		powerUpContainerEl.querySelector('#reverse').style.opacity = 1
		powerUpContainerEl.querySelector('#reverse').style.visibility = "visible"	
	}
	if (state.level === 4) {
		powerUpContainerEl.querySelector('#shiftLeft').style.opacity = 1
		powerUpContainerEl.querySelector('#shiftLeft').style.visibility = "visible"	
		powerUpContainerEl.querySelector('#shiftRight').style.opacity = 1
		powerUpContainerEl.querySelector('#shiftRight').style.visibility = "visible"	
	}
}

var advanceLevel = function() {
	// animate clearance points
	var remainingRows = state.maxRows - state.currentRows,
		topMostBorder = state.currentRows * state.getActualSqSide()
	
	for (var rowTop = topMostBorder; rowTop < state.getGridHeight(); rowTop += state.getActualSqSide()) {
		animateScore(state.getGridHeight() - rowTop,.5,true)
	}

	state.score += remainingRows * 5 * state.getRowBlocks()
	updateScoreDisplay()
	state.level += 1
	state.matchesThusFar = 0
	state.totalMatchesNeeded += 1

	var theyDisappeared = new Promise(function(resolve,reject) {
		setTimeout(function() {
			disappear(matchedDisplayEl,gameContainerEl)
			resolve()
		},2500)
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
		scoreMsg.style.top = toPx(parseFloat(distanceFromTop) - state.getActualSqSide())
		scoreMsg.style.lineHeight = toPx(state.getActualSqSide())
		scoreMsg.className = "scoreAnimation"
		scoreMsg.textContent = '+ ' + state.getRowBlocks() * 10 * multiplier
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
	var landingPlace = state.getActualSqSide() * rowIndex 
	var startingPlace = state.getGridHeight() - row.distanceFromTop
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

var handleLoss = function() {
	if (state.instructions.stage > -1) return

	state.lost = true
	matchedDisplayEl.style.opacity = 0
	playerRowEl.children.forEach(function(block){
		block.style.opacity = 0
	})
	setTimeout(function(){
		playerRowEl.clearChildren()
		// playerRowEl.appendChild(makeLossMessage())
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
		state.score += state.getRowBlocks() * 10
	})
	updateScoreDisplay()
	updateMatchedDisplay()
	
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

var initLevel = function() {
	state.advancing = false
	state.matchesThusFar = 0
	state.currentRows = 0


	// reassign heights and widths
	gameContainerEl.style.width = toPx(state.sqSide * state.getRowBlocks())
	gridEl.style.height = toPx(state.getGridHeight())
	playerRowContainerEl.style.height = toPx(state.sqSide)
	
	updatePlayerRow()
	addPowerUp()
	updateMatchedDisplay()

	// refresh grid
	gridEl.clearChildren()
	appear(gameContainerEl)
	appear(matchedDisplayEl)
	addGridRow()
}

var initState = function() {
	state = {
		advancing: false,
		animating: false,
		currentRows: 0,
		instructions: {stage:-1},
		level: 1,
		lost: false,
		match: false,
		maxRows: 8,
		matchesThusFar: 0,
		night: false,
		score: 0,
		sqSide:60,
		totalMatchesNeeded: 4,
		getActualSqSide: function(){return this.sqSide + 2},
		getRowBlocks: function(){return Math.min(this.level + 3,11)},
		getGridHeight: function() {
			return this.maxRows * (this.getActualSqSide()) - 2 // fiddling height to accommodate outlines
		}
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
	block.style.width = toPx(state.sqSide)
	block.style.height = toPx(state.sqSide)
	block.style.backgroundColor = COLORS.choice()
	return block
}

var makeDay = function() {
	state.night = false
	var b = $$('body'),
		n = $$('#night')
	b.style.color = "#444"
	b.style.background = "#fff"
	$$('#titleWrapper').style.background = "#fff"
	$$('#playButton').style.background = "#fff"
	$$("#nav").className = "day"
	n.innerHTML = "night."
}

var makeLossMessage = function() {
	var msg = document.createElement('h2')
	msg.style.fontSize = toPx(state.sqSide * .75)
	msg.style.lineHeight = toPx(state.sqSide)
	msg.style.top = toPx(state.sqSide * -1)
	msg.innerHTML = "you lose"
	msg.id = "loseMessage" 
	setTimeout(function(){msg.style.opacity = 1},10)
	return msg
}

var makeNight = function() {
	if (state.night) {
		makeDay()
		return
	}
	state.night = true
	var b = $$('body'),
		n = $$('#night')
	b.style.color = "#fff"
	b.style.background = "rgb(40, 40, 40)"
	$$('#titleWrapper').style.background = "rgb(40, 40, 40)"
	$$('#playButton').style.background = "rgb(40, 40, 40)"
	$$("#nav").className = "night"
	n.innerHTML = "day."
}

var makeRow = function() {
	var rowEl = document.createElement('div')
	var i = 0
	while (i < state.getRowBlocks()) {
		var block = makeBlock()
		rowEl.appendChild(block)
		i += 1
	}
	rowEl.distanceFromTop = -2 //topVal is used internally to track the position. actual location is handled via 3d-transform
	rowEl.style.top = toPx(-1 * state.sqSide - 2)
	return rowEl
}

var moveHandler = function(e){
	console.log(state)
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
	playerRowEl.style.left = "-25%"
	if (playerRowEl.style.transform === "rotateY(180deg)") {
		playerRowEl.style.transform = "rotateY(0deg)"
	}
	else playerRowEl.style.transform = "rotateY(180deg)"

	setTimeout(function() {
		playerRowEl.clearChildren()
		playerRowEl.style.transition = "none"
		playerRowEl.style.textAlign = "left"
		playerRowEl.style.left = "0"
		playerRowEl.style.transform = "rotateY(0deg)"
		reversed.forEach(function(block){
			playerRowEl.appendChild(block)
		})
		state.animating = false
		res()
	},730) 
	playerRowEl.style.transition = ".75s transform ease"
}

// important! the interpretation of actualFallDistance is "distance from the top"

var sendRowDown = function(row) {
	var rowList = gridEl.querySelectorAll('.gridRow')
	var currentRows = rowList.length,
		rowIndex = rowList.indexOf(row),
		animatedFallDistance = state.getGridHeight() - 
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
			row.style.transform = "translate3d(0," + toPx(newTransform) + ",0)"
			row.style.webkitTransform = "translate3d(0," + toPx(newTransform) + ",0)"
			row.style.MozTransform = "translate3d(0," + toPx(newTransform) + ",0)"
			res()
		},50)
	})
}

var shiftLeft = function(res) {
	state.animating = true
	var firstClone = playerRowEl.children[0].cloneNode()
	playerRowEl.appendChild(firstClone)
	playerRowEl.style.transition = ".5s left linear"
	setTimeout(function(){playerRowEl.style.left = toPx(-1 * state.sqSide)},15)
	setTimeout(function(){
		playerRowEl.style.transition = "none"
		playerRowEl.removeChild(playerRowEl.children[0])
		playerRowEl.style.left = 0
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
	playerRowEl.style.left = toPx(-1 * state.sqSide)
	playerRowEl.insertBefore(lastClone,blocks[0]) 
	
	setTimeout(function(){
		playerRowEl.style.transition = ".5s all linear"
		playerRowEl.style.left = "0"
		},30)
	setTimeout(function(){
		playerRowEl.removeChild(blocks[blocks.length - 1])
		state.animating = false
		res()
	},500)
}

var toggleInstructions = function() {
	
	if (state.instructions) {
		
		$$("#tutorialContainer").style.visibility = 'hidden'
		document.getElementsByClassName("powerUp").forEach(function(el){
			el.style.visibility = 'hidden'
			el.style.opacity = 0
		})
		state.instructions = false
	}
	else {
		
		$$("#tutorialContainer").style.visibility = 'visible'
		document.getElementsByClassName("powerUp").forEach(function(el){
			el.style.visibility = 'visible'
			el.style.opacity = 1
		})
		state.instructions = true
	}
}

var showInstructions = function() {
	if (state.instructions.stage === -1) {
		state.instructions.stage += 1
		$$("#blockAdvice").style.opacity = 1
	}
}

var toPx = function(val) {
	return val + 'px'
}

var updatePlayerRow = function() {
	playerRowEl.clearChildren()
	var blocksCalledFor = Math.min(state.level + 3,11)
	while (blocksCalledFor > playerRowEl.children.length) {
		playerRowEl.appendChild(makeBlock())
	}
}

var updateMatchedDisplay = function() {
	matchedDisplayEl.innerHTML = state.matchesThusFar + ' / ' + state.totalMatchesNeeded
}

var updateScoreDisplay = function() {
	scoreEl.innerHTML = state.score
}

// assign global variables
var gameContainerEl = $$('#gameContainer')
	gridEl = $$("#grid"),
	matchedDisplayEl = $$('#matchedDisplay'),
	powerUpContainerEl = $$('#powerUpContainer'),
	playerRowContainerEl = $$('#playerRowContainer'),
	COLORS = ['rgb(170, 77, 57)','rgb(39, 88, 107)'],
	playerRowEl = $$("#playerRow"),
	scoreEl = $$("#score")

initState()

// event listeners

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	powerUpContainerEl.addEventListener('touchstart',moveHandler)
	playerRowEl.addEventListener('touchstart',moveHandler)
	$$('#tutorial').addEventListener('touchstart',showInstructions)
	$$('#night').addEventListener('touchstart',makeNight)
	$$("#playButton").addEventListener('touchstart',restart)
	$$("#restart").addEventListener('touchstart',restart)
}

else {
	powerUpContainerEl.addEventListener('click',moveHandler)
	playerRowEl.addEventListener('click',moveHandler)
	$$('#tutorial').addEventListener('click',showInstructions)
	$$('#night').addEventListener('click',makeNight)
	$$("#playButton").addEventListener('click',restart)
	$$("#restart").addEventListener('click',restart)
}
makeNight()
initLevel()