var TEMPLATES = {
	play: '\
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
		            <i id="flip" class="material-icons powerUp powerUpRight">compare_arrows</i>\
		            <i id="invert" class="material-icons powerUp powerUpLeft">invert_colors</i>\
		            <p></p>\
		        </div>\
		    </div>\
		    <div id="gameContainer">\
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
		    </div>'
}