var playHTML = '\
    <i class="material-icons" id="goBack">menu</i>\
    <p id="nav" class="day" >\
    	<a id="tutorial" href="#">how.</a>\
    	<a href="#" id="restart">restart.</a>\
    	<a target="_blank" href="http://github.com/magentanova/bloq">github.</a>\
    	<a id="night" href="#">night.</a>\
    </p>\
    <div id="leftSide">\
        <h3 id="matchedDisplay">\
            <p id="currentMatches">0</p>\
            <p id="neededMatches">4</p>\
        </h3>\
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
    	<div id="titleWrapper">\
    		<a target="_blank" href="./index.html"><h1>bloq</h1></a><span id="score">0</span>\
    	</div>\
    	<div id="grid"></div>\
    	<div id="playerRowContainer">\
    		<div id="playerRow">\
    		</div>\
    	</div>\
    	<div id="tutorialContainer">\
    		<p class="advice" id="blockAdvice">click on a block to change its color</p>\
    		<p class="advice" id="gridAdvice">match your row to a row in the grid</p>\
    		<p class="advice" id="powerUpAdvice">new levels bring new abilities. you can invert, flip, or slide your row.</p>\
    	</div>\
    </div>'
