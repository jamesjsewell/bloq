"use strict;"


// SET TOUCH VS CLICK 
var CONTACT_EVENT = 'click'
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	CONTACT_EVENT = 'touchend'
}

// shorthand querySelectors
function $(sel) {
	return document.querySelector(sel)
}

function $$(sel) {
	return document.querySelectorAll(sel)
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