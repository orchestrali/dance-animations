// All the information about the dance
var theDance = {};
// True if currently playing through the dance, false if not
var playing = false;
// True if currently designing the dance, false if not
var designing = false;
var wasDesigning = designing;
// The gentleman and lady templates for drawing
var templates = {};
// A grid overlay for drawing
var grid = null;
// The number of dancers
var dancerCount = 0;
// The list of dancer SVG elements
var dancers = {};
// The list of dancer SVG labels
var labels = {};
// The SVG wrapper
var drawer = null;
// The SVG dancers group
var group = null;
// The length of a single bar (milliseconds)
var barPeriod = 1000;
// The current position selected
var curPos = 0;
// The previous position
var prevPos = 0;
// Current dancer's index
var curIndex = 0;
// A dancer's trajectory
var trajectory = null;
// Index of the last checked/unchecked position
var lastChecked = -1;
// Adjustment during a copy/move
var adjust = '';
// Transpose dancers during a copy/move
var transpose = null;
// Replication type
var replicateType = 'long';
// Replication dancer offset
var replicateOffset = 4;
// Replication distance
var replicateDist = 250;
// No. dancers per line when progressing
var perLine = 0;
// Distance offset when progressing
var progressDist = 0;
// Triple-minor progression?
var progressTriple = false;
// Flip horizontally
var flipHoriz = true;
// Becket progression direction
var becketClockwise = true;
// Angle of rotation
var rotateAngle = 0;
// Track whether copying or moving
var moving = false;
// The dance floor size
var floorSize = 800;
// The base URL for the page
var baseUrl = window.location.href.replace(/^(.*\/)[^\/]*$/, '$1');
// The audio player
var audio = null;

$(function() {
	$('#search').keyup(filterDances);
	$('#type,#type2').change(filterDances);
	$('#dance').change(function() {
		var value = $(this).val();
		if (value) {
			if (history) {
				history.pushState('', '', window.location.href.split('#')[0] + '#' + value.replace('.xml', ''));
			}
			$('#wait').show();
			$.get(value, setDance);
		}
	});
	loadList();
	//loadMoves();
	$('#svgdance').svg({onLoad: drawInitial});
	audio = $('#synchMusic')[0];
	$(audio).on('loadedmetadata', function() {
			$('label[for="withMusic"]').text('with music');
		}).on('canplay', function() {
			$('#withMusic').prop('disabled', false);
		}).on('ended', function() {
			if (playing) {
				$('#play').click();
			}
		}).on('error', function() {
			if (theDance.synchMusic) {
				var audioErrors = ['User aborted', 'Network problem',
					'Decoding problem', 'Audio format not supported'];
				alert('Error: ' + audioErrors[this.error.code - 1] || 'Unknown problem');
			}
		});
	$('#position,#prev,#next,#step,#play,#withMusic').prop('disabled', true);
	$('#position').change(function() {
		updatePosition(0, true);
	});
	$('#prev').click(function() {
		updatePosition(-1, true);
	});
	$('#next').click(function() {
		updatePosition(1, true);
	});
	$('#step').click(function() {
		updatePosition(1, false);
	});
	$('#play').click(function() {
		playing = !playing;
		$(this).text(playing ? 'Stop' : 'Play');
		if (playing) {
			if ($('#withMusic').is(':checked')) {
				barPeriod = parseInt(theDance.synchPeriod, 10);
				var pos = parseInt($('#position').val());
				audio.currentTime = pos === 0 ? 0 :
					(getCurrentTime(pos) + theDance.synchDelay) / 1000;
				audio.play();
				setTimeout(function() {
					$('#step').click();
				}, pos === 0 ? theDance.synchDelay : 0);
			}
			else {
				$('#step').click();
			}
		}
		else {
			var pos = parseInt($('#position').val());
			if (pos < $('#position option:last').val() && $('#withMusic').is(':checked')) {
				audio.pause();
			}
		}
	});
	$('#callSheet').click(displayCallSheet);
	$('button.callClose').click(closeCallSheet);
	$('button.callPrint').click(printCallSheet);
	$('#design').click(function() {
		var display = $(this).text() === 'Display';
		$(this).text(display ? 'Design' : 'Display');
		(display ? displayDance() : designDance());
	});
	$('#editEndpoint').click(selectEndpoint);
	$('#editMidpoint').click(selectMidpoint);
	$('#newDance').click(showNewDance);
	$('#newOK').click(createNewDance);
	$('#clearMidpoint').click(clearMidpoint).hide();
	$('#editX,#editY,#editAngle').change(updateDancerDetails);
	$('img.nudge').click(nudgeLocation);
	$('#editClockwise').click(updateDancerDetails);
	$('img.rotate').click(changeHeading);
	$('#replicateConfig').click(configReplicate);
	$('#replicateType').change(function() {
		$('#replicateDist').prop('disabled', $(this).val() !== 'long');
	});
	$('#replicateOK').click(saveReplicate);
	$('#move').click(moveDancer);
	$('#angle1,#dist1,#angle2,#dist2').keydown(function(e) {
		if (e.keyCode === 13) {
			calculateCoords();
		}
	});
	$('#calcCoords').click(calculateCoords);
	$('#designArea').tabs({activate: checkOutputAndCall});
	$('#editDance').find('input,textarea').change(updateDanceDetails);
	$('#actionPosition').change(changeAction).change();
	$('#goPosition').click(actionPosition);
	$('#transposeOK').click(transposeDancers);
	$('#progressOK').click(progressDancers);
	$('#progress3in4OK').click(progress3in4Dancers);
	$('#progressBecketOK').click(progressBecketDancers);
	$('#flipOK').click(flipDancers);
	$('#rotateOK').click(rotateDancers);
	$('button.cancel').click(cancelDialog);
	$('#tablePositions').on('click', 'tbody tr td:not(:nth-child(2))', function() {
		$('#position').val($(this).parent().index());
		drawPosition(true);
	})
	$('#tablePositions').on('click', 'input:checkbox', function(event) {
		if (event.shiftKey && lastChecked > -1) {
			var end = $(this).closest('tr').index();
			$('#tablePositions input:checkbox:lt(' + (end + 1) + '):gt(' + lastChecked + ')').
				prop('checked', $(this).is(':checked'));
			lastChecked = -1;
		}
		lastChecked = $(this).closest('tr').index();
		var curSelected = $('#tablePositions input[value="p' + curPos + '"]:checked');
		$('#selectedPosns').prop('disabled', curSelected.length === 0);
	})
	$('#barPeriod,#editCall').change(updateCall);
	$('#showGrid').click(function() {
		$(grid).toggle();
	});
	$('#editPeriod').val(barPeriod).change(function() {
		barPeriod = parseInt($(this).val(), 10) || 1000;
	});
	$('#floorSize').val(floorSize).change(function() {
		floorSize = parseInt($(this).val(), 10) || 800;
		var halfFloor = floorSize / 2;
		drawer.configure({viewBox: '-' + halfFloor + ' -' + halfFloor + ' ' + floorSize + ' ' + floorSize});
	});
	$('#dialogUnderlay,div.dialog').hide();
});

/* Filter the list of dances based on categories and search term. */
function filterDances() {
	var search = $('#search').val().trim();
	var types = [$('#type').val(), $('#type2').val()].join('.').replace(/^\.\.?|\.$/, '');
	$('#dance option').prop('disabled', false).show();
	if (search || types) {
		search = new RegExp(search, 'i');
		$('#dance option').each(function() {
			var option = $(this);
			if (option.is(types ? ':not(.' + types + ')' : 'all') || !option.text().match(search)) {
				option.prop('disabled', true).hide();
			}
		});
	}
}

/* Load one of two lists of dances. */
function loadList() {
	$.get('dances.xml', function(data) {
    console.log(data);
			var allTypes = [];
			var options = '';
			$('dance', data).each(function() {
				var types = $(this).attr('type') || '';
				$.each(types.split(' '), function(i, type) {
					if (type && $.inArray(type, allTypes) === -1) {
						allTypes.push(type);
					}
				});
				options += '<option value="' + $(this).attr('def') + '" class="' + types + '">' + $(this).text() + '</option>';
			});
			$('#dance').html(options);
			allTypes = allTypes.sort();
			options = '<option value="">All</option>';
			$.each(allTypes, function(i, type) {
				options += '<option value="' + type + '">' + type.replace(/_/g, ' ') + '</option>';
			});
			$('#type,#type2').html(options);
			$('#wait').hide();
			$('#dance').val(window.location.hash.replace(/#/, '') + '.xml').change();
		}, 'xml');
}

/* Load the list of dance movements. */
function loadMoves() {
	$.get('danceMoves.xml', function(data) {
		var moves = '';
		$('move', data).each(function() {
			moves += '<option value="' + $(this).attr('def') + '">' + $(this).text() + '</option>';
		});
		$('#danceMove').html(moves);
	}, 'xml');
}

/* Create a dancer position object.
   @param  x           (number) their x-coordinate
   @param  y           (number) their y-coordinate
   @param  angle       (number) their angle (0 is facing south, 90 is facing west)
   @param  clockwise   (boolean) true to use a clockwise turn to reach
                       this position, false if anti-clockwise
   @param  x2          (number, optional) their midpoint x-coordinate
   @param  y2          (number, optional) their midpoint y-coordinate
   @param  angle2      (number, optional) their midpoint angle
   @param  clockwise2  (boolean, optional) true to use a clockwise turn to reach
                       the midpoint, false if anti-clockwise
   @return  the position object */
function position(x, y, angle, clockwise, x2, y2, angle2, clockwise2) {
	return $.extend({x: x, y: y, angle: angle, clockwise: clockwise},
		(x2 != null ? {x2: x2, y2: y2, angle2: angle2, clockwise2: clockwise2} :
		{x2: x, y2: y, angle2: angle, clockwise2: clockwise}));
}

/* Load the dance information.
   @param  data  (string) the XML description of the dance */
function setDance(data) {
	data = $(data);
	var dancers = [];
	$('dancer', data).each(function() {
		dancers.push([$(this).attr('label'), $(this).attr('type')]);
	});
	var positions = [];
	$('position', data).each(function() {
		var position = {call: $('call', this).text(), period: parseInt($(this).attr('period'), 10)};
		$('place', this).each(function(i) {
			var place = $(this);
			var mid = (place.attr('x2') ? '2' : '');
			position[i] = {x: parseInt(place.attr('x'), 10), y: parseInt(place.attr('y'), 10),
				angle: parseInt(place.attr('a'), 10), clockwise: place.attr('cw') === 'true',
				x2: parseInt(place.attr('x' + mid), 10), y2: parseInt(place.attr('y' + mid), 10),
				angle2: parseInt(place.attr('a' + mid), 10),
				clockwise2: place.attr('cw' + mid) === 'true'};
		});
		positions.push(position);
	});
	var synchMusic = $('synchMusic', data);
	theDance = {name: $('name', data).text(), formation: $('formation', data).text(),
		music: $('music', data).text(), source: $('sources', data).text(), 
		notes: $('notes', data).text(), synchMusic: synchMusic.text(),
		synchAttribution: synchMusic.attr('attribution'),
		synchPeriod: parseInt(synchMusic.attr('period') || '1000', 10),
		synchDelay: parseInt(synchMusic.attr('delay') || '1000', 10),
		dancers: dancers, positions: positions,
		floorSize: parseInt($('positions', data).attr('floorSize') || '800', 10)};
	loadTheDance();
	$('#wait').hide();
}

/* Initialise the SVG canvas.
   @param  svg  (SVGWrapper) the SVG wrapper */
function drawInitial(svg) {
	$('#pluginReqd').hide();
	drawer = svg;
	var halfFloor = floorSize / 2;
	svg.configure({viewBox: '-' + halfFloor + ' -' + halfFloor + ' ' + floorSize + ' ' + floorSize});
	var defs = svg.defs();
	// Create gent and lady templates
	templates.gent = svg.group(defs, 'gent', {fill: '#ccccff', stroke: '#000088'});
	svg.ellipse(templates.gent, 0, 0, 50, 20);
	svg.ellipse(templates.gent, 0, 0, 18, 20);
	svg.rect(templates.gent, 0, -5, 50, 10, 3, 3, {transform: 'translate(48, 0) rotate(135)'});
	svg.rect(templates.gent, 0, -5, 50, 10, 3, 3, {transform: 'translate(-48, 0) rotate(45)'});
	templates.lady = svg.group(defs, 'lady', {fill: '#ffcccc', stroke: '#880000'});
	svg.ellipse(templates.lady, 0, 0, 50, 40);
	svg.ellipse(templates.lady, 0, 0, 50, 20);
	svg.ellipse(templates.lady, 0, 0, 18, 20);
	svg.rect(templates.lady, 0, -5, 50, 10, 3, 3, {transform: 'translate(48, 0) rotate(135)'});
	svg.rect(templates.lady, 0, -5, 50, 10, 3, 3, {transform: 'translate(-48, 0) rotate(45)'});
	// Create grid
	grid = svg.group({fill: 'none', stroke: '#808080', display: 'none'});
	for (var i = -halfFloor; i <= halfFloor; i += 100) {
		svg.line(grid, -halfFloor, i, halfFloor, i);
		svg.line(grid, i, -halfFloor, i, halfFloor);
	}
	// Create a group for the dancers
	group = svg.group();
	// Create trajectory markers
	var start = svg.group('start',
		{fill: '#ccffcc', stroke: '#008800', display: 'none', zIndex: 10});
	svg.polyline(start, [[-40,-20], [40,-20], [0,20]]);
	var midpoint = svg.group('midpoint',
		{fill: '#ccffcc', stroke: '#008800', display: 'none', zIndex: 10});
	svg.polyline(midpoint, [[-30,-15], [30,-15], [0,15]]);
	trajectory = {start: $(start), midpoint: $(midpoint)};
	trajectory.midpoint.click(selectMidpoint);
}

/* Load a new dance. */
function loadTheDance() {
	$('#name').html(theDance.name || '&#160;');
	$('#formation').html(theDance.formation || '&#160;');
	$('#music').html(theDance.music || '&#160;');
	$('#source').html(theDance.source || '&#160;');
	$('#notes').html(lineBreaks(makeLinks(theDance.notes || '&#160;')));
	audio.pause();
	audio.src = (theDance.synchMusic ? baseUrl + 'music/' + theDance.synchMusic : '');
	audio.load();
	$('#withMusic').prop('checked', false);
	// Remove previous dancers and labels
	$.each(dancers, function(id, dancer) {
		dancer.unbind('click');
		drawer.remove(dancer);
	});
	$.each(labels, function(id, label) {
		label.unbind('click');
		drawer.remove(label);
	});
	dancerCount = 0;
	dancers = {};
	labels = {};
	curPos = 0;
	prevPos = 0;
	curIndex = 0;
	trajectory.start.hide();
	trajectory.midpoint.hide();
	// Add new dancers and labels
	$.each(theDance.dancers, function(i, values) {
		dancerCount++;
		var id = values[0];
		dancers[i] = $(drawer.clone(group, templates[values[1]])).
			attr('transform', transform(theDance.positions[0][i], false, '', 0)).
			attr('id', id).
			click(function() {
				selectDancer(i, true);
			});
		labels[i] = $(drawer.text(group, 0, 0, id.toUpperCase(),
			{transform: transform(theDance.positions[0][i], false, id),
			fontFamily: 'Verdana,Arial,sans-serif', fontWeight: 'bold'})).
			click(function() {
				selectDancer(i, true);
			});
	});
	// Initialise controls
	var halfFloor = theDance.floorSize / 2;
	drawer.configure({viewBox: '-' + halfFloor + ' -' + halfFloor + ' ' + theDance.floorSize + ' ' + theDance.floorSize});
	$('#call').html('&nbsp;');
	$('#position').prop('disabled', false);
	$('#prev').prop('disabled', true);
	$('#next,#step,#play').prop('disabled', theDance.positions.length === 1);
	$('#withMusic').prop('disabled', true);
	$('#selectedPosns').prop('checked', false).prop('disabled', true);
	var html = '';
	$.each(theDance.positions, function(i, pos) {
		html += '<option title="' +
			(pos.call || '').substring(0, 50).replace(/"/g, '&quot;') +
			'">' + i + '</option>';
	});
	$('#position').html(html);
	$('#floorSize').val(theDance.floorSize);
	playing = true;
	$('#play').click();
	$('label[for="withMusic"]').text(theDance.synchMusic ? 'loading music' : 'no music');
	$('#musicAttribution').html(getDanceAttribution());
	if (designing) {
		designDance();
	}
	else {
		displayDance();
	}
}

/* Generate the SVG transform attribute.
   @param  pos        (object) the current dancer position
   @param  midpoint   (boolean) true to use the midpoint information, false for the endpoint
   @param  label      (string) the text of the dancer's label, if it is one
   @param  prevAngle  (number) the previous angle for this dancer
   @return  the SVG transform value */
function transform(pos, midpoint, label, prevAngle) {
	var suffix = (midpoint ? '2' : '');
	var angle = pos['angle' + suffix];
	// Wrap angles depending on direction
	if (pos['clockwise' + suffix]) {
		while (prevAngle > angle) angle += 360;
		angle -= (prevAngle + 360 < angle ? 360 : 0);
	}
	else {
		while (prevAngle < angle) angle -= 360;
		angle += (prevAngle - 360 > angle ? 360 : 0);
	}
	var offset = (label ? {x: -6 * label.length, y: 5} : {x: 0, y: 0}); // Labels are offset
	return 'translate(' + (pos['x' + suffix] + offset.x) + ' ' +
		(pos['y' + suffix] + offset.y) + ')' + (label ? '' : ' rotate(' + angle + ')');
}

/* Change the position and display.
   @param  offset     (number) the amount to change the position by
   @param  immediate  (boolean) true to skip animations */
function updatePosition(offset, immediate) {
	var pos = parseInt($('#position').val()) + offset;
	if (pos < $('#position option').length) {
		$('#position').val(pos);
		$('#position,#prev,#next,#step').prop('disabled', true);
		drawPosition(immediate);
	}
	else {
		$('#play').click();
	}
}

/* Draw the current position.
   @param  immediate  (boolean) true to skip animations */
function drawPosition(immediate) {
	if (!theDance.positions) {
		return;
	}
	curPos = parseInt($('#position').val());
	prevPos = Math.max(curPos - 1, 0);
	var position = theDance.positions[curPos];

	if (immediate || position.call) {
		$('#call').html(position && position.call || '&nbsp;');
	}
	$('#tablePositions tr').removeClass('ui-state-highlight').
		eq(curPos + 1).addClass('ui-state-highlight');
	// Wait for all animations to finish before proceeding
	var onFinish = waitForAll(dancerCount, function() {
		$('#position').prop('disabled', false);
		$('#prev').prop('disabled', curPos === 0);
		$('#next,#step,#play').prop('disabled', curPos === $('#position option').length - 1);
		if (designing) {
			designPosition();
			selectDancer(curIndex);
		}
		if (playing) {
			$('#step').click();
		}
	});
	// Draw each dancer
	$.each(dancers, function(i, dancer) {
		drawDancer(i, dancer, onFinish, immediate);
	});
	if (designing) {
		$('#editPos').val(curPos);
		$('#barPeriod').val(position.period || '');
		$('#editCall').val(position.call || '');
		selectDancer(curIndex);
		var curSelected = $('#tablePositions input[value="p' + curPos + '"]:checked');
		$('#selectedPosns').prop('disabled', curSelected.length === 0);
	}
}

/* Calculate the elapsed time for the current bar.
   @param  curPos  (number) the current dance position
   @return  (number)  the current bar period */
function getCurrentTime(curPos) {
	var time = 0;
	var period = barPeriod;
	for (var i = 1; i <= curPos; i++) {
		if (theDance.positions[i].period) {
			period = theDance.positions[i].period;
		}
		time += period + 10;
	}
	return time;
}

/* Calculate the period for the current bar.
   @param  curPos  (number) the current dance position
   @return  (number)  the current bar period */
function getBarPeriod(curPos) {
	for (var i = curPos; i > 0; i--) {
		if (theDance.positions[i].period) {
			return theDance.positions[i].period;
		}
	}
	return barPeriod;
}

/* Draw an individual dancer from one position to the next.
   @param  index      (number) the index of the dancer to draw
   @param  dancer     (SVGElement) their SVG counterpart
   @param  onFinish   (function) callback following animation
   @param  immediate  (boolean) true to skip animations
   @param  revert     (boolean, optional) true to revert to previous position first */
function drawDancer(index, dancer, onFinish, immediate, revert) {
	if (revert) {
		// Return to previous position
		dancer.attr('transform', transform(theDance.positions[prevPos][index], false, ''));
		labels[index].attr('transform', transform(theDance.positions[prevPos][index], false, labels[index].text()));
	}
	var pos = theDance.positions[curPos][index];
	var xform = dancer.attr('transform').replace(/rotate\((-?\d+)(,0,0)?\)/,
			function(match, group) {
				var angle = parseInt(group, 10);
				angle += (angle < 0 ? 360 : (angle >= 360 ? -360 : 0)); // Ensure 0 <= angle < 360
				angle += (angle < 0 ? 360 : (angle >= 360 ? -360 : 0));
				return 'rotate(' + angle + ')';
			}).
		replace(/matrix\((-?[\d\.]+) (-?[\d\.]+) (-?[\d\.]+) (-?[\d\.]+) (-?[\d\.]+) (-?[\d\.]+)\)/,
			function(match, group1, group2, group3, group4, group5, group6) {
				var rightAngle = [270, 180, 0, 90, 0];
				var angle = (Math.abs(group1 - group2) === 1 ?
					rightAngle[2 * group2 + group1 + 2] : Math.atan(group2 / group1));
				return 'translate(' + group5 + ' ' + group6 + ') rotate(' + angle + ')';
			});
	dancer.attr('transform', xform);
	var prevAngle = parseInt(xform.replace(/.*rotate\((\d+)\).*/, '$1'), 10);
	var period = (immediate ? 0 : getBarPeriod(curPos));
	if (!immediate && (pos.x2 !== pos.x || pos.y2 !== pos.y || pos.angle2 !== pos.angle)) {
		period /= 2;
		// Animate to midpoint
		dancer.animate({svgTransform: transform(pos, true, '', prevAngle)}, period, 'linear');
		labels[index].animate({svgTransform: transform(pos, true, labels[index].text())}, period, 'linear');
		// Wrap angle depending on direction
		prevAngle = pos.angle2 + (pos.clockwise2 && prevAngle > pos.angle2 ? 360 :
			(!pos.clockwise2 && prevAngle < pos.angle2 ? -360 : 0));
	}
	// Animate to endpoint
	dancer.animate({svgTransform: transform(pos, false, '', prevAngle)},
		period, 'linear', onFinish);
	labels[index].animate({svgTransform: transform(pos, false, labels[index].text())}, period, 'linear');
}

/* Generate an animation callback that waits for several animations to finish.
   @param  count     (number) the number of animations to wait for
   @param  callback  (function) the function to call at the end of them all */
function waitForAll(count, callback) {
	var allCount = count;
	return function() {
		if (--allCount === 0) {
			callback();
		}
	};
}

/* Display the call sheet for the dance. */
function displayCallSheet() {
	wasDesigning = designing;
	if (designing) {
		$('#design').click();
	}
	var html = '';
	if (!theDance.positions) {
		html = '<h2>No dance defined</h2>';
	}
	else {
		html = '<h2>' + theDance.name + '</h2>' +
			'<p><label>Formation:</label> ' + theDance.formation + '</p>' +
			(theDance.music ? '<p><label>Music:</label> ' + theDance.music + '</p>' : '') +
			(theDance.source ? '<p><label>Source:</label> ' + theDance.source + '</p>' : '') +
			(theDance.notes ? '<p><label>Notes:</label> ' + lineBreaks(theDance.notes) + '</p>' : '') +
			'<table class="callSheet">';
		for (var start = 1; start < theDance.positions.length; start++) {
			if (theDance.positions[start].call) {
				var end = start + 1;
				while (end < theDance.positions.length && !theDance.positions[end].call) {
					end++;
				}
				html += '<tr><td class="bars">' + start + (start === --end ? '' : '-' + end) + '</td><td>' +
					theDance.positions[start].call + '</td></tr>';
			}
		}
		html += '</table>';
	}
	$('#dialogUnderlay').show();
	$('#callSheetOutput,#callSheetOutput2').html(html);
	$('button.callPrint').toggle(!!theDance.positions);
	$('#callSheetDialog').centre().show();
}

/* Hide the callsheet popup. */
function closeCallSheet() {
	$('#dialogUnderlay,#callSheetDialog').hide();
	if (wasDesigning) {
		$('#design').click();
	}
}

/* Print the callsheet popup. */
function printCallSheet() {
	window.print();
}

/* Return to display mode. */
function displayDance() {
	designing = false;
	$('#designArea,#designPanel,#anglePanel').hide();
	trajectory.start.hide();
	trajectory.midpoint.hide();
}

/* Load the dance definition into the design area. */
function designDance() {
	designing = true;
	$('#designArea,#designPanel,#anglePanel').show();
	trajectory.start.show();
	trajectory.midpoint.show();
	$('#editName').val(theDance.name);
	$('#editFormation').val(theDance.formation);
	$('#editMusic').val(theDance.music);
	$('#editSource').val(theDance.source);
	$('#editNotes').val(theDance.notes);
	$('#editSynchMusic').val(theDance.synchMusic);
	$('#editSynchAttribution').val(theDance.synchAttribution);
	$('#editSynchPeriod').val(theDance.synchPeriod);
	$('#editSynchDelay').val(theDance.synchDelay);
	curPos = Math.min(parseInt($('#position').val()),
		(theDance.positions ? theDance.positions.length - 1 : 0));
	prevPos = Math.max(curPos - 1, 0);
	$('#editPos').val(curPos);
	$('#barPeriod').val(theDance.positions && theDance.positions[curPos].period || '');
	$('#editCall').val(theDance.positions && theDance.positions[curPos].call || '');
	curIndex = null;
	var html = '';
	var prompt = 'Dancers:';
	if (theDance.dancers) {
		$.each(theDance.dancers, function(i, values) {
			curIndex = curIndex || values[0];
			html += '<p><label>' + prompt + '</label>' +
				'<input type="text" class="dancerLabel" value="' + values[0] + '"> ' +
				'<label class="radioLabel"><input type="radio" name="' + values[0] + 'Sex" ' +
				'value="gent"' + (values[1] === 'gent' ? ' checked' : '') + '> Gent</label> ' +
				'<label class="radioLabel"><input type="radio" name="' + values[0] + 'Sex" ' +
				'value="lady"' + (values[1] === 'lady' ? ' checked' : '') + '> Lady</label></p>';
			prompt = '&nbsp;';
		});
	}
	$('#editDancers').html(html).
		find('input.dancerLabel').change(function() { // Change the dancer's label
			var index = $(this).closest('p').index();
			var label = $(this).val();
			theDance.dancers[index][0] = label;
			labels[index].text(label);
		}).end().
		find('input:radio').click(function() { // Change the template for this dancer
			var index = $(this).closest('p').index();
			var template = $(this).val();
			if (theDance.dancers[index][1] !== template) {
				theDance.dancers[index][1] = template;
				dancers[index].unbind('click');
				drawer.remove(dancers[index]);
				dancers[index] = $(drawer.clone(group, templates[template])).
					attr('transform', transform(theDance.positions[curPos][index], false, '', 0)).
					attr('id', theDance.dancers[index][0]).
					click(function() {
						selectDancer(index, true);
					});
				group.appendChild(labels[index][0]);
			}
			drawDancer(index, dancers[index], null, true);
		});
	html = '';
	var select = '';
	if (theDance.positions) {
		$.each(theDance.positions, function(i, pos) {
			html += '<tr><td class="position">' + i + '</td>' +
				'<td><input type="checkbox" class="positionCheck" value="p' + i + '"></td>' +
				'<td>' + (pos.period || '') + '</td><td>' + (pos.call || '') + '</td></tr>';
			select += '<option title="' +
				(pos.call || '').substring(0, 50).replace(/"/g, '&quot;') +
				'">' + i + '</option>';
		});
	}
	$('#tablePositions tbody').html(html);
	$('#position,#afterPosition').html(select).val(curPos);
	$('#afterPosition').prepend('<option>end</option>');
	designPosition();
	drawPosition(true);
	selectDancer(curIndex, true);
}

/* Display dancers' details for a position. */
function designPosition() {
	var table = '';
	if (theDance.positions) {
		$.each(theDance.positions[curPos], function(key, dancer) {
			if (key === 'call') {
				return;
			}
			var midpoint = (dancer.x2 !== dancer.x || dancer.y2 !== dancer.y ||
				dancer.angle2 !== dancer.angle);
			table += '<tr><td>' + key + '</td><td>' + dancer.x + '</td><td>' + dancer.y + '</td>' +
				'<td>' + dancer.angle + '</td><td>' + dancer.clockwise + '</td>' +
				'<td>' + (midpoint ? dancer.x2 : '') + '</td>' +
				'<td>' + (midpoint ? dancer.y2 : '') + '</td>' +
				'<td>' + (midpoint ? dancer.angle2 : '') + '</td>' +
				'<td>' + (midpoint ? dancer.clockwise2 : '') + '</td></tr>';
		});
	}
	$('#tablePosition tbody').html(table);
}

/* Update the interface on a change of position action. */
function changeAction() {
	var action = $('#actionPosition').val();
	$('#countPosition').toggle(action === 'Add');
	$('#danceMove').toggle(action === 'Insert');
	$('#actionAfter').toggle($.inArray(action, ['Add', 'Copy', 'Move', 'Insert']) > -1);
	$('#actionAdjust').toggle($.inArray(action, ['Copy', 'Move']) > -1);
}

/* Add/delete/copy/move one or more positions in the dance. */
function actionPosition() {
	theDance.modified = true;
	switch ($('#actionPosition').val()) {
		case 'Add':    addPosition(); break;
		case 'Delete': deletePosition(); break;
		case 'Copy':   copyMovePosition(false); break;
		case 'Move':   copyMovePosition(true); break;
		case 'Insert': insertPosition(); break;
	}
	$('#actionAdjust').val('');
}

/* Add one or more positions to the dance. */
function addPosition() {
	var count = parseInt($('#countPosition').val(), 10);
	if (count <= 0) {
		alert('Please enter the number of new positions');
		$('#countPosition').focus();
		return;
	}
	var after = $('#afterPosition').val();
	after = (after === 'end' ? theDance.positions.length - 1 : parseInt(after, 10));
	var posn = $.extend(true, {}, theDance.positions[after], {call: ''});
	removeMidpoints(posn);
	for (var i = 0; i < count; i++) { // Duplicate 'after' position
		theDance.positions.splice(after + 1, 0, $.extend(true, {}, posn)); // And add
	}
	designDance();
	return;
}

/* Remove midpoints when adding positions. */
function removeMidpoints(posn) {
	$.each(posn, function(key, value) {
		if (key !== 'call') {
			value.x2 = value.x;
			value.y2 = value.y;
			value.angle2 = value.angle;
			value.clockwise2 = value.clockwise;
		}
	});
}

/* Prepare for copy/move one or more positions within the dance. */
function copyMovePosition(move) {
	var source = $('#tablePositions input:checked');
	if (!source.length) {
		alert('Please select the positions to ' + (move ? 'move' : 'copy'));
		return;
	}
	moving = move;
	transpose = null;
	perLine = 0;
	progressDist = 0;
	progressTriple = false;
	becketClockwise = true;
	flipHoriz = true;
	rotateAngle = 0;
	adjust = $('#actionAdjust').val();
	if (adjust === 'transpose') {
		$('#dialogUnderlay').show();
		var html = '';
		var options = '';
		$.each(theDance.dancers, function(id, dancer) {
			options += '<option value="' + id + '">' + dancer[0] + '</option>';
		});
		$.each(theDance.dancers, function(id, dancer) {
			html += '<p><span class="left">' + dancer[0] + ' --> </span><select id="d' + id + '">' +
				options + '</select></p>';
		});
		$('#transposeOutput').html(html).find('select').each(function(i) {
			$(this).val(i);
		});
		$('#transposeDialog').centre().show();
	}
	else if (adjust === 'linear') {
		$('#dialogUnderlay').show();
		$('#linearDialog').centre().show();
	}
	else if (adjust === '3in4') {
		$('#dialogUnderlay').show();
		$('#progress3in4Dialog').centre().show();
	}
	else if (adjust === 'becket') {
		$('#dialogUnderlay').show();
		$('#becketDialog').centre().show();
	}
	else if (adjust === 'flip') {
		$('#dialogUnderlay').show();
		$('#flipDialog').centre().show();
	}
	else if (adjust === 'rotate') {
		$('#dialogUnderlay').show();
		$('#rotateDialog').centre().show();
	}
	else {
		doCopyMovePosition(move);
	}
}

/* Copy/move one or more positions within the dance. */
function doCopyMovePosition(move) {
	var posns = [];
	var source = $('#tablePositions input:checked');
	source.each(function() { // Clone positions
		var index = parseInt($(this).val().replace(/p/, ''), 10);
		var newPosition = $.extend(true, {}, theDance.positions[index]);
		if (adjust === 'transpose') { // Swap dancers around
			var transposePosition = {call: newPosition.call, period: newPosition.period};
			$.each(transpose, function(i, value) {
				transposePosition[i] = newPosition[value];
			});
			newPosition = transposePosition;
		}
		else if (adjust === 'linear') {
			progressLinearly(newPosition);
		}
		else if (adjust === '3in4') {
			progress3in4(newPosition);
		}
		else if (adjust === 'becket') {
			progressBecket(newPosition);
		}
		else if (adjust === 'flip') {
			flip(newPosition);
		}
		else if (adjust === 'rotate') {
			rotate(newPosition);
		}
		posns.push(newPosition);
	});
	var after = $('#afterPosition').val();
	after = (after === 'end' ? theDance.positions.length - 1 : parseInt(after, 10));
	for (var i = posns.length - 1; i >= 0; i--) {
		theDance.positions.splice(after + 1, 0, posns[i]); // And copy
	}
	if (move) {
		for (var i = source.length - 1; i >= 0; i--) { // Delete originals
			var index = parseInt($(source[i]).val().replace(/p/, ''));
			theDance.positions.splice(index + (index > after ? source.length : 0), 1);
		}
	}
	designDance();
	return;
}

/* Perform a linear progression. */
function progressLinearly(position) {
	var dir = -1;
	var setDist = progressDist * (dancerCount / perLine - 1);
	var subset = progressTriple ? 3 : 2;
	var save = [];
	for (var i = 0; i < dancerCount; i++) {
		var line = Math.floor(i / perLine);
		if (i % perLine === 0 && line % subset < 2) {
			dir = -dir;
		}
		if (progressTriple) {
		}
		else {
			if (i >= perLine && i < 2 * perLine) { // 2nd line
				position[i] = $.extend({}, position[dancerCount - 2 * perLine + i]);
				position[i].x = position[i].x2 = 75 * (i % 2 === 0 ? -1 : +1);
				position[i].y = position[i].y2 = -setDist / 2;
				position[i].angle = position[i].angle2 = (i % 2 === 0 ? 270 : 90);
			}
			else if (line % 2 === 0 && i >= dancerCount - perLine) { // Odd last line
				position[i] = $.extend({}, save[i - perLine]);
				position[i].y += progressDist;
				position[i].y2 += progressDist;
			}
			else {
				if (i >= dancerCount - 2 * perLine && i < dancerCount - perLine) { // 2nd last
					save[i] = $.extend({}, position[i]);
				}
				position[i].y += dir * progressDist;
				position[i].y2 += dir * progressDist;
			}
		}
	}
}

/* Perform a 3 in 4 progression on a position. */
function progress3in4(position) {
	var copyOne = function(src, dest) {
		position[dest].x = position[src].x;
		position[dest].y = position[src].y + progressDist;
		position[dest].angle = position[src].angle;
		position[dest].clockwise = position[src].clockwise;
		position[dest].x2 = position[src].x2;
		position[dest].y2 = position[src].y2 + progressDist;
		position[dest].angle2 = position[src].angle2;
		position[dest].clockwise2 = position[src].clockwise2;
	};
	copyOne(5, 7);
	copyOne(4, 6);
	copyOne(3, 5);
	copyOne(2, 4);
	var setOne = function(dest, x, a) {
		position[dest].x = x;
		position[dest].y = -1.5 * progressDist;
		position[dest].angle = a;
		position[dest].clockwise = true;
		position[dest].x2 = x;
		position[dest].y2 = -1.5 * progressDist;
		position[dest].angle2 = a;
		position[dest].clockwise2 = true;
	};
	setOne(3, 100, 90);
	setOne(2, -100, 270);
	position[1].y += progressDist;
	position[1].y2 += progressDist;
	position[0].y += progressDist;
	position[0].y2 += progressDist;
}

/* Perform a Becket progression on a position. */
function progressBecket(position) {
	var dir = (becketClockwise ? +1 : -1);
	for (var i = 0; i < dancerCount; i++) {
		if (i === 1 + dir) {
			position[i].x = position[i].x2 = 75;
			position[i].y = position[i].y2 = Math.floor(dancerCount / 4) * -125 + 75;
			position[i].angle = position[i].angle2 = 90;
		}
		else if (i === 2 + dir) {
			position[i].x = position[i].x2 = -75;
			position[i].y = position[i].y2 = Math.floor(dancerCount / 4) * -125 + 75;
			position[i].angle = position[i].angle2 = 270;
		}
		else if (i === dancerCount - 3 - dir) {
			position[i].x = position[i].x2 = -75;
			position[i].y = position[i].y2 = Math.floor(dancerCount / 4) * 125 - 50;
			position[i].angle = position[i].angle2 = 270;
		}
		else if (i === dancerCount - 2 - dir) {
			position[i].x = position[i].x2 = 75;
			position[i].y = position[i].y2 = Math.floor(dancerCount / 4) * 125 - 50;
			position[i].angle = position[i].angle2 = 90;
		}
		else {
			var dir2 = Math.floor(i / 2) % 2 === 0 ? +1 : -1;
			position[i].y += progressDist * dir * dir2;
			position[i].y2 += progressDist * dir * dir2;
		}
	}
}

/* Perform a flip on a position. */
function flip(position) {
	var dir = flipHoriz ? +1 : -1;
	var cx = -dir;
	var cy = dir;
	var flipAngle = function(a) {
		return (dir === +1 ? (a ? 360 - a : 0) : (a <= 180 ? 180 - a : 540 - a));
	};
	for (var i = 0; i < dancerCount; i++) {
		position[i].x *= cx;
		position[i].y *= cy;
		position[i].angle = flipAngle(position[i].angle);
		position[i].clockwise = !position[i].clockwise;
		position[i].x2 *= cx;
		position[i].y2 *= cy;
		position[i].angle2 = flipAngle(position[i].angle2);
		position[i].clockwise2 = !position[i].clockwise2;
	}
}

/* Perform a rotation on a position. */
function rotate(position) {
	var cos = Math.cos(rotateAngle / 180 * Math.PI);
	var sin = Math.sin(rotateAngle / 180 * Math.PI);
	for (var i = 0; i < dancerCount; i++) {
		var save = position[i].x;
		position[i].x = roundTo(save * cos - position[i].y * sin, 5);
		position[i].y = roundTo(save * sin + position[i].y * cos, 5);
		position[i].angle = (position[i].angle + rotateAngle + 360) % 360;
		save = position[i].x2;
		position[i].x2 = roundTo(save * cos - position[i].y2 * sin, 5);
		position[i].y2 = roundTo(save * sin + position[i].y2 * cos, 5);
		position[i].angle2 = (position[i].angle2 + rotateAngle + 360) % 360;
	}
}

/* Round to a given step value. */
function roundTo(value, step) {
	return Math.round(value / step) * step;
}

/* Delete selected positions, after confirmation. */
function deletePosition() {
	var deletions = $('#tablePositions input:checked');
	if (!deletions.length) {
		alert('Please select the positions to delete');
		return;
	}
	else {
		var bars = [];
		var firstBar;
		var lastBar;
		function addBars() {
			if (firstBar !== undefined) {
				bars.push(firstBar + (lastBar === firstBar ? '' : '-' + lastBar));
				firstBar = lastBar = undefined;
			}
		}
		$('#tablePositions input').each(function(index) {
			if (this.checked) {
				if (firstBar === undefined) {
					firstBar = index;
				}
				lastBar = index;
			} else {
				addBars();
			}
		})
		addBars();
		if (!confirm('Confirm deletion of these positions:\n' + bars.join())) {
			return;
		}
	}
	for (var i = deletions.length - 1; i >= 0; i--) {
		var index = parseInt($(deletions[i]).val().replace(/p/, ''), 10);
		theDance.positions.splice(index, 1);
	}
	curPos = Math.min(curPos, theDance.positions.length);
	designDance();
	return;
}

/* Insert dance move. */
function insertPosition() {
	$.get($('#danceMove').val(), function(data) {
		var posns = [];
		$('position', data).each(function() {
			var position = {call: $('call', this).text()};
			$('place', this).each(function(i) {
				var place = $(this);
				var mid = (place.attr('x2') ? '2' : '');
				position[i] = {x: parseInt(place.attr('x'), 10), y: parseInt(place.attr('y'), 10),
					angle: parseInt(place.attr('a'), 10), clockwise: place.attr('cw') === 'true',
					x2: parseInt(place.attr('x' + mid), 10), y2: parseInt(place.attr('y' + mid), 10),
					angle2: parseInt(place.attr('a' + mid), 10),
					clockwise2: place.attr('cw' + mid) === 'true'};
			});
			posns.push(position);
		});
		var after = $('#afterPosition').val();
		after = (after === 'end' ? theDance.positions.length - 1 : parseInt(after, 10));
		for (var i = posns.length - 1; i >= 0; i--) {
			theDance.positions.splice(after + 1, 0, posns[i]); // And copy
		}
		designDance();
	}, 'xml');
}

/* Configure the replication. */
function configReplicate() {
	$('#dialogUnderlay').show();
	$('#replicateDialog').centre().show();
}

/* Save the replication configuration. */
function saveReplicate() {
	if (!/^\d+$/.test($('#replicateOffset').val())) {
		alert('Please enter a valid number');
		$('#replicateOffset').focus();
		return;
	}
	if (!/^\d+$/.test($('#replicateDist').val())) {
		alert('Please enter a valid number');
		$('#replicateDist').focus();
		return;
	}
	replicateType = $('#replicateType').val();
	replicateOffset = parseInt($('#replicateOffset').val());
	replicateDist = parseInt($('#replicateDist').val());
	cancelDialog();
}

/* Update the bar period or call for a position. */
function updateCall() {
	theDance.modified = true;
	var period = parseInt($('#barPeriod').val(), 10);
	period = isNaN(period) ? '' : period;
	theDance.positions[curPos].period = period;
	$('#tablePositions tbody tr:eq(' + curPos + ') td:eq(-2)').html(period || '&nbsp;');
	theDance.positions[curPos].call = $('#editCall').val();
	var hint = theDance.positions[curPos].call.substring(0, 50).replace(/"/g, '&quot;');
	$('#position option:eq(' + curPos + '),' +
		'#afterPosition option:eq(' + (curPos + 1) + ')').attr('title', hint);
	$('#call,#tablePositions tbody tr:eq(' + curPos + ') td:last').
		html(theDance.positions[curPos].call || '&nbsp;');
}

/* Select a dancer row from the table. */
function selectRow() {
	selectDancer($(this).find('td:first').text());
}

/* Select a dancer and show their details.
   @param  index         (number, optional) the selected dancer's index
   @param  showEndpoint  (boolean, optional) true to show endpoint details, false to remain as is */
function selectDancer(index, showEndpoint) {
	curIndex = (index != null ? index : curIndex);
	var dancer = dancers[curIndex];
	if (!dancer) {
		return;
	}
	// Highlight the dancer and show their trajectory
	$.each(dancers, function(key, dancer) {
		dancer.removeClass('current');
	});
	dancer.addClass('current');
	var prevPosition = theDance.positions[prevPos][curIndex];
	var position = theDance.positions[curPos][curIndex];
	var midpoint = (position.x2 !== position.x || position.y2 !== position.y ||
		position.angle2 !== position.angle);
	trajectory.start.attr('transform', transform(prevPosition, false, '', 0));
	trajectory.midpoint.attr('transform', transform(midpoint ? position : prevPosition,
		midpoint, '', 0));
	// Load their details
	$('#curDancer').text(theDance.dancers[index][0]);
	$(showEndpoint ? '#editEndpoint' : '#editEndpoint:checked,#editMidpoint:checked').click();
}

/* Show the endpoint details for the current dancer. */
function selectEndpoint() {
	if (!theDance.positions) {
		return
	}
	var position = theDance.positions[curPos][curIndex];
	$('#editEndpoint').prop('checked', true);
	$('#editX').val(position.x);
	$('#editY').val(position.y);
	$('#editAngle').val(position.angle);
	$('#editClockwise').prop('checked', position.clockwise);
	$('#clearMidpoint').hide();
}

/* Show the midpoint details for the current dancer. */
function selectMidpoint() {
	if (!theDance.positions) {
		return
	}
	var position = theDance.positions[curPos][curIndex];
	$('#editMidpoint').prop('checked', true);
	$('#editX').val(position.x2);
	$('#editY').val(position.y2);
	$('#editAngle').val(position.angle2);
	$('#editClockwise').prop('checked', position.clockwise2);
	$('#clearMidpoint').show();
}

/* Update the dance details when changed. */
function updateDanceDetails() {
	if (!theDance.positions) {
		return
	}
	theDance.modified = true;
	theDance.name = $('#editName').val();
	theDance.formation = $('#editFormation').val();
	theDance.music = $('#editMusic').val();
	theDance.source = $('#editSource').val();
	theDance.notes = $('#editNotes').val();
	theDance.synchMusic = $('#editSynchMusic').val();
	theDance.synchAttribution = $('#editSynchAttribution').val();
	theDance.synchPeriod = parseInt($('#editSynchPeriod').val() || '1000', 10);
	theDance.synchDelay = parseInt($('#editSynchDelay').val() || '1000', 10);
	$('#name').html(theDance.name || '&#160;');
	$('#formation').html(theDance.formation || '&#160;');
	$('#music').html(theDance.music || '&#160;');
	$('#source').html(theDance.source || '&#160;');
	$('#notes').html(lineBreaks(makeLinks(theDance.notes || '&#160;')));
	$('#musicAttribution').html(getDanceAttribution());
}

function getDanceAttribution() {
	return !theDance.synchMusic ? '' :
		'Music: <em>' + theDance.synchMusic.replace(/\..+/, '') + '</em> ' + (theDance.synchAttribution || '');
}

/* Convert line breaks to HTML. */
function lineBreaks(text) {
	return text.replace(/\n/g, '<br>');
}

/* Convert http references to links. */
function makeLinks(text) {
	return text.replace(/(http:\/\/[^\s]+)\./g, '<a href="$1">$1</a>.');
}

/* Synchronise the midpoint with the endpoint again. */
function clearMidpoint() {
	if (!theDance.positions) {
		return
	}
	theDance.modified = true;
	updateAndReplicate(curPos, curIndex, function(dancer) {
		dancer.x2 = dancer.x;
		dancer.y2 = dancer.y;
		dancer.angle2 = dancer.angle;
		dancer.clockwise2 = dancer.clockwise;
	});
	drawPosition(true);
	selectEndpoint();
}

/* Update the dancer details when changed. */
function updateDancerDetails() {
	if (!theDance.positions || isNaN(curIndex)) {
		return
	}
	theDance.modified = true;
	var input = $(this);
	var amount = parseInt(input.val(), 10);
	var id = this.id.replace('edit', '');
	var suffix = $('#editEndpoint').is(':checked') ? '' : '2';
	updateAndReplicate(curPos, curIndex, function(dancer) {
		var updateMidpoint = hasNoMidpoint(dancer) && !suffix;
		switch (id) {
			case 'X':         dancer['x' + suffix] = amount; break;
			case 'Y':         dancer['y' + suffix] = amount; break;
			case 'Angle':     dancer['angle' + suffix] = amount; break;
			case 'Clockwise': dancer['clockwise' + suffix] = input.is(':checked'); break;
		}
		if (updateMidpoint) { // Synchronise midpoint if it did match endpoint
			switch (id) {
				case 'X':         dancer.x2 = dancer.x; break;
				case 'Y':         dancer.y2 = dancer.y; break;
				case 'Angle':     dancer.angle2 = dancer.angle; break;
				case 'Clockwise': dancer.clockwise2 = dancer.clockwise; break;
			}
		}
	});
	drawPosition(true);
}

/* Move the current dancer a little. */
function nudgeLocation() {
	if (!theDance.positions) {
		return
	}
	theDance.modified = true;
	var offsets = {NW: [-1, -1], N: [0, -1], NE: [1, -1], W: [-1, 0],
		E: [1, 0], SW: [-1, 1], S: [0, 1], SE: [1, 1]}
		[$(this).attr('src').replace(/.*arrow(.+)\.gif/, '$1')];
	var amount = parseInt($('#nudgeAmount').val(), 10);
	var suffix = $('#editEndpoint').is(':checked') ? '' : '2';
	var updateSelect = updateSelected();
	updateAndReplicate(curPos, curIndex, function(dancer) {
		var noMidpoint = hasNoMidpoint(dancer);
		if (noMidpoint && suffix && updateSelect) { // Don't update midpoint if currently none for bulk update
			return;
		}
		dancer['x' + suffix] += offsets[0] * amount;
		dancer['y' + suffix] += offsets[1] * amount;
		if (noMidpoint && !suffix) { // Synchronise midpoint if it did match endpoint
			dancer.x2 = dancer.x;
			dancer.y2 = dancer.y;
		}
	});
	drawPosition(true);
	selectDancer(curIndex);
}

/* Change the current dancer's heading. */
function changeHeading() {
	if (!theDance.positions) {
		return
	}
	theDance.modified = true;
	var angle = {NW: 135, N: 180, NE: 225, W: 90, E: 270, SW: 45, S: 0, SE: 315}
		[$(this).attr('src').replace(/.*arrow(.+)\.gif/, '$1')];
	$('#editAngle').val(angle);
	var suffix = $('#editEndpoint').is(':checked') ? '' : '2';
	updateAndReplicate(curPos, curIndex, function(dancer) {
		var updateMidpoint = hasNoMidpoint(dancer) && !suffix;
		dancer['angle' + suffix] = angle;
		if (updateMidpoint) { // Synchronise midpoint if it did match endpoint
			dancer.angle2 = dancer.angle;
		}
	});
	drawPosition(true);
}

/* Dancer has no midpoint specified? */
function hasNoMidpoint(dancer) {
	return dancer.x === dancer.x2 && dancer.y === dancer.y2 &&
		dancer.angle === dancer.angle2 && dancer.clockwise === dancer.clockwise2;
}

/* Update all selected positions? */
function updateSelected() {
	return !$('#selectedPosns').prop('disabled') && $('#selectedPosns').is(':checked');
}

/* Update all applicable dancers. */
function updateAndReplicate(curPos, curIndex, updateDancer) {
	if (updateSelected()) {
		$('#tablePositions input:checked').each(function() {
			var pos = parseInt($(this).val().replace(/p/, ''), 10);
			updateDancer(theDance.positions[pos][curIndex]);
		});
	}
	else {
		updateDancer(theDance.positions[curPos][curIndex]);
		replicateDancers(theDance.positions[curPos], curIndex);
	}
}

/* Apply the changes to other dancers. */
function replicateDancers(position, curIndex) {
	if (!$('#replicatePosns').is(':checked')) {
		return;
	}
	function getAngle(a) {
		while (a < 0) {
			a += 360;
		}
		return a % 360;
	}
	if (replicateType === 'long') {
		var maxRepl = Math.floor(dancerCount / replicateOffset) * replicateOffset;
		if (curIndex < maxRepl) {
			for (var i = curIndex % replicateOffset; i < maxRepl; i += replicateOffset) {
				if (i !== curIndex) {
					var dist = (i - curIndex) / replicateOffset * replicateDist
					position[i].x = position[curIndex].x;
					position[i].y = position[curIndex].y + dist;
					position[i].angle = position[curIndex].angle;
					position[i].clockwise = position[curIndex].clockwise;
					position[i].x2 = position[curIndex].x2;
					position[i].y2 = position[curIndex].y2 + dist;
					position[i].angle2 = position[curIndex].angle2;
					position[i].clockwise2 = position[curIndex].clockwise2;
				}
			}
		}
	}
	else if (replicateType === 'square') {
		var factors = [[[1, 0], [0, 1]], [[0, -1], [1, 0]], [[-1, 0], [0, -1]], [[0, 1], [-1, 0]]];
		var j = (replicateOffset === 2 ? 4 - Math.floor(curIndex / 2) % 4 : Math.floor(curIndex / 4) * 2);
		for (var i = curIndex % replicateOffset; i < 8; i += replicateOffset) {
			if (i !== curIndex) {
				position[i].x = position[curIndex].x * factors[j][0][0] +
					position[curIndex].y * factors[j][0][1];
				position[i].y = position[curIndex].x * factors[j][1][0] +
					position[curIndex].y * factors[j][1][1];
				position[i].angle = getAngle(position[curIndex].angle + j * 90);
				position[i].clockwise = position[curIndex].clockwise;
				position[i].x2 = position[curIndex].x2 * factors[j][0][0] +
					position[curIndex].y2 * factors[j][0][1];
				position[i].y2 = position[curIndex].x2 * factors[j][1][0] +
					position[curIndex].y2 * factors[j][1][1];
				position[i].angle2 = getAngle(position[curIndex].angle2 + j * 90);
				position[i].clockwise2 = position[curIndex].clockwise2;
			}
			j = (j + replicateOffset / 2) % 4;
		}
	}
	else if (replicateType === 'circle') {
		var conv = 2 * Math.PI / 360;
		var angle = 2 * Math.PI / Math.floor(dancerCount / replicateOffset);
		var j = -Math.floor(curIndex / replicateOffset);
		var curDist = [Math.sqrt(position[curIndex].x * position[curIndex].x +
			position[curIndex].y * position[curIndex].y),
			Math.sqrt(position[curIndex].x2 * position[curIndex].x2 +
			position[curIndex].y2 * position[curIndex].y2)];
		var curAngle = [Math.atan(position[curIndex].y / position[curIndex].x),
			Math.atan(position[curIndex].y2 / position[curIndex].x2)];
		function round5(value) {
			return Math.round(value / 5) * 5;
		}
		function calcAngle(i, j, x) {
			var a = curAngle[i] + angle * j;
			return (x < 0 ? Math.PI + a : a) + 2 * Math.PI;
		}
		for (var i = curIndex % replicateOffset; i < dancerCount; i += replicateOffset) {
			if (i !== curIndex) {
				var a = calcAngle(0, j, position[curIndex].x);
				position[i].x = round5(curDist[0] * Math.cos(a));
				position[i].y = round5(curDist[0] * Math.sin(a));
				position[i].angle = getAngle(
					Math.round(position[curIndex].angle + Math.round(angle * j / conv)));
				position[i].clockwise = position[curIndex].clockwise;
				a = calcAngle(1, j, position[curIndex].x2);
				position[i].x2 = round5(curDist[1] * Math.cos(a));
				position[i].y2 = round5(curDist[1] * Math.sin(a));
				position[i].angle2 = getAngle(
					Math.round(position[curIndex].angle2 + Math.round(angle * j / conv)));
				position[i].clockwise2 = position[curIndex].clockwise2;
			}
			j = (j + 1) % Math.floor(dancerCount / replicateOffset);
		}
	}
}

/* Animate the currently selected dancer from their last position. */
function moveDancer() {
	if (!theDance.positions) {
		return
	}
	drawDancer(curIndex, dancers[curIndex], null, false, true);
}

/* Calculate angular coordinates. */
function calculateCoords() {
	var angle1 = parseInt($('#angle1').val(), 10);
	angle1 = isNaN(angle1) ? 0 : angle1;
	var dist1 = parseInt($('#dist1').val(), 10);
	dist1 = isNaN(dist1) ? 0 : dist1;
	var angle2 = parseInt($('#angle2').val(), 10);
	angle2 = isNaN(angle2) ? 0 : angle2;
	var dist2 = parseInt($('#dist2').val(), 10);
	dist2 = isNaN(dist2) ? 0 : dist2;
	var x = -Math.round(Math.sin(angle1 * Math.PI / 180) * dist1 + Math.sin(angle2 * Math.PI / 180) * dist2);
	var y = Math.round(Math.cos(angle1 * Math.PI / 180) * dist1 + Math.cos(angle2 * Math.PI / 180) * dist2);
	$('#coords').text(x + ',' + y);
}

/* If switching to the Output or Call Sheet tabs, populate them. */
function checkOutputAndCall(event, ui) {
	if (ui.newTab.text() === 'Output') {
		if (!event.altKey) {
			var output = '<?xml version="1.0" encoding="UTF-8"?>\n' +
				'<dance>\n' +
				'\t<name>' + escapeXML(theDance.name) + '</name>\n' +
				'\t<formation>' + escapeXML(theDance.formation) + '</formation>\n' +
				'\t<music>' + escapeXML(theDance.music) + '</music>\n' +
				'\t<sources>' + escapeXML(theDance.source) + '</sources>\n' +
				'\t<notes>' + escapeXML(theDance.notes) + '</notes>\n' +
				'\t<synchMusic period="' + theDance.synchPeriod + '" delay="' + theDance.synchDelay +
				'" attribution="' + escapeXML(theDance.synchAttribution) + '">' +
				escapeXML(theDance.synchMusic) + '</synchMusic>\n' +
				'\t<dancers>\n';
			$.each(theDance.dancers, function(i, dancer) {
				output += '\t\t<dancer id="d' + i + '" label="' + dancer[0] + '" type="' + dancer[1] + '"/>\n';
			});
			var floorSize = parseInt($('#floorSize').val(), 10);
			output += '\t</dancers>\n' +
				'\t<positions' + (floorSize !== 800 ? ' floorSize="' + floorSize + '"' : '') + '>\n' +
				'\t\t<!-- x,y are coords, a is angle, cw is clockwise, ...2 are midpoint details -->\n';
			$.each(theDance.positions, function(i, position) {
				output += '\t\t<position id="p' + i + '"' +
					(position.period ? ' period="' + position.period + '"' : '') + '>\n' +
					(position.call ? '\t\t\t<call>' + escapeXML(position.call) + '</call>\n' : '');
				$.each(position, function(key, dancer) {
					output += (key === 'call' || key === 'period' ? '' :
						'\t\t\t<place for="d' + key + '" x="' + dancer.x + '" y="' + dancer.y + '"' +
						' a="' + dancer.angle + '" cw="' + dancer.clockwise + '"' +
						(dancer.x2 == null || (dancer.x2 === dancer.x &&
						dancer.y2 === dancer.y && dancer.angle2 === dancer.angle) ?
						'' : ' x2="' + dancer.x2 + '" y2="' + dancer.y2 + '"' +
						' a2="' + dancer.angle2 + '" cw2="' + dancer.clockwise2 + '"') + '/>\n');
				});
				output += '\t\t</position>\n';
			});
			output += '\t</positions>\n' +
				'</dance>';
			$('#editOutput textarea').val(output);
			theDance.modified = false;
		} else {
			var id = theDance.name.replace(/\b(\w)/g, function(match, ch) {
				return ch.toUpperCase();
			}).replace(/\W/g, '');
			var output = '\t\t<article id="' + id + '" class="dance">\n' +
				'\t\t\t<header>\n' +
				'\t\t\t\t' + escapeXML(theDance.name) + '\n' +
				'\t\t\t\t<a href="http://www.dancekaleidoscope.org.au/dance.html#' + id + '" target="_blank" class="anim" title="Animation">Animation</a>\n' +
				'\t\t\t\t<a href="#contra" class="back">Back</a>\n' +
				'\t\t\t</header>\n' +
				'\t\t\t<ul class="metadata">\n' +
				'\t\t\t\t<li>' + escapeXML(theDance.formation) + '</li>\n' +
				'\t\t\t\t<li>' + escapeXML(theDance.music) + '</li>\n' +
				'\t\t\t\t<li>B/I/A?</li>\n' +
				'\t\t\t\t<li>' + escapeXML(theDance.source) + '</li>\n' +
				'\t\t\t</ul>\n' +
				'\t\t\t<table>\n' +
				'\t\t\t\t<tbody>\n';
			for (var start = 1; start < theDance.positions.length; start++) {
				if (theDance.positions[start].call) {
					var end = start + 1;
					while (end < theDance.positions.length && !theDance.positions[end].call) {
						end++;
					}
					output += '\t\t\t\t\t<tr><td>' + start + (start === --end ? '' : '-' + end) + '</td><td>' +
						theDance.positions[start].call + '</td></tr>\n';
				}
			}
			output += '\t\t\t\t</tbody>\n' +
				'\t\t\t</table>\n' +
				'\t\t\t<p>' + escapeXML(theDance.notes).replace(/\n\n/g, '</p>\n\t\t\t<p>') + '</p>\n' +
				'\t\t</article>\n'
			$('#editOutput textarea').val(output);
		}			
	}
}

/* Escape characters for inclusion in an XML string.
   @param  value  (string) the value to use
   @return  (string) the escaped value */
function escapeXML(value) {
	return (value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Display the dialog to create a new dance. */
function showNewDance() {
	if (theDance.modified && !confirm('Changes made to existing dance.\n' +
			'Click OK to continue and lose the\n' +
			'changes or Cancel to return')) {
		return;
	}
	$('#dialogUnderlay').show();
	$('#newDialog').centre().show();
	$('#newName').val('').focus();
}

/* Create the new dance given user selections. */
function createNewDance() {
	var newDancers = $('#newDancers');
	if (!/^\d+$/.test(newDancers.val())) {
		alert('Please enter a valid number');
		newDancers.focus();
		return;
	}
	var newPositions = $('#newPositions');
	if (!/^\d+$/.test(newPositions.val())) {
		alert('Please enter a valid number');
		newPositions.focus();
		return;
	}
	var count = parseInt(newDancers.val(), 10);
	var formation = $('#newFormation').val();
	var dancers = [];
	var pos = {};
	var squarePos = [[50, -150], [-50, -150], [150, 50], [150, -50],
		[-50, 150], [50, 150], [-150, -50], [-150, 50]];
	var round5 = function(value) {
		return Math.round(value / 5) * 5;
	};
	for (var i = 0; i < count; i++) {
		var index = Math.floor(i / 2) + 1;
		var label = (i % 2 === 0 ? 'G' : 'L') + index;
		var j = Math.min(i + (i % 2 === 0 ? +1 : -1), count - 1);
		dancers[i] = [label, (i % 2 === 0 ? 'gent' : 'lady')];
		pos[i] = position((formation === 'circle' ?
			round5(Math.cos(2 * Math.PI * j / count - Math.PI / 2) * (count > 6 ? 200 : 150)) :
			(formation === 'square' ? squarePos[i % 8][0] :
			(formation === 'longb' ? (i % 4 < 2 ? 1 : -1) * 75 :
			(formation === 'long' ? (i % 2 === 0 ? -1 : +1) :
			(i % 2 === index % 2 ? -1 : +1)) * 75))),
			(formation === 'circle' ?
			round5(Math.sin(2 * Math.PI * j / count - Math.PI / 2) * (count > 6 ? 200 : 150)) :
			(formation === 'square' ? squarePos[i % 8][1] :
			(formation === 'longb' ?
			(i % 4 === 0 || i % 4 === 3 ? 0 : -125) + Math.floor(i / 4) * 250 - 175 :
			index * 125 - count * 25 - 125))),
			(formation === 'circle' ? 360 * j / count :
			(formation === 'square' ? ((index - 1) % 4) * 90 :
			(formation === 'longb' ? (i % 4 < 2 ? 90 : 270) :
			(formation === 'long' ? 180 : (index % 2 === 0 ? 180 : 0))))), true);
	}
	count = parseInt(newPositions.val(), 10);
	var positions = [];
	for (var i = 0; i <= count; i++) {
		positions.push($.extend(true, {}, pos));
	}
	theDance = {name: $('#newName').val(), formation: '', music: '', source: '', notes: '',
		synchMusic: '', synchAttribution: '', synchPeriod: 1000, synchDelay: 1000,
		dancers: dancers, positions: positions, modified: true, floorSize: 800};
	loadTheDance();
	designDance();
	$('#dance').val('');
	cancelDialog();
}

/* Map dancers to new positions for a copy/move. */
function transposeDancers() {
	transpose = [];
	var taken = [];
	var valid = true;
	$('#transposeOutput select').each(function(i) {
		var newPos = $(this).val();
		if (taken[newPos]) {
			valid = false;
			return false;
		}
		taken[newPos] = true;
		transpose[newPos] = i;
	});
	if (!valid) {
		alert('Target dancers must be unique');
		return;
	}
	doCopyMovePosition(moving);
	cancelDialog();
}

/* Map dancers to new positions in a linear progression for a copy/move. */
function progressDancers() {
	if (!/^\d+$/.test($('#perLine').val())) {
		alert('Please enter a valid number');
		$('#perLine').focus();
		return;
	}
	if (!/^\d+$/.test($('#progressDist').val())) {
		alert('Please enter a valid number');
		$('#progressDist').focus();
		return;
	}
	perLine = parseInt($('#perLine').val());
	progressDist = parseInt($('#progressDist').val());
	progressTriple = $('#progressTriple').is(':checked');
	doCopyMovePosition(moving);
	cancelDialog();
}

/* Map dancers to new positions in a 3 in 4 progression for a copy/move. */
function progress3in4Dancers() {
	if (!/^\d+$/.test($('#progress3in4Dist').val())) {
		alert('Please enter a valid number');
		$('#progress3in4Dist').focus();
		return;
	}
	progressDist = parseInt($('#progress3in4Dist').val());
	doCopyMovePosition(moving);
	cancelDialog();
}

/* Map dancers to new positions in a Becket progression for a copy/move. */
function progressBecketDancers() {
	if (!/^\d+$/.test($('#progressBecketDist').val())) {
		alert('Please enter a valid number');
		$('#progressBecketDist').focus();
		return;
	}
	progressDist = parseInt($('#progressBecketDist').val());
	becketClockwise = $('#progressBecketDir').is(':checked');
	doCopyMovePosition(moving);
	cancelDialog();
}

/* Map dancers to new positions by flipping for a copy/move. */
function flipDancers() {
	flipHoriz = $('#flipHorizontal').is(':checked');
	doCopyMovePosition(moving);
	cancelDialog();
}

/* Map dancers to new positions by rotation for a copy/move. */
function rotateDancers() {
	rotateAngle = parseFloat($('#rotateAngle').val());
	doCopyMovePosition(moving);
	cancelDialog();
}

/* Close all dialogs. */
function cancelDialog() {
	$('#dialogUnderlay,div.dialog').hide();
}
