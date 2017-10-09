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
			    <p class="advice" id="playButton">play</p>\
		    	<div id="readout">\
		    		<div id="readoutData">\
		                <p id="score">0</p><p id="level">four</p>\
		            </div>\
		            <div id="blockCounter"></div>\
		    	</div>\
		    	<div id="grid"></div>\
		    	<div id="playerRowContainer">\
		    		<div class="row" id="playerRow">\
		    		</div>\
		    	</div>\
		    </div>',
	home: '' + 
'				<div id="home-content">' + 
'					<div id="title-wrapper" class="home">' + 
'							<h1>block12</h1>' + 
'						</div>' + 
'					<div id="menu-boxes">' + 
'						<div class="row">' +
	'						<div class="menu-item top">' + 
	'							<i id="play" class="material-icons">play_arrow</i>' + 
	'						</div>' + 
	'						<div class="menu-item top">' + 
	'							<i id="tutorial" class="material-icons">help</i>' + 
	'						</div>' + 
						'</div>' + 
'						<div class="row">' +
	'						<div class="menu-item">' + 
	'							<i id="settings" class="material-icons">settings</i>' + 
	'						</div>' + 
	'						<div class="menu-item">' + 
	'							<i id="about" class="material-icons">pets</i>' + 
	'						</div>' + 
						'</div>' + 
'					</div>' + 
'					<h2 id="high-score">high score: <span class="score"></span></h2>' + 
'				</div>',
	about: '\
	    <div class="about-pic">\
	    	<div id="title-wrapper" class="home">\
	        	<h1>Moosecat Productions</h1>\
	        </div>\
	    	<img src="./img/business.jpg">\
	    </div>'
	}
		    	
		 //    </div>\		    
		 //    <div id="home-content">\
		 //   		<div id="menu-boxes">\
			// 		<div class="menu-item top">\
			// 			<i id="play" class="material-icons">play_arrow</i>\
			// 		</div>\
			// 		<div class="menu-item top">\
			// 			<i id="tutorial" class="material-icons">help</i>\
			// 		</div>\
			// 		<div class="menu-item">\
			// 			<i id="settings" class="material-icons">settings</i>\
			// 		</div>\
			// 		<div class="menu-item">\
			// 			<i id="about" class="material-icons">pets</i>\
			// 		</div>\
			// 	</div>\
			// </div>\	

