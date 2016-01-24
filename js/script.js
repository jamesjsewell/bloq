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

// helper functions

var addGridRow = function(rowBlocks) {
	var row = makeRow(rowBlocks)
	row.className = 'gridRow'
	gridEl.appendChild(row)
}

var initLevel = function() {
	rowBlocks += 1
	gridEl.clearChildren()
	addGridRow(rowBlocks)
	if (rowBlocks > 4) gameContainerEl.removeChild(playerRowEl)
	playerRowEl = makeRow(rowBlocks)
	playerRowEl.id = "playerRow"
	gameContainerEl.appendChild(playerRowEl)
	gameContainerEl.style.maxWidth = toPx(sqSide * rowBlocks)
	// assign event listener for player row
	$('#playerRow .block').click(
		function(e) {
			changeColors(e)
			addGridRow(rowBlocks)
			evaluateMatch()
		})
}

function arraysEqual(a1,a2) {
    return JSON.stringify(a1)==JSON.stringify(a2);
}

var changeColors = function(e) {
	var block = e.target
	var eligibleColors = colors.filter(function(item){
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
			row.style.opacity = 0
			setTimeout(function(){
				gridEl.removeChild(row)
				},500)
			updateScore()
		}
	})
	if (!match && gridEl.childNodes.length === 6) {
			alert('you loser')
			return
		}
}

var makeRow = function(rowBlocks) {
	var rowEl = document.createElement('div')
	var i = 0
	while (i < rowBlocks) {
		var block = document.createElement('div')
		block.className = 'block'
		block.style.width = toPx(sqSide)
		block.style.height = toPx(sqSide)
		block.style.backgroundColor = colors.choice()
		rowEl.appendChild(block)
		i += 1
	}
	return rowEl
}

var toPx = function(val) {
	return val + 'px'
}

var updateScore = function() {
	// var score = parseInt(scoreEl.innerHTML.split('/')[0].trim()),
	score += 1
	scoreEl.innerHTML = score + ' / ' + maxScore
	if (score === maxScore) {
		score = 0
		maxScore += 1
		setTimeout(function() {
			scoreEl.style.opacity = 0
			setTimeout(function(){
				scoreEl.innerHTML = score + ' / ' + maxScore
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
	gridWidth = parseInt(window.getComputedStyle(gridEl).width),
	gridHeight = parseInt(window.getComputedStyle(gridEl).height),
	sqSide = 75,
	nRows = 6,
	rowBlocks = 3, // will be incremented in initLevel
	colors = ['rgb(170, 77, 57)','rgb(39, 88, 107)'],
	score = 0,
	maxScore = 4

var playerRowEl
var i = 0 

initLevel()