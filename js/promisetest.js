var Bequeathal = function(){
	this.state = "unfulfilled"
	this.cargo = null

	this.do = function (lapse){
		var self = this
		setTimeout(function(){
			self.state = "fulfilled"
			self.cargo = "stuff"
			},lapse)
		return this
	}

	this.then = function(cb) {
		var self = this
		self.interval = setInterval(function() {
			if (self.state === "fulfilled") {
				cb(self.cargo)
				clearInterval(self.interval)
			}
		})
	}
}