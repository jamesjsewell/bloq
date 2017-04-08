var iconsJSON = require('./Contents.js')

var pathBase = 'apple-icon/ios/AppIcon.appiconset/',
	xml = '',
	pat = /(\d+?)x(\d+)@(\d*)/ig

iconsJSON.images.forEach(obj=> { 
	var filename = obj.filename,
		pat = /(\d+?)x(\d+)@*(\d*)/ig,
		dimensions = pat.exec(filename)

	var width = dimensions[1],
		height = dimensions[2],
		multiplier = dimensions[3] || 1

	xml += `\n<icon height="${height * multiplier}" width="${width * multiplier}" src="${pathBase}${filename}" />`
})

console.log(xml)