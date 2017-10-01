// SET TOUCH VS CLICK
var CONTACT_EVENT = 'click'
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	CONTACT_EVENT = 'touchend'
}

var SETTINGS = {
	music: true,
	sounds: true,
	origColors: true,
	colors: {
		red: 'rgb(170, 77, 57)',
		blue: 'rgb(39, 88, 107)'
	},
	primaryRed: 'rgb(170, 77, 57)',
	primaryBlue: 'rgb(39, 88, 107)',
	secondaryRed: 'rgb(76, 134, 168)',
	secondaryBlue: 'rgb(192, 74, 188)',
	init: function() {
		if (!SETTINGS.origColors) {
			$$('.slider').forEach(function(el) {
				el.classList.add('alt')
			})
			$('#colors input').checked = false
		}
		this.listen()
	},
	listen: function() {
		console.log('adding listeners')
		$('#colors').addEventListener(CONTACT_EVENT, function(e) {
			if (debounce(e)) return
			if (SETTINGS.origColors) {
				console.log('SETTING ALT COLORS')
				SETTINGS.origColors = false
				SETTINGS.colors.red = SETTINGS.secondaryRed
				// SETTINGS.colors.blue = 'rgb(224, 119, 125)'
				SETTINGS.colors.blue = SETTINGS.secondaryBlue
				$$('.slider').forEach(function(el) {
					el.classList.add('alt')
				})
			}
			else {
				console.log('SETTING PRIMARY COLORS')
				SETTINGS.origColors = true
				SETTINGS.colors.red = SETTINGS.primaryRed
				SETTINGS.colors.blue = SETTINGS.primaryBlue
				$$('.slider').forEach(function(el) {
					el.classList.remove('alt')
				})
			}
		})
		$('#sounds').addEventListener(CONTACT_EVENT, function(e) {
			debounce(e)
		})
		$('#music').addEventListener(CONTACT_EVENT, function(e) {
			if (debounce(e)) return
			if (SETTINGS.music) {
				$('#bg_music').pause()
				console.log('pausing music')
				SETTINGS.music = false
				return
			}
			else {
				$('#bg_music').play()
				console.log('playing music')
				SETTINGS.music = true
			}
		})
	}
}


function debounce(e) {
	// if (new Date() - e.target.getAttribute('clickedAt') < 1500) return true
	if (e.target.tagName !== 'INPUT') return true
	e.target.setAttribute('clickedAt', new Date().getTime())
	return false
}

