// client-side js, loaded by index.html
// run by the browser each time the page is loaded

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// All the information about the dance
var theDance = {};
// keys that theDance has
let dancekeys = ["title", "formation", "author", "source", "notes", "roles", "mindancers", "inactives", "type", "minorsets"];

const ptypes = [
  {
    type: "part",
    fields: ["part", "call"]
  },
  {
    type: "progress",
    fields: []
  },
  {
    type: "repeat",
    fields: []
  },
  {
    type: "translate",
    fields: ["who", "x", "y", "dur"]
  },
  {
    type: "path",
    fields: ["who", "path", "dx", "dy", "dur"]
  },
  {
    type: "rotate",
    fields: ["who", "da", "dur"]
  },
  {
    type: "arms",
    fields: ["who", "rangle", "langle", "dur"]
  },
  {
    type: "zindex",
    fields: ["who", "front"]
  }
];
var progress = {
  improper: {
    filter: function(d) {
      return d.y + d.pathy === -200 || d.y + d.pathy === (numdancers/2-2)*150-50;
    },
    animation: function(d, jump) {
      let k = d.id.substr(1);
      let xdir = d.x + d.pathx > 0 ? -1 : 1;
      if (!jump) {
        $("#anim"+k).attr("dur", "2s");
        $("#anim"+k).attr("path", "M"+ [d.pathx, d.pathy, "a100 55 0 1 1", 200*xdir, "0"].join(" "));
        d.pathx += 200*xdir;
        d.a += 180;
        $("#d"+k+" g").animate({svgTransform: "rotate("+(d.a)+")"}, 2000, "linear");
        document.getElementById("anim"+k).beginElement();
      } else {
        d.x += 200*xdir;
        d.a += 180;
      }
      
    }
  },
  becket: {
    filter: function(d) {
      let y = d.who.includes("robin") ? 0 : d.who.includes("two") ? -150 : 150;
      if (d.who.includes("out")) return true;
      if (d.x + d.pathx < 0 && [-50+y,100+y].includes(d.y + d.pathy)) return true;
      if (d.x + d.pathx > 0 && d.y + d.pathy > (Math.ceil(numdancers/4)-1)*300-200+y) return true;
      return false;
    }
  },
  triple: function(arr, jump) {
    let maxy = numdancers/2*150-200;
    
    
    for (let i = 0; i < arr.length; i++) {
      let d = arr[i];
      let y = d.y+d.pathy;
      let num = ["one", "two", "three"].find(w => d.who.includes(w));
      let active = d.who.includes("active");
      if (y === -200 && !active && num === "two") {
        d.who = d.who.replace("out", "active").replace("two", "one");
        d.who = d.who.includes("lark") ? d.who.replace("second", "firstcorner third") : d.who.replace("firstcorner", "second fourth");
      } else if (y === maxy-150 && active && num === "one") {
        d.who = d.who.replace("active", "out").replace("one", "three");
        d.who = d.who.includes("lark") ? d.who.replace("firstcorner third", "fourth") : d.who.replace("second fourth", "third");
        let k = d.id.substring(1);
        let ydir = d.who.includes("lark") ? 1 : -1;
        if (!jump) {
          $("#anim"+k).attr("dur", "2s");
          $("#anim"+k).attr("path", "M"+ [d.pathx, d.pathy, "a50 75 0 1", ydir === 1 ? "1" : "0" , "0", 150*ydir].join(" "));
          d.pathy += 150*ydir;
          document.getElementById("anim"+k).beginElement();
        } else {
          d.y += 150*ydir;
        }
      } else if (y === maxy && active && num === "three") {
        d.who = d.who.replace("active", "out").replace("three", "two").replace("fourth", "second").replace("third", "firstcorner");
        let k = d.id.substring(1);
        let ydir = d.who.includes("lark") ? 1 : -1;
        if (!jump) {
          $("#anim"+k).attr("dur", "2s");
          $("#anim"+k).attr("path", "M"+ [d.pathx, d.pathy, "a50 75 0 1", ydir === -1 ? "1" : "0" , "0", 150*ydir].join(" "));
          d.pathy += 150*ydir;
          document.getElementById("anim"+k).beginElement();
        } else {
          d.y += 150*ydir;
        }
      } else if (num != "one") {
        if (y <= -50 && num === "two") {
          d.who = d.who.replace("active", "out");
        } else if ((y === -50 && num === "three") || (y >= maxy-150 && num === "two")) {
          d.who = d.who.replace("out", "active");
        }
        if (d.who.includes("two")) {
          d.who = d.who.replace("two", "three").replace("second", "fourth").replace("firstcorner", "third");
        } else if (d.who.includes("three")) {
          d.who = d.who.replace("three", "two").replace("fourth", "second").replace("third", "firstcorner");
        }
        
      }
      
    }
  }
};
// True if currently designing the dance, false if not
var designing = false;
var wasDesigning = designing;
// The gentleman and lady templates for drawing
let templates = {};
// A grid overlay for drawing
let grid = null;
// The number of dancers
var dancerCount = 0;

// The SVG wrapper
let drawer = null;
// The SVG dancers group
let group = null;
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

// The dance floor size
var floorSize = 800;
// The base URL for the page
var baseUrl = window.location.href.replace(/^(.*\/)[^\/]*$/, '$1');
// The audio player
var audio = null;

const lookahead = 25;
const scheduleAheadTime = 0.1;
var delay = 0.51;
const width = 800;
const height = 1067;
let dancetypes;

let dancechange = false;
let numdancers = 8;
var dancers = [];
let j = 1;
let currentAnim = 0;
let nextAnimTime = 0.0;
let currentNote = -1.3;
let nextNoteTime = 0.0;
let timer, dtimer;
let playing = false;
let dancing = false;
let tune = new Audio();
//tune.src = "https://cdn.glitch.com/1b11a1fb-599e-47a3-9eff-c7176b15bb2c%2F15%20Track%2015.mp3?v=1601421515332";
tune.src = "https://cdn.glitch.com/1b11a1fb-599e-47a3-9eff-c7176b15bb2c%2F11%20Reel%20Du%20Montreal%20_%20Pointe%20a%20Pique.mp3?v=1601611454917";
let repeats = 0;
let sequence = [];
let withMusic = true;
let calls = [];
let musicstart;
let startnote;
let maxrep;
var music;
let currenttab = "Dance";
var positions = [];
var seq = "sequence";
var manualend = true;
let verse;
let seqarr = [];
let j2 = 0;


$(function() {
  console.log("hello world :o");
  $.get("music.json", function(data) {
    music = data;
    //setMusic("Reel du Montreal/Pointe a pique");
  });
  
  $('#search').keyup(filterDances);
	$('#type,#type2').change(filterDances);
  $('#dance').change(function() {
    dancechange = true;
    $("#call").text("");
    currentNote = startnote;
    repeats = 0;
    tune.load();
    j = 0;
		var value = $(this).val();
		if (value) {
			if (history) {
				history.pushState('', '', window.location.href.split('#')[0] + '#' + value.replace('.json', ''));
			}
			$('#wait').show();
			$.get("dances/"+value, setDance);
		}
	});
  loadList();
  getTypes();
  
  $('#svgdance').svg({onLoad: drawInitial});
  $('#position,#reset,#next,#step,#play,#withMusic,#numdancers').prop('disabled', true);
  $("#designPanel input,#designPanel select").prop("disabled", true);
  $("#position").change(function() {
    
    let first = $("#position option:first-child").val();
      let part = $(this).val();
    //console.log(part);
      //setDance(theDance.raw);
    resetDancers(theDance);
    if (part != first && !part.startsWith("verse")) gotopart(part);
    if (part.startsWith("verse")) {
      verse = Number(part.slice(6))-1;
      theDance.sequence = sequence = theDance.verses[verse].concat(theDance.chorus);
    }
    if (designing) {
      changePos(Number(part.slice(1)));
    }
    
    //console.log(j);
  });
  $("#tablePositions").on("click", "tr", function() {
    let first = $("#position option:first-child").val();
    let part = "p" + $(this).children("td:first-child").text();
    resetDancers(theDance);
    if (part != first) gotopart(part);
    changePos(Number(part.slice(1)));
  });
  
  $("#numdancers").change(function() {
    numdancers = Number($(this).val());
    setDance(theDance.raw);
  });
  
  $("#colorscheme").change(function() {
    dancers.forEach(d => {
      $("#"+d.id + " g").attr(dancercolor(d));
      
    });
  });
	
  $("#play").click(function() {
    //console.log("play button clicked");
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (withMusic) playing = !playing;
    dancing = !dancing;
    $(this).text(dancing ? 'Stop' : 'Play');
    if (dancing) {
      console.log("dancing");
      console.log(currentNote);
      $("#numdancers,#reset,#position,#step").prop("disabled", true);
      nextNoteTime = audioCtx.currentTime;
      nextAnimTime = (theDance[seq][j].time-currentNote)*delay + audioCtx.currentTime;
      //console.log(audioCtx.currentTime, nextAnimTime);
      if (withMusic && !designing) {
        tune.play();
      }
      danceScheduler();
    } else {
      //console.log("stopping");
      
      clearTimeout(dtimer);
      //clearTimeout(timer);
      //console.log(dtimer);
      
      currentNote = j >= theDance[seq].length ? theDance[seq][theDance[seq].length-1].time + delay : theDance[seq][j].time;
      if (manualend) {
        tune.pause();
        tune.currentTime = (currentNote - startnote)*delay + musicstart;
      } else {
        $("#play,#step").prop("disabled", true);
      }
      manualend = true;
      
      $("#reset,#position").prop("disabled", false);
      if (theDance.minorsets) {
        $("#numdancers").prop("disabled", false);
      }
    }
    
  });
  $("#step").click(function() {
    nextAnimTime = (theDance[seq][j].time-currentNote)*delay + audioCtx.currentTime;
    scheduleDance(theDance[seq][j]);
    j++;
    console.log(dancers);
    if (j === theDance[seq].length) {
      $("#step,#play").prop("disabled", true);
    }
  });
  $(tune).on("loadeddata", function() {
    $("#withMusic").prop('disabled', false);
    $('label[for="withMusic"]').text("with music");
    tune.currentTime = musicstart;
  });
  $("#withMusic").change(function() {
    withMusic = $(this).prop("checked");
  });
  
  $("#reset").click(function() {
    //console.log(dancing);
    $("#call").text("");
    currentNote = startnote;
    repeats = 0;
    j = 0;
    verse = theDance.verses ? 0 : null;
    if (theDance.verses) {
      theDance.sequence = sequence = theDance.verses[0].concat(theDance.chorus);
    }
    seqarr = [];
    j2 = 0;
    tune.load();
    resetDancers(theDance);
    loadTheDance();
  });
  
  $('#callSheet').click(displayCallSheet);
	$('button.callClose').click(closeCallSheet);
	$('button.callPrint').click(printCallSheet);
  $('#goPosition').click(actionPosition);
  
  $('#design').click(function() {
		var display = $(this).text() === 'Display';
		$(this).text(display ? 'Design' : 'Display');
		(display ? displayDance() : designDance());
	});
  
  $(".tabs-nav a").click(function() {
    $("#edit"+currenttab).hide();
    $(".tabs-nav li").removeClass("selected");
    currenttab = $(this).attr("href").substring(5);
    $("#edit"+currenttab).show();
    $(this).parent("li").addClass("selected");
  });
  
  $("#designPanel input").change(alterPos);
  $("#ptype").change(alterPos);
  
  $('#dialogUnderlay,div.dialog').hide();
});



/* Filter the list of dances based on categories and search term. */
function filterDances() {
  //console.log("filtering");
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
	$.get('dances/a-dance-list.xml', function(data) {
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
			$('#dance').val(window.location.hash.replace(/#/, '') + '.json').change();
		}, 'xml');
}


function getTypes() {
  $.get("dancetypes.json", function(data) {
    dancetypes = data;
    let html = '<option disabled selected></option>';
    dancetypes.forEach(t => {
      html += '<option value="'+t.code+'">' + t.type + '</option>';
    });
    $("#editType").html(html);
  });
}

function setMusic(title) {
  //console.log("setting music");
  let obj = music.find(o => o.title === title);
  if (obj) {
    let x = obj.beat/delay;
    //updateDur(x);
    delay = obj.beat;
    startnote = obj.note;
    tune.src = obj.url;
    maxrep = obj.repeats;
    musicstart = obj.start;
    tune.load();
    $("#music").html(obj.info ? obj.info.replace(/'/g, '"') : obj.title);
  }
}



/* Load the dance information.
   @param  data  (string) the json description of the dance */
function setDance(data) {
  //console.log("setting dance");
	
	
	sequence = data.verses ? data.verses[0].concat(data.sequence) : data.sequence;
  //if (dancechange) updateDur(delay*1000);
  dancechange = false;
  
  theDance = {
    raw: data,
    sequence: sequence,
    positions: positions
  };
  dancekeys.forEach(w => {
    theDance[w] = data[w] || "";
  });
  if (data.music) {
    setMusic(data.music);
  } else {
    setMusic("Reel du Montreal/Pointe a pique");
  }
  if (data.verses) {
    theDance.verses = data.verses;
    theDance.chorus = data.sequence;
    verse = 0;
  } else {
    verse = null;
  }
  calls = [];
  buildCalls();
  j = 0;
  //console.log(sequence);
  buildPos();
  
  currentNote = startnote;
	resetDancers(data);
	loadTheDance();
	$('#wait').hide();
}

function resetDancers(data) {
  //console.log("resetting dancers");
  dancers = [];
  let set = 0;
  let setsize = data.roles.length;
  let couplenum = 1;
  //console.log(numdancers);
  for (let i = 0; i < numdancers; i++) {
    let d = {
      id: "d"+i,
      couple: couplenum
    };
    let active = (set+1)*setsize <= numdancers;
    //console.log(i, active);
    let role = active ? data.roles[i%setsize] : data.roles[data.inactives[(i)%setsize]];
    for (let key in role) {
      d[key] = role[key];
    }
    
    if (!active) {
      d.who = d.who.replace("active", "out");
      if (!theDance.type.includes("becket") && !theDance.type.includes("start-with-progression")) d.y -= 150;
    }
    d.pathx = 0;
    d.pathy = 0;
    d.y += set*(data.roles.length/2*150);
    dancers.push(d);
    if ((i+1)%setsize === 0) set++;
    if (i%2 === 1) couplenum++;
  }
}


/* Load a new dance. */
function loadTheDance() {
  //console.log("loading the dance");
	$('#name').html(theDance.title || '&#160;');
	$('#formation').html(theDance.formation || '&#160;');
	//$('#music').html(theDance.music || '&#160;');
  $('#author').html(theDance.author.join(", ") || '&#160;');
	$('#source').html(lineBreaks(makeLinks(theDance.source || '&#160;')));
	$('#notes').html(lineBreaks(makeLinks(theDance.notes || '&#160;')));
  $("#numdancers").attr("min", theDance.mindancers).val(numdancers);
  $("#numdancers").prop("disabled", !theDance.minorsets);
	//audio.pause();
	//audio.src = (theDance.synchMusic ? baseUrl + 'music/' + theDance.synchMusic : '');
	//audio.load();
	//$('#withMusic').prop('checked', false);
	// Remove previous dancers
	$("#dancers").find("*").remove();
	dancerCount = 0;
	
	// Add new dancers and labels
  dancers.sort((a,b) => {
    let x = a.who.includes("lark") ? -1 : 1;
    let y = b.who.includes("lark") ? -1 : 1;
    return x-y;
  });
	$.each(dancers, function(i, d) {
		dancerCount++;
		let type = d.who.includes("lark") ? "lark" : "robin";
		$(drawer.clone(group, templates[type])).
			attr('transform', "translate("+d.x+","+d.y+")").
			attr('id', d.id);
    
    $("#"+d.id + " g").attr("transform", "rotate("+d.a+")").attr(dancercolor(d));
    $("#"+d.id + " text").text(type[0].toUpperCase() + d.couple);
    $("#"+d.id + " animateMotion").attr("id", "anim"+d.id.substring(1));
    $("#"+d.id + " .right").attr("transform", "translate(48,0) rotate("+d.arms.r+")");
    $("#"+d.id + " .left").attr("transform", "translate(-48,0) rotate("+d.arms.l+")");
		
	});
  dancers.sort((a,b) => {
    return Number(a.id.substring(1)) - Number(b.id.substring(1));
  });
	// Initialise controls
	//var halfFloor = theDance.floorSize / 2;
	//drawer.configure({viewBox: '-' + halfFloor + ' -' + halfFloor + ' ' + theDance.floorSize + ' ' + theDance.floorSize});
  $(".dancer").click(function() {
    $(this).toggleClass("current");
  });
	$('#call').html('&nbsp;');
	$('#position').prop('disabled', false);
	$('#reset').prop('disabled', true);
  $('#play').prop('disabled', false);
  $("#step").prop("disabled", false);
	//$('#next,#step,#play').prop('disabled', theDance.positions.length === 1);
	$('#withMusic').prop('disabled', false);
	$('#selectedPosns').prop('checked', false).prop('disabled', true);
	
	$('#floorSize').val(theDance.floorSize);
  
  
	
	//$('label[for="withMusic"]').text(theDance.synchMusic ? 'loading music' : 'no music');
	
	if (designing) {
		designDance();
	}
	else {
		displayDance();
	}
}

function dancercolor(d) {
  if ($("#colorscheme").val() === "lark") {
    return d.who.includes("lark") ? {fill: '#faea07', stroke: '#66552f'} : {fill: '#fa5a17', stroke: '#222'};
  } else {
    let num = ["one", "two", "three", "four"].findIndex(w => d.who.split(" ").includes(w));
    let color = d.who.includes("lark")? ["#fc3434", "#b654ff", "#46b126", "#fcd634"][num] : ["#ff7171", "#ca85ff", "#7fd166", "#fee477"][num];
    return {fill: color, stroke: "black"};
  }
  
}

/* Initialise the SVG canvas.
   @param  svg  (SVGWrapper) the SVG wrapper */
function drawInitial(svg) {
  //console.log("drawing initial");
	$('#pluginReqd').hide();
	drawer = svg;
	var halfFloor = width / 2;
	svg.configure({viewBox: '-' + halfFloor + ' -300 ' + width + ' ' + height, xmlns: "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", width: width*.75, height: height*.75});
	var defs = svg.defs();
	// Create lark and robin templates
	templates.lark = svg.group(defs, 'lark', {class: "dancer"});
  let innerlark = svg.group(templates.lark, {fill: '#faea07', stroke: '#66552f'});
	svg.ellipse(innerlark, 0, 0, 50, 20);
	svg.ellipse(innerlark, 0, 0, 18, 20);
	svg.rect(innerlark, 0, -5, 50, 10, 3, 3, {transform: 'translate(48, 0) rotate(-135)', class: "right"});
	svg.rect(innerlark, 0, -5, 50, 10, 3, 3, {transform: 'translate(-48, 0) rotate(-45)', class: "left"});
  svg.text(templates.lark, 0, 5, "", {style: "font-family:sans-serif; text-anchor:middle; font-weight:bold"});
  svg.other(templates.lark, "animateMotion", {begin: "indefinite", fill: "freeze"});
  
	templates.robin = svg.group(defs, 'robin', {class: "dancer"});
	let innerrobin = svg.group(templates.robin, {fill: '#fa5a17', stroke: '#222'});
	svg.ellipse(innerrobin, 0, 0, 50, 20);
	svg.ellipse(innerrobin, 0, 0, 18, 20);
	svg.rect(innerrobin, 0, -5, 50, 10, 3, 3, {transform: 'translate(48, 0) rotate(-135)', class: "right"});
	svg.rect(innerrobin, 0, -5, 50, 10, 3, 3, {transform: 'translate(-48, 0) rotate(-45)', class: "left"});
  svg.text(templates.robin, 0, 5, "", {style: "font-family:sans-serif; text-anchor:middle; font-weight:bold"});
  svg.other(templates.robin, "animateMotion", {begin: "indefinite", fill: "freeze"});
  
	// Create grid
	grid = svg.group({fill: 'none', stroke: '#808080', display: 'none'});
	for (var i = -halfFloor; i <= halfFloor; i += 100) {
		svg.line(grid, -halfFloor, i, halfFloor, i);
		svg.line(grid, i, -halfFloor, i, halfFloor);
	}
	// Create a group for the dancers
	group = svg.group("dancers");
	
}

function gotopart(part) {
  //console.log("going to part");
  //console.log(dancers);
  let i = 0;
  let arms = theDance.roles.map(o => {return {who: o.who, rangle: "-135", langle: "-45"}});
  let test = designing ? "p"+i : sequence[i].part;
  while (test != part) {
    let o = designing ? positions[i] : sequence[i];
    //console.log(o);
    if (designing) {
      doStuff(o);
    } else if (o.seq && o.seq.length) {
      o.seq.forEach(arr => arr.forEach(doStuff));
    }
    function doStuff(obj) {
      if (obj.type === "arms") {
        arms.forEach(a => {
          if (obj.who === "all" || obj.who.split(" ").every(w => a.who.includes(w))) {
            a.rangle = obj.rangle;
            a.langle = obj.langle;
          }
        });
      } else if (obj.type != "zindex") {
        animate([obj], 0, 0, true);
      }
    }
    if (o.progress) {
      scheduleDance(o, true);
    }
    i++;
    test = designing ? "p"+i : sequence[i].part;
  }
  loadTheDance();
  arms.forEach(arm => dancers.forEach(d => {
    if (d.who.split(" ").every(dw => arm.who.split(" ").some(aw => aw === dw))) {
      d.arms = {
        r: arm.rangle,
        l: arm.langle
      }
      let arr = [{key: "rangle", class: ".right", x: "48"}, {key: "langle", class: ".left", x: "-48"}];
      arr.forEach(o => {
        $("#"+d.id + " " + o.class).attr("transform", "translate("+o.x+", 0) rotate("+arm[o.key]+")");
      });
      
    }
  }));
  //console.log(dancers);
  if (!designing) {
    j = i;
    currentNote = sequence[j].time;
    tune.currentTime = (currentNote - startnote)*delay + musicstart;
  } else {
    $("#dancerpos tr:nth-child(n+1) td").remove();
    let th = [];
    let keys = ["x", "y", "a"];
    arms.forEach(r => {
      let who = ["one", "two", "three", "four", "lark", "robin"];
      for (let k = 5; k >= 0; k--) {
        if (!r.who.split(" ").some(w => w === who[k])) {
          who.splice(k, 1);
        }
      }
      th.push(who.join(" "));
      let d = dancers.find(dancer => dancer.who === r.who);
      for (let k = 0; k < keys.length; k++) {
        let v = k === 2 ? getAngle(d.a) : d[keys[k]];
        $("#dancerpos tr:nth-child("+(k+2)+")").append("<td>"+v+"</td>");
      }
      $("#dancerpos tr:nth-child(5)").append("<td>"+r.rangle+"</td>");
      $("#dancerpos tr:nth-child(6)").append("<td>"+r.langle+"</td>");
    });
    $("#dancerpos tr:first-child").html("<td></td><th>"+th.join("</th><th>")+"</th>");
    
  }
  
  $('#position').val(part);
}

function animate(a, j1, i, jump) {
  //console.log("animating", j1);
  let anims = 0;
  let total = 0;
  
  a.forEach(obj => {
    if (obj.type === "arms") { //absolute angles provided
      let arr = [{key: "rangle", class: ".right", x: "48"}, {key: "langle", class: ".left", x: "-48"}].filter(o => obj[o.key]);

      for (let m = 0; m < numdancers; m++) {
        let d = dancers[m];
        if (obj.who === "all" || obj.who.split(" ").every(w => d.who.includes(w))) {
          total += arr.length;
          arr.forEach((o, k) => {
            $("#"+d.id+" "+o.class).animate({svgTransform: "translate("+o.x+", 0) rotate("+obj[o.key]+")"}, obj.dur*delay*1000, "linear", next);
          });
        }
      }

    }
    if (obj.type === "translate") { //relative distances provided
      for (let k = 0; k < numdancers; k++) {
        let d = dancers[k];
        if (obj.who === "all" || obj.who.split(" ").every(w => d.who.includes(w))) {
          let dir = {
            x: getAngle(d.a) > 90 && getAngle(d.a) < 271 ? -1 : 1, 
            y: getAngle(d.a) > 89 && getAngle(d.a) < 270 ? 1 : -1
          };
          total++;
          let coords = {};
          ["x", "y"].forEach(z => {
            if (obj.to) {
              let n = (d[z]+d["path"+z])/obj[z];
              if (obj.to[z] === 0) n = Math.round(n);
              if (obj.to[z] === -1) n = Math.ceil(n);
              if (obj.to[z] === 1) n = Math.floor(n);
              coords[z] = n*obj[z] + obj[z+"off"] - d["path"+z];
              //console.log(coords);
            } else {
              coords[z] = d[z] + dir[z]*obj[z];
            }
          });

          d.x = coords.x;
          d.y = coords.y;
          if (!jump) {
            $("#d"+k).animate({svgTransform: "translate("+coords.x+","+coords.y+")"}, obj.dur*delay*1000, "linear", next);
          }
          
        }

      }
    }
    if (obj.type === "path") {

      for (let k = 0; k < numdancers; k++) {
        let d = dancers[k];
        if (obj.who === "all" || obj.who.split(" ").every(w => d.who.includes(w))) {
          total++;
          let xdir = getAngle(d.a) > 90 && getAngle(d.a) < 271 ? -1 : 1;
          let ydir = getAngle(d.a) > 89 && getAngle(d.a) < 270 ? 1 : -1;
          
          
          if (!jump) {
            let path = [d.pathx, d.pathy, obj.path];
            for (let z = 0; z < obj.dx.length; z++) {
              path.push(obj.dx[z]*xdir, obj.dy[z]*ydir);
            }
            $("#anim"+k).attr("path", "M"+path.join(" "));
            //console.log($("#anim"+k).attr("path"));
            //$("#d"+k).attr("transform", "translate("+d.x+","+d.y+")");
            $("#anim"+k).attr("dur", obj.dur*delay + "s");
            if (obj.path === "c") {
              for (let z = 2; z < obj.dx.length; z+=3) {
                d.pathx += obj.dx[z]*xdir;
                d.pathy += obj.dy[z]*ydir;
              }
            } else {
              d.pathx += obj.dx[obj.dx.length-1]*xdir;
              d.pathy += obj.dy[obj.dy.length-1]*ydir;
            }
            
            document.getElementById("anim"+k).removeEventListener("endEvent", next);
            document.getElementById("anim"+k).addEventListener("endEvent", next);
            document.getElementById("anim"+k).beginElement();
          } else {
            if (obj.path === "c") {
              for (let z = 2; z < obj.dx.length; z+=3) {
                d.x += obj.dx[z]*xdir;
                d.y += obj.dy[z]*ydir;
              }
            } else {
              d.x += obj.dx[obj.dx.length-1]*xdir;
              d.y += obj.dy[obj.dy.length-1]*ydir;
            }
            
          }
          
        }


      }
    }
    if (obj.type === "rotate") { //relative rotation
      for (let k = 0; k < numdancers; k++) {
        let d = dancers[k];
        if (obj.who === "all" || obj.who.split(" ").every(w => d.who.includes(w))) {
          total++;
          d.a += obj.da;
          if (!jump) {
            $("#d"+k + " g").animate({svgTransform: "rotate("+d.a+")"}, obj.dur*delay*1000, "linear", next);
          }
        }

      }
    }
    if (obj.type === "zindex") {
      let moved = 0;
      total++;
      for (let k = 0; k < numdancers; k++) {
        let dg = $("#dancers > g:nth-child("+(k+1-moved)+")");
        let id = dg.attr("id");
        //console.log(id);
        let d = dancers.find(o => o.id === id);
        if (d && d.who.includes(obj.front) && (obj.who.split(" ").every(w => d.who.includes(w)) || obj.who === "all")) {
          //console.log("moved");
          moved++;
          $("#dancers").append(dg.detach());
        }
      }
      next();
    }
    
  });
  
  function next() {
    anims++;
    if (anims === total) {
      i++;
      
      if (!designing && i < seqarr[j1].length) {
        animate(seqarr[j1][i], j1, i);
      } else {
        
        //console.log("j1 "+j1);
      }
      
    }
  }
  
}

function getAngle(a) {
  while (a < 0) {
    a += 360
  }
  return a%360;
}


function danceScheduler() {
  //console.log("scheduling dance");
  while (nextAnimTime < audioCtx.currentTime + scheduleAheadTime && j < theDance[seq].length) {
    
    scheduleDance(theDance[seq][j]);
    nextAnim();
  }
  dtimer = setTimeout(danceScheduler, lookahead);
  if (j === theDance[seq].length) {
    manualend = false;
    $("#play").click();
  }
}



function scheduleDance(obj, jump) {
  if (obj.call && !jump) {
    $("#call").text(obj.call);
  }
  if (obj.part && !jump) {
    $("#position").val(obj.part);
  }
  if (((obj.seq && obj.seq.length) || ["translate", "path", "rotate", "arms"].includes(obj.type)) && !jump) {
    //if (j === 0) console.log(obj.seq);
    let arr = designing ? [obj] : obj.seq[0];
    seqarr.push(obj.seq);
    
    animate(arr, j2, 0);
    j2++;
  }
  if (obj.repeat && !jump) {
    repeats++;
    if (repeats < maxrep) {
      j = 0;
      if (theDance.verses) {
        console.log("has verses");
        verse++;
        sequence = theDance.verses[verse].concat(theDance.chorus);
        theDance.sequence = sequence;
      }
    }
    
  }
  if (obj.progress || obj.type === "progress") {
    //console.log("progression");
    dancers.forEach(d => {
      //console.log(d.id, d.x+d.pathx, d.y+d.pathy);
    });
    if (obj.progress === "triple") {
      progress.triple(dancers, jump);
    } else {
      dancers.filter(progress[obj.progress].filter).forEach(d => {
        if (d.who.includes("out")) {
          d.who = d.who.replace("out", "active");
        } else if (d.who.includes("active")) {
          d.who = d.who.replace("active", "out");
          d.who = d.who.includes("one") ? d.who.replace("one", "two") : d.who.replace("two", "one");
          d.who = d.who.includes("firstcorner") ? d.who.replace("firstcorner", "second") : d.who.replace("second", "firstcorner");

          if (progress[obj.progress].animation) {
            progress[obj.progress].animation(d, jump);
          }

        }

      });
    }
    
  }
}




function nextNote() {
  nextNoteTime += delay;
  currentNote++;
}
function nextAnim() {
  j++;
  
  //console.log("j "+j);
  if (j < theDance[seq].length) {
    currentAnim = theDance[seq][j].time;
    nextAnimTime += (currentAnim-theDance[seq][j-1].time)*delay;
  } else {
    //console.log("end of sequence");
    
    //console.log(dancers);
  }
}


function updateDur(x) {
  //console.log("updating dur");
  sequence.forEach(obj => {
    if (obj.seq && obj.seq.length) {
      obj.seq.forEach(arr => arr.forEach(o => {
        if (o.dur) {
          o.dur *= x;
        }
      }));
    }
  });
  
}

function buildCalls() {
  let call = {};
  let time;
  let first = sequence.find(o => o.part).time;
  sequence.forEach(o => {
    if (o.part) {
      if (call.part) {
        call.calls[call.calls.length-1] += " ("+Math.round(o.time-time)+")";
        calls.push(call);
        call = {};
      }
      call.part = o.part;
      call.calls = [];
      time = o.time;
    }
    if (o.call) {
      if (!o.part) {
        call.calls[call.calls.length-1] += " ("+Math.round(o.time-time)+")";
        time = o.time;
      }
      call.calls.push(o.call);
    }
  });
  if (call.part) {
    call.calls[call.calls.length-1] += " ("+Math.round(sequence[sequence.length-1].time+first-time)+")";
    calls.push(call);
  }
  if (theDance.verses) {
    for (let v = 1; v < theDance.verses.length; v++) {
      calls.push({part: "verse "+(v+1)});
    }
    
  }
}


/* Display the call sheet for the dance. */
function displayCallSheet() {
	/*
  wasDesigning = designing;
	if (designing) {
		$('#design').click();
	}*/
	let html = '';
	if (!calls.length) {
		html = '<h2>No calls defined</h2>';
	}
	else {
		html = '<h2>' + theDance.title + '</h2>' +
			(theDance.formation ? '<p><label>Formation:</label> ' + theDance.formation + '</p>' : "") +
			(theDance.music ? '<p><label>Music:</label> ' + theDance.music + '</p>' : '') +
			(theDance.author ? '<p><label>Author:</label> ' + theDance.author.join(", ") + '</p>' : '') +
			(theDance.notes ? '<p><label>Notes:</label> ' + lineBreaks(theDance.notes) + '</p>' : '') +
			'<table class="callSheet">';
		for (let i = 0; i < calls.length; i++) {
			let part = calls[i]
			html += '<tr><td class="bars">' + part.part + '</td><td>' + part.calls.join("<br/>") + '</td></tr>';
		}
		html += '</table>';
	}
	$('#dialogUnderlay').show();
	$('#callSheetOutput,#callSheetOutput2').html(html);
	$('button.callPrint').toggle(!!calls.length);
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

function buildPos() {
  positions = [];
  let k = 0;
  $.each(sequence, function(i, obj) {
    ["progress", "repeat", "part", "call"].forEach(w => {
      if (obj[w] && (w != "call" || !obj.part)) {
        let pos = {
          time: obj.time,
          type: w === "call" ? "part" : w
        };
        if (obj.part) pos.part = obj.part;
        if (obj.call) pos.call = obj.call;
        if (w === "progress") pos.progress = obj.progress;
        positions.push(pos);
        k++;
      }
    });
    if (obj.seq) {
      let time = obj.time;
      let dur = 0;
      obj.seq.forEach((arr) => arr.forEach((o, l) => {
        if (l === 0) {
          time += dur;
          dur = 0;
        }
        let pos = {
          time: Math.round(time*10)/10,
          dur: o.dur
        };
        for (let key in o) {
          if (!["time", "dur"].includes(key)) {
            pos[key] = o[key];
          }
        }
        positions.push(pos);
        k++;
        dur = Math.round(Math.max(dur, o.dur)*10)/10;
      }));
    }
  });
  
}


/* Return to display mode. */
function displayDance() {
	designing = false;
  seq = "sequence";
	$('#designArea,#designPanel,#positionPanel').hide();
  $(".temp").remove();
  let html = '';
	$.each(calls, function(i, part) {
		html += '<option title="' +
			(part.part || '') +
			'">' + part.part + '</option>';
	});
	$('#position').html(html);
	
}

function designDance() {
	designing = true;
	seq = "positions";
  dancekeys.forEach(k => {
    let val;
    switch (k) {
      case "author":
        val = theDance.author.join(", ");
        $("#editSource").val(val);
        break;
      case "title":
      case "formation":
      case "notes":
        val = theDance[k];
        $("#edit"+k[0].toUpperCase() + k.substring(1)).val(val);
        break;
      case "type":
        let type = dancetypes.find(o => o.type === theDance.type);
        if (type) {
          $('#editType option[value="'+type.code+'"]').prop("selected", true);
        }
      default:
    }
    
  });
  
  
  let postable = "";
  let options = "";
  let k = 0;
  for (let i = 0; i < positions.length; i++) {
    postable += `<tr>
  <td class="position">${i}</td>
  <td>${positions[i].time}</td>
  <td><input type="checkbox" class="positionCheck" value="p${i}" /></td>
  <td>${positions[i].type || ""}</td>
  <td>${positions[i].who || ""}</td>
  <td>` + (positions[i].part ? positions[i].part + ": " : "") + (positions[i].call ? positions[i].call : "") + `</td>
</tr>`;
    
    options += `<option value="p${i}">${i}</option>`;
  }
  
  buildOutput();
  $('#position,#afterPosition').html(options);
  $('#tablePositions tbody').html(postable);
  $('#designArea,#designPanel,#positionPanel').show();
  $("#edit"+currenttab).show();
  theDance.positions = positions;
  
}

/* Add/delete/copy/move one or more positions in the dance. */
function actionPosition() {
	//theDance.modified = true;
	switch ($('#actionPosition').val()) {
		case 'Add':    addPosition(); break;
		case 'Delete': deletePosition(); break;
		//case 'Copy':   copyMovePosition(false); break;
		//case 'Move':   copyMovePosition(true); break;
		//case 'Insert': insertPosition(); break;
    default:
	}
	
}


function buildOutput() {
  let output = "[";
  for (let i = 0; i < positions.length; i++) {
    output += (i > 0 ? "," : "") + `
  {
    `;
    let arr = [];
    for (let key in positions[i]) {
      let val = ["part", "call", "type", "who", "path", "rangle", "langle"].includes(key) ? `"${positions[i][key]}"` : positions[i][key];
      arr.push(`"${key}": ${val}`);
    }
    output += arr.join(`,
    `) + `
  }`;
  }
  output += `
]`;
  $('#editOutput textarea').val(output);
}

function alterPos() {
  let type = ptypes.find(o => o.type === $("#ptype").val());
  if (type) {
    let pos = {
      time: $("#time").val(),
      type: $("#ptype").val()
    };
    type.fields.forEach(f => {
      pos[f] = f === "call" ? $("#editCall").val() : $("#"+f).val();
      if (["x","y","da","dur","dx","dy"].includes(f)) {
        pos[f] = Number(pos[f]);
      }
      if (["dx","dy"].includes(f)) {
        pos[f] = [pos[f]];
      }
    });
    positions.splice(curPos, 1, pos);
    let tr = `
  <td class="position">${curPos}</td>
  <td>${pos.time}</td>
  <td><input type="checkbox" class="positionCheck" value="p${curPos}" /></td>
  <td>${pos.type}</td>
  <td>${pos.who || ""}</td>
  <td>${pos.call || ""}</td>
`;
    $("#tablePositions tr:nth-child("+(curPos+1)+")").html(tr);
    changePos(curPos);
    buildOutput();
  }
  
  
}

function changePos(num) {
  curPos = num;
  $('#position,#afterPosition').val("p"+num);
  $('#tablePositions tr').removeClass("current");
  $("#tablePositions tbody > tr:nth-child("+(num+1)+")").addClass("current");
  $("p.fields input").prop("disabled", true);
  $("p.fields").hide();
  let pos = positions[num];
  $("#ptype").val(pos.type || "").prop("disabled", false);
  for (let key in pos) {
    if (!["type", "call"].includes(key)) {
      $("#"+key).val(pos[key]);
    }
    if (key === "call") {
      $("#editCall").val(pos[key]);
    }
  }
  $(".temp").remove();
  if (pos.type) {
    $("p.fields."+pos.type + " input").prop("disabled", false);
    $("p.fields."+pos.type).show();
  }
  
  $("#time").prop("disabled", false);
  
  if (pos.who) {
    for (let i = 0; i < theDance.roles.length; i++) {
      let d = dancers.find(dancer => dancer.id === "d"+i);
      if (pos.who === "all" || pos.who.split(" ").every(w => d.who.includes(w))) {
        switch (pos.type) {
          case "arms":
            drawer.rect($("#"+d.id + " g"), 0, -5, 50, 10, 3, 3, {transform: "translate(48,0) rotate("+pos.rangle+")", opacity: "0.6", class: "temp"});
            drawer.rect($("#"+d.id + " g"), 0, -5, 50, 10, 3, 3, {transform: "translate(-48,0) rotate("+pos.langle+")", opacity: "0.6", class: "temp"});
            break;
          case "translate":
            var dir = {
              x: getAngle(d.a) > 90 && getAngle(d.a) < 271 ? -1 : 1, 
              y: getAngle(d.a) > 89 && getAngle(d.a) < 270 ? 1 : -1
            };
            var arr = ["M"+d.x, d.y, "l"+(dir.x*pos.x), dir.y*pos.y]
            drawer.path(arr.join(" "), {fill: "none", stroke: "rgb(0, 210, 207)", "stroke-width": 2, class: "temp"});
            break;
          case "path":
            var dir = {
              x: getAngle(d.a) > 90 && getAngle(d.a) < 271 ? -1 : 1, 
              y: getAngle(d.a) > 89 && getAngle(d.a) < 270 ? 1 : -1
            };
            var arr = ["M"+d.x, d.y, pos.path, dir.x*pos.dx, dir.y*pos.dy];
            drawer.path(arr.join(" "), {fill: "none", stroke: "rgb(0, 210, 207)", "stroke-width": 2, class: "temp"});
            break;
          case "rotate":
            let g = drawer.group($("#"+d.id+ " g"), {transform: "rotate("+(pos.da)+")", opacity: "0.6", class: "temp"});
            drawer.ellipse(g, 0, 0, 50, 20);
            drawer.rect(g, 0, -5, 50, 10, 3, 3, {transform: "translate(48,0) rotate("+d.arms.r+")"});
            drawer.rect(g, 0, -5, 50, 10, 3, 3, {transform: "translate(-48,0) rotate("+d.arms.l+")"});
            break;
          default:
        }
      }
    }
  }
  
}

/* Add one or more positions to the dance. */
function addPosition() {
	var count = parseInt($('#countPosition').val(), 10);
	if (count <= 0) {
		alert('Please enter the number of new positions');
		$('#countPosition').focus();
		return;
	}
	var after = Number($('#afterPosition').val().slice(1));
	
	
	for (var i = 0; i < count; i++) { // Duplicate 'after' position
		positions.splice(after + 1, 0, {time: positions[after].time, type: ""}); // And add
	}
	designDance();
  $("#position").val("p"+(after+1));
  $("#position").change();
	return;
}

function deletePosition() {
  var deletions = $('#tablePositions input:checked');
	if (!deletions.length) {
		alert('Please select the positions to delete');
		return;
	} else {
    if (!confirm("sure you want to delete?")) {
      return;
    } else {
      let list = [];
      $.each(deletions, function(i, p) {
        list.unshift(i);
      });
      list.forEach(i => {
        positions.splice(i, 1);
      });
      designDance();
      return;
    }
    
  }
  
}



/* Convert line breaks to HTML. */
function lineBreaks(text) {
	return text.replace(/\n/g, '<br>');
}

/* Convert http references to links. */
function makeLinks(text) {
	return text.replace(/(https:\/\/[^\s]+)\./g, '<a href="$1">$1</a>.');
}





