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

NodeList.prototype.forEach = Array.prototype.forEach
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
	}
	if (state.rowBlocks === 8) {
		powerUpContainerEl.querySelector('#shiftRight').style.opacity = 1
		powerUpContainerEl.querySelector('#shiftRight').style.visibility = "visible"	
	}
}

var advanceLevel = function() {
	state.score = 0
	state.maxScore += 1
	setTimeout(function() {
		scoreEl.style.opacity = 0
		gameContainerEl.style.opacity = 0
		setTimeout(function(){
			scoreEl.innerHTML = state.score + ' / ' + state.maxScore
			scoreEl.style.opacity = 1
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
	var playerColors = getColors(playerRow)
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
	scoreEl.style.opacity = 0
	playerRowEl.childNodes.forEach(function(block){
		block.style.opacity = 0
	})
	setTimeout(function(){
		playerRowEl.removeEventListener('click',moveHandler)
		powerUpContainerEl.removeEventListener('click',moveHandler)
		playerRowEl.clearChildren()
	},750)
	setTimeout(function(){
		var msg = document.createElement('h2')
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
}

var initLevel = function() {
	state.rowBlocks += 1
	gameContainerEl.style.width = toPx(state.sqSide * state.rowBlocks)
	
	// add player row
	if (state.rowBlocks > 4) {
		// replace player row with bigger one
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

var invertColors = function() {
	playerRowEl.childNodes.forEach(function(block){
		changeColors(block)
	})
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
	window.ev = e
	if (e.target.className.contains('block')) changeColors(e.target)
	if (e.target.id === "invert") invertColors()
	if (e.target.id === "reverse") reverseColors()		
	if (e.target.id === "shiftLeft") shiftLeft()		
	if (e.target.id === "shiftRight") shiftRight()	
	respondToMove()
}

var removeGridRow = function(row) {
	gridEl.removeChild(row)
	state.currentRows -= 1 
}

var respondToMove = function() {
	if (state.animating) {
		setTimeout(respondToMove,50)
	}
	else {
		var matched = evaluateMove() // returns true if at least one match was found
		if (!matched.length && (gridEl.childNodes.length === state.maxRows)) {
			handleLoss()
			return
		}
		handleMatched(matched)
		addGridRow()
	}
}

var reverseColors = function() {
	var reversed = playerRowEl.childNodes.reverse()

	// the animation does a superficial rotation, leaving the original row intact.
	// it must be followed up with an actual transformation of the data, 
	// at which point the superficial changes must be reversed.
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
		fallDistance = state.gridHeight - currentRows * state.sqSide,
		time = fallDistance / 600 // formula for making uniform falling rate, where 600 is the desired rate
	row.style.transition = time + 's bottom ease, .5s opacity ease' // AVOID OVERWRITING OPACITY TRANSITION!
	row.style.bottom = toPx(state.gridHeight)
	setTimeout(function(){
		var rowIndex = gridEl.childNodes.indexOf(row)
		row.style.bottom = toPx(rowIndex * state.sqSide)
	},10)
}

var shiftLeft = function() {
	var firstClone = playerRowEl.childNodes[0].cloneNode()
	playerRowEl.appendChild(firstClone)
	playerRowEl.style.transition = ".5s all linear"
	playerRowEl.style.left = "-75px"
	state.animating = true
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
	playerRowEl.style.left = toPx(parseInt(playerRowEl.style.left) - 75)
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

var toPx = function(val) {
	return val + 'px'
}

var updateScore = function() {
	// var state.score = parseInt(scoreEl.innerHTML.split('/')[0].trim()),
	state.score += 1
	scoreEl.innerHTML = state.score + ' / ' + state.maxScore
	if (state.score === state.maxScore) {
		advanceLevel()
	}
}

// assign global variables
var gameContainerEl = document.querySelector('#gameContainer')
	gridEl = document.querySelector("#grid"),
	scoreEl = document.querySelector('#score'),
	powerUpContainerEl = document.querySelector('#powerUpContainer'),
	playerRowContainerEl = document.querySelector('#playerRowContainer')
	GRIDWIDTH = parseInt(window.getComputedStyle(gridEl).width),
	GRIDHEIGHT = parseInt(window.getComputedStyle(gridEl).height),
	COLORS = ['rgb(170, 77, 57)','rgb(39, 88, 107)'],
	state = {
		animating: false,
		currentRows: gridEl.childNodes.length,
		gridHeight: "450",
		match: false,
		maxRows: 6,
		maxScore: 4,
		rowBlocks: 3,
		score: 0,
		sqSide:75,
	}
window.shiftLeft = shiftLeft

var playerRowEl
var i = 0 
powerUpContainerEl.addEventListener('click',moveHandler)
initLevel()