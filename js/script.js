"use strict;"
// modify prototypes

Array.prototype.choice = function() {
	var index = Math.floor(Math.random() * this.length)
	return this[index]
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
	row.className = 'gridRow'
    // assign bottom according to number of rows
	gridEl.childNodes.length += 1
	gridEl.appendChild(row)
	sendRowDown(row)
}

var arraysEqual = function(a1,a2) {
    return JSON.stringify(a1)==JSON.stringify(a2);
}

var changeColors = function(e) {
	var block = e.target
	var eligibleColors = COLORS.filter(function(item){
		return item !== block.style.backgroundColor 
	})
	block.style.backgroundColor = eligibleColors.choice()
}

var evaluateMatch = function() {
	var playerColors = playerRowEl.childNodes.map(function(block) {
		return block.style.backgroundColor
	})
	var match = false
	gridEl.childNodes.forEach(function(row){
		var rowColors = row.childNodes.map(function(block){
			return block.style.backgroundColor
		})
		if (arraysEqual(playerColors,rowColors)) {
			match = true
			handleMatch(row)
		}
	})
	return match
}

var handleLoss = function() {
	scoreEl.style.opacity = 0
	playerRowEl.childNodes.forEach(function(block){
		block.style.opacity = 0
	})
	setTimeout(function(){
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

var handleMatch = function(row){
	row.style.opacity = 0
	gridEl.removeChild(row)
	gridEl.childNodes.forEach(sendRowDown)
	// setTimeout(
	// 	function(){
	// 		
			
	// 		)
	// 	},500)
	updateScore()
}

var initLevel = function() {
	state.rowBlocks += 1
	gridEl.clearChildren()
	addGridRow(state.rowBlocks)
	// add player row
	if (state.rowBlocks > 4) {
		playerRowEl.removeEventListener('click')
		gameContainerEl.removeChild(playerRowEl)
	}
	playerRowEl = makeRow(state.rowBlocks)
	playerRowEl.id = "playerRow"
	gameContainerEl.appendChild(playerRowEl)
	gameContainerEl.style.maxWidth = toPx(state.sqSide * state.rowBlocks)
	// assign event listener for player row
	playerRowEl.addEventListener('click',function(e) 
		{
			changeColors(e)
			var match = evaluateMatch() // returns true if at least one match was found
			if (!match && (gridEl.childNodes.length === state.maxRows)) {
				handleLoss()
				return
			}
			addGridRow()
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

var sendRowDown = function(row) {
	var currentRows = gridEl.childNodes.length,
		fallDistance = state.gridHeight - currentRows * state.sqSide,
		time = fallDistance / 600 // formula for making uniform falling rate, where 600 is the desired rate
	row.style.transition = time + 's bottom linear'
	row.style.bottom = toPx(state.gridHeight)
	setTimeout(function(){
		var rowIndex = gridEl.childNodes.indexOf(row)
		row.style.bottom = toPx(rowIndex * state.sqSide)
	},10)
}

var toPx = function(val) {
	return val + 'px'
}

var updateScore = function() {
	// var state.score = parseInt(scoreEl.innerHTML.split('/')[0].trim()),
	state.score += 1
	scoreEl.innerHTML = state.score + ' / ' + state.maxScore
	if (state.score === state.maxScore) {
		state.score = 0
		state.maxScore += 1
		setTimeout(function() {
			scoreEl.style.opacity = 0
			setTimeout(function(){
				scoreEl.innerHTML = state.score + ' / ' + state.maxScore
				scoreEl.style.opacity = 1
				initLevel()
			},500)
		},500)
	}
}

// assign global variables
var gameContainerEl = document.querySelector('#gameContainer')
	gridEl = document.querySelector("#grid"),
	scoreEl = document.querySelector('#score'),
	GRIDWIDTH = parseInt(window.getComputedStyle(gridEl).width),
	GRIDHEIGHT = parseInt(window.getComputedStyle(gridEl).height),
	COLORS = ['rgb(170, 77, 57)','rgb(39, 88, 107)'],
	state = {
		currentRows: gridEl.childNodes.length,
		gridHeight: "450",
		match: false,
		maxRows: 6,
		maxScore: 4,
		rowBlocks: 3,
		score: 0,
		sqSide:75,
	}

var playerRowEl
var i = 0 

initLevel()