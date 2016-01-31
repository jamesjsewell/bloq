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
NodeList.prototype.map = Array.prototype.map
NodeList.prototype.indexOf = Array.prototype.indexOf	
NodeList.prototype.reverse = Array.prototype.reverse = function(){
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
}

var addPowerUp = function(){
	if (state.rowBlocks === 5) {
		// invert enters the arena
		powerUpContainerEl.querySelector('#invert').style.opacity = 1
		powerUpContainerEl.querySelector('#invert').style.visibility = "visible"	
	}
	if (state.rowBlocks === 6) {
		powerUpContainerEl.querySelector('#reverse').style.opacity = 1
		powerUpContainerEl.querySelector('#reverse').style.visibility = "visible"	
	}
	if (state.rowBlocks === 7) {
		powerUpContainerEl.querySelector('#shiftLeft').style.opacity = 1
		powerUpContainerEl.querySelector('#shiftLeft').style.visibility = "visible"	
		powerUpContainerEl.querySelector('#shiftRight').style.opacity = 1
		powerUpContainerEl.querySelector('#shiftRight').style.visibility = "visible"	
	}
}

var advanceLevel = function() {
	state.level += 1
	state.score = 0
	state.maxScore += 1

	setTimeout(function() {
		scoreEl.style.opacity = 0
		gameContainerEl.style.opacity = 0
		setTimeout(function(){
			scoreEl.innerHTML = 0 + ' / ' + state.maxScore
			scoreEl.style.opacity = 1
			// if (state.level > 1 && (state.level % 2 === 1)) {
			// 	state.sqSide *= .8
			// 	state.maxRows += 1	
			// }
			initLevel()
			gameContainerEl.style.opacity = 1
					},500)
	},500)
}

var arraysEqual = function(a1,a2) {
    return JSON.stringify(a1)==JSON.stringify(a2);
}

var changeColors = function(block) {
	var eligibleColors = COLORS.filter(function(item){
		return item !== block.style.backgroundColor 
	})
	block.style.backgroundColor = eligibleColors.choice()
}

var evaluateMove = function() {
	var playerColors = getColors(playerRowEl)
	var matched = []
	gridEl.childNodes.forEach(function(row){
		var rowColors = getColors(row)
		if (arraysEqual(playerColors,rowColors)) {
			matched.push(row)
		}
	})
	return matched
}

var getColors = function(row) {
	return row.childNodes.map(function(block) {
		return block.style.backgroundColor
	})
}

var handleLoss = function() {
	if (state.instructions.stage > -1) return

	state.lost = true
	scoreEl.style.opacity = 0
	playerRowEl.childNodes.forEach(function(block){
		block.style.opacity = 0
	})
	setTimeout(function(){
		playerRowEl.clearChildren()
	},750)
	setTimeout(function(){
		var msg = document.createElement('h2')
		msg.style.fontSize = toPx(state.sqSide * .75)
		msg.style.lineHeight = toPx(state.sqSide)
		msg.innerHTML = "you lose"
		msg.id = "loseMessage" 
		playerRowEl.appendChild(msg)
		setTimeout(function(){msg.style.opacity = 1},10)
	},750)
}

var handleMatched = function(matched){
	matched.forEach(function(row){
		removeGridRow(row)
		gridEl.childNodes.forEach(sendRowDown)
		updateScore()
	})
	
	if (matched.length && (state.instructions.stage === 1)) {
		setTimeout(function(){
			$$("#powerUpAdvice").style.opacity = 1
			$$('.powerUp').forEach(function(pu){pu.style.opacity = 1;pu.style.visibility = 'visible'})
		},600)
		state.instructions.stage += 1
	}
}

var initLevel = function() {
	state.rowBlocks += 1
	gameContainerEl.style.width = toPx(state.sqSide * state.rowBlocks)
	gridEl.style.height = toPx(state.maxRows * state.sqSide)
	playerRowContainerEl.style.height = toPx(state.sqSide)
	
	// add player row
	if (playerRowContainer.childNodes.length){
		playerRowEl.removeEventListener('click')
		playerRowContainerEl.removeChild(playerRowEl)
	}
	addPowerUp()
	playerRowEl = makeRow()
	playerRowEl.id = "playerRow"
	playerRowContainerEl.appendChild(playerRowEl)

	// initiate new grid
	gridEl.clearChildren()
	addGridRow()
	
	// assign event listener for player row
	playerRowEl.addEventListener('click',moveHandler)
}

var initState = function() {
	state = {
		advancing: false,
		animating: false,
		currentRows: gridEl.childNodes.length,
		instructions: {stage:-1},
		level: 1,
		lost: false,
		match: false,
		maxRows: 6,
		maxScore: 4,
		night: false,
		rowBlocks: 3,
		score: 0,
		sqSide:75,
		getGridHeight: function() {
			return this.maxRows * this.sqSide
		}
	}
}

var invertColors = function() {
	state.animating = true
	playerRowEl.childNodes.forEach(function(block){
		block.style.transition = "background .5s ease"
		changeColors(block)
		setTimeout(function(){
			block.style.transition = "none"
			state.animating = false
		},500)
	})
}

var makeDay = function() {
	state.night = false
	var b = $$('body'),
		n = $$('#night')
	b.style.color = "#444"
	b.style.background = "#fff"
	$$('#titleWrapper').style.background = "#fff"
	$$('#playButton').style.background = "#fff"
	n.innerHTML = "night."
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
	n.innerHTML = "day."
}

var makeRow = function() {
	var rowEl = document.createElement('div')
	var i = 0
	while (i < state.rowBlocks) {
		var block = document.createElement('div')
		block.className = 'block'
		block.style.width = toPx(state.sqSide)
		block.style.height = toPx(state.sqSide)
		block.style.backgroundColor = COLORS.choice()
		rowEl.appendChild(block)
		i += 1
	}
	return rowEl
}

var moveHandler = function(e){
	if (state.animating) return
	if (state.lost) return

	// handle tutorial mode
	if (e.target.className.contains('block') && (state.instructions.stage === 0)) {
		setTimeout(function(){
			$$("#gridAdvice").style.opacity = 1
			state.instructions.stage += 1
		},600)
	}
	if (e.target.className.contains('powerUp') && (state.instructions.stage === 2)) {
		setTimeout(function(){
			$$("#playButton").style.opacity = 1
			$$("#playButton").style.visibility = 'visible'
		},2000)
	}

	// do what they meant to do
	if (e.target.className.contains('block')) changeColors(e.target)
	else if (e.target.id === "invert") invertColors()
	else if (e.target.id === "reverse") reverseColors()		
	else if (e.target.id === "shiftLeft") shiftLeft()		
	else if (e.target.id === "shiftRight") shiftRight()	
	else return
	respondToMove()
}

var removeGridRow = function(row) {
	gridEl.removeChild(row)
	state.currentRows -= 1 
}

var respondToMove = function() {
	if (state.animating) {
		setTimeout(respondToMove,50)
		return
	}
	else {
		var matched = evaluateMove() // returns true if at least one match was found
		if (!matched.length && (gridEl.childNodes.length === state.maxRows)) {
			handleLoss()
			return
		}
		handleMatched(matched)
		if (!state.advancing) addGridRow()
		state.advancing = false
	}
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
	scoreEl.innerHTML = state.score + ' / ' + state.maxScore
	scoreEl.style.opacity = 1
	initLevel()
}

var reverseColors = function() {
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
	},730) 
	playerRowEl.style.transition = ".75s transform ease"
}

var sendRowDown = function(row) {
	var currentRows = gridEl.childNodes.length,
		fallDistance = (state.maxRows - currentRows) * state.sqSide,
		time = fallDistance / 600 // formula for making uniform falling rate, where 600 is the desired rate
	row.style.transition = time + 's bottom ease, .5s opacity ease' // AVOID OVERWRITING OPACITY TRANSITION!
	row.style.bottom = toPx(state.getGridHeight())
	setTimeout(function(){
		var rowIndex = gridEl.childNodes.indexOf(row)
		row.style.bottom = toPx(rowIndex * state.sqSide)
	},50)
}

var shiftLeft = function() {
	state.animating = true
	var firstClone = playerRowEl.childNodes[0].cloneNode()
	playerRowEl.appendChild(firstClone)
	playerRowEl.style.transition = ".5s left linear"
	setTimeout(function(){playerRowEl.style.left = toPx(-1 * state.sqSide)},15)
	setTimeout(function(){
		playerRowEl.style.transition = "none"
		playerRowEl.removeChild(playerRowEl.childNodes[0])
		playerRowEl.style.left = 0
		state.animating = false
		},500)
	}

var shiftRight = function() {
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

var updateScore = function() {
	// don't allow someone in tutorial mode to advance levels
	if (state.instructions.stage > -1) {
		if (state.score === state.maxScore - 1) {
			scoreEl.innerHTML = state.maxScore + ' / ' + state.maxScore
			return
		}
	}
	state.score += 1
	scoreEl.innerHTML = state.score + ' / ' + state.maxScore
	console.log(state)
	if (state.score === state.maxScore) {
		advanceLevel()
		state.advancing = true
		console.log(state)
	}
}

// assign global variables
var gameContainerEl = $$('#gameContainer')
	gridEl = $$("#grid"),
	scoreEl = $$('#score'),
	powerUpContainerEl = $$('#powerUpContainer'),
	playerRowContainerEl = $$('#playerRowContainer')
	GRIDWIDTH = parseInt(window.getComputedStyle(gridEl).width),
	GRIDHEIGHT = parseInt(window.getComputedStyle(gridEl).height),
	COLORS = ['rgb(170, 77, 57)','rgb(39, 88, 107)']

var playerRowEl, state

initState()


// event listeners
powerUpContainerEl.addEventListener('click',moveHandler)
$$('#tutorial').addEventListener('click',showInstructions)
$$('#night').addEventListener('click',makeNight)
$$("#playButton").addEventListener('click',restart)
$$("#restart").addEventListener('click',restart)

initLevel()