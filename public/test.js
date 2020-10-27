const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var numdancers = 6;
var dancers = [
  {id: "d0", x: 100, y: -200, a: 180, pathx: 0, pathy: 0, who: "active one lark"},
  {id: "d1", x: -100, y: -200, a: 180, pathx: 0, pathy: 0, who: "active one robin"},
  {id: "d2", x: -100, y: -50, a: 0, pathx: 0, pathy: 0, who: "active two lark"},
  {id: "d3", x: 100, y: -50, a: 0, pathx: 0, pathy: 0, who: "active two robin"},
  {id: "d4", x: -100, y: 100, a: 0, pathx: 0, pathy: 0, who: "lark two out"},
  {id: "d5", x: 100, y: 100, a: 0, pathx: 0, pathy: 0, who: "robin two out"}
];
var sequence = [
  {
    time: 0.0, //timepoint of last thing, for repeats
    events: [] //[{type: "placeholder"}]
  },
  //neighbor balance
  {
    time: 0.5,
    call: "Neighbor balance and swing",
    events: [
      [
        {who: "active", type: "arms", rangle: "-95", langle: "-85", dur: 200, time: 0.5},
        {who: "active", type: "translate", x: 0, y: 28, dur: 650, time: 0.5}
      ],
      [
        {who: "active", type: "translate", x: 0, y: 12, dur: 200, time: 1.8},
        {who: "active", type: "arms", rangle: "-135", langle: "-45", dur: 200, time: 1.8}
      ]
    ]
  },
  {
    time: 3.0,
    events: [
      [
        {who: "active", type: "arms", rangle: "-95", langle: "-85", dur: 500, time: 3.0},
        {who: "active", type: "translate", x: 0, y: -14, dur: 500, time: 3.0}
      ]
    ]
  },
  //neighbor swing
  {
    time: 5.0,
    events: [
      [
        {who: "active", type: "translate", x: -10, y: 14, dur: 400, time: 5.0},
        {who: "active", type: "arms", rangle: "-75", langle: "-75", dur: 400, time: 5.0}
      ],
      [
        {who: "active", type: "path", path: "a34.5 34.5 0 0 1", dx: 20, dy: 66, dur: 1580},
        {who: "active", type: "rotate", da: 180, dur: 1580}
      ],
      [
        {who: "active", type: "path", path: "a34.5 34.5 0 0 1", dx: 20, dy: 66, dur: 1580},
        {who: "active", type: "rotate", da: 180, dur: 1580}
      ],
      [
        {who: "active", type: "path", path: "a34.5 34.5 0 0 1", dx: -6, dy: 63, dur: 1180},
        {who: "active", type: "rotate", da: 135, dur: 1180}
      ],
      [
        {who: "active lark", type: "rotate", da: -45, dur: 785, time: 14.6},
        {who: "active robin", type: "rotate", da: 135, dur: 785, time: 14.6},
        {who: "all", type: "translate", to: {x: 0, y: -1}, x: 100, y: 150, xoff: 0, yoff: -50, dur: 785},
        {who: "active", type: "arms", rangle: "-55", langle: "-125", dur: 785}
      ]
    ]
  },
  //Long lines forward and back
  {
    time: 16.5,
    call: "Long lines go forward and back",
    events: []
  },
  {
    time: 17.0,
    events: [
      [{who: "active", type: "translate", x: 50, y: 0, dur: 1600, time: 17.0}],
    ]
  },
  {
    time: 21.0,
    events: [
      [{who: "active", type: "translate", x: -50, y: 0, dur: 1600, time: 21.0}],
    ]
  },
  //Robins dosido 1.5
  {
    time: 24.5,
    call: "Robins dosido 1.5",
  },
  {
    time: 25.0,
    events: [
      [
        {who: "active", type: "arms", rangle: "-135", langle: "-45", dur: 470, time: 25.0},
        {who: "active robin", type: "translate", x: 40, y: -60, dur: 470, time: 25.0},
        {who: "active robin", type: "rotate", da: -60, dur: 480, time: 25.0}
      ],
      [{who: "active robin", type: "translate", x: 40, y: 60, dur: 470, time: 26.0}],
      [{who: "active robin", type: "translate", x: 70, y: -40, dur: 470, time: 27.0}],
      [{who: "active robin", type: "translate", x: -40, y: -60, dur: 470, time: 28.0}],
      [{who: "active robin", type: "translate", x: -70, y: 40, dur: 470, time: 29.0}],
      [{who: "active robin", type: "translate", x: 40, y: 60, dur: 470, time: 30.0}],
      [
        {who: "active robin", type: "translate", x: 120, y: 2, dur: 940, time: 31.0},
        {who: "active robin", type: "rotate", da: 150, dur: 940, time: 31.0}
      ],
      
    ]
  },
  {
    time: 32.0,
    events: [
      [
        {who: "active lark", type: "rotate", da: 90, dur: 390, time: 32.0},
        {who: "active lark", type: "translate", x: 0, y: 28, dur: 390, time: 32.0},
        {who: "active", type: "arms", rangle: "-95", langle: "-85", dur: 390, time: 32.0}
      ],
    ]
  },
  
  //Partner balance
  {
    time: 32.5,
    call: "Partner balance and swing",
  },
  {
    time: 33.0,
    events: [
      [
        {who: "active", type: "translate", x: 0, y: 12, dur: 500, time: 33.0},
        {who: "active", type: "arms", rangle: "-135", langle: "-45", dur: 500, time: 33.0}
      ]
    ]
  },
  {
    time: 35.0,
    events: [
      [
        {who: "active", type: "translate", x: 0, y: -14, dur: 500, time: 35.0},
        {who: "active", type: "arms", rangle: "-95", langle: "-85", dur: 500, time: 35.0}
      ]
    ]
  },
  
  //partner swing
  {
    time: 37.0,
    events: [
      [
        {who: "active", type: "translate", x: -10, y: 14, dur: 300, time: 37.0},
        {who: "active", type: "arms", rangle: "-75", langle: "-75", dur: 300, time: 37.0}
      ],
      [
        {who: "active", type: "path", path: "a34.5 34.5 0 0 1", dx: 20, dy: 66, dur: 1280},
        {who: "active", type: "rotate", da: 180, dur: 1280, time: 37.6}
      ],
      [
        {who: "active", type: "path", path: "a34.5 34.5 0 0 1", dx: 20, dy: 66, dur: 1280},
        {who: "active", type: "rotate", da: 180, dur: 1280, time: 40.2}
      ],
      [
        {who: "active", type: "path", path: "a34.5 34.5 0 0 1", dx: 20, dy: 66, dur: 1280},
        {who: "active", type: "rotate", da: 180, dur: 1280, time: 42.8}
      ],
      [
        {who: "active", type: "path", path: "a34.5 34.5 0 0 1", dx: -6, dy: 63, dur: 980},
        {who: "active", type: "rotate", da: 135, dur: 980, time: 45.4}
      ],
      [
        {who: "active lark", type: "rotate", da: -45, dur: 590, time: 47.4},
        {who: "active robin", type: "rotate", da: 135, dur: 590, time: 47.4},
        {who: "all", type: "translate", to: {x: 0, y: -1}, x: 100, y: 150, xoff: 0, yoff: -50, dur: 600, time: 47.4},
        {who: "active", type: "arms", rangle: "-55", langle: "-125", dur: 590, time: 47.4}
      ]
    ]
  },
  //circle left
  {
    time: 48.5,
    call: "Circle left 3/4",
  },
  {
    time: 49.0,
    events: [
      [
        {who: "active", type: "translate", x: 25, y: 0, dur: 400, time: 49.0},
        {who: "active", type: "arms", rangle: "-40", langle: "-85", dur: 400, time: 49.0},
        {who: "active lark", type: "rotate", da: 30, dur: 400, time: 49.0},
        {who: "active robin", type: "rotate", da: -60, dur: 400, time: 49.0}
      ],
      [
        {who: "active lark", type: "path", path: "a106 106 0 1 1", dx: 0, dy: 150, dur: 3100, time: 49.8},
        {who: "active robin", type: "path", path: "a106 106 0 1 1", dx: 150, dy: 0, dur: 3100, time: 49.8},
        {who: "active", type: "rotate", da: 244, dur: 2800, time: 49.8}
      ]
    ]
  },
  {
    time: 55.4,
    events: [
      [
        {who: "active", type: "rotate", da: 41, dur: 300, time: 55.4},
        {who: "active", type: "arms", rangle: "-65", langle: "-115", dur: 300, time: 55.4}
      ]
    ]
  },
  //balance the circle
  
  {
    call: "Balance the ring", 
    time: 56.5
  },
  {
    time: 57.0,
    events: [
      [
        {who: "active lark", type: "translate", x: 20, y: 20, dur: 500, time: 57.0},
        {who: "active robin", type: "translate", x: -20, y: 20, dur: 500, time: 57.0},
        {who: "active", type: "arms", rangle: "-108", langle: "-72", dur: 500, time: 57.0}
      ]
    ]
  },
  {
    time: 59.0,
    events: [
      [
        {who: "active lark", type: "translate", x: -20, y: -20, dur: 500, time: 59.0},
        {who: "active robin", type: "translate", x: 20, y: -20, dur: 500, time: 59.0},
        {who: "active", type: "arms", rangle: "-65", langle: "-115", dur: 500, time: 59.0}
      ]
    ]
  },
  //arch and dive
  {
    call: "Twos arch, ones dive",
    time: 60.6,
    events: [
      [
        {who: "active two lark", type: "arms", rangle: "-15", langle: "-45", dur: 200},
        {who: "active two robin", type: "arms", rangle: "-135", langle: "-165", dur: 200},
        {who: "active two lark", type: "rotate", da: -45, dur: 200, time: 60.6},
        {who: "active two robin", type: "rotate", da: 45, dur: 200, time: 60.6},
        {who: "active two lark", type: "translate", x: -23, y: 0, dur: 200, time: 60.6},
        {who: "active two robin", type: "translate", x: 23, y: 0, dur: 200, time: 60.6},
        {who: "active one lark", type: "translate", x: 30, y: 0, dur: 200, time: 60.6},
        {who: "active one robin", type: "translate", x: -30, y: 0, dur: 200, time: 60.6},
        {who: "active one lark", type: "arms", rangle: "-120", langle: "-45", dur: 200},
        {who: "active one robin", type: "arms", rangle: "-135", langle: "-60", dur: 200},
        {who: "active", type: "zindex", front: "two", time: 60.6}
      ],
      [
        {who: "active", type: "translate", x: 0, y: 150, dur: 1300, time: 61.0}
      ],
      [
        {who: "active one lark", type: "translate", x: -55, y: 0, dur: 400, time: 63.6},
        {who: "active one robin", type: "translate", x: 55, y: 0, dur: 400, time: 63.6},
        {who: "active one lark", type: "rotate", da: -45, dur: 200, time: 63.6},
        {who: "active one robin", type: "rotate", da: 45, dur: 200, time: 63.6},
        {who: "active one lark", type: "arms", rangle: "-50", langle: "-45", dur: 200},
        {who: "active one robin", type: "arms", rangle: "-135", langle: "-130", dur: 200},
        {who: "active two lark", type: "translate", x: -2, y: 0, dur: 250, time: 63.6},
        {who: "active two robin", type: "translate", x: 2, y: 0, dur: 250, time: 63.6}
      ]
    ]
  },
  {
    time: 64.0,
    events: [
      [
        {who: "active", type: "arms", rangle: "-135", langle: "-45", dur: 200, time: 64.0},
        {who: "all", type: "zindex", front: "robin", time: 64.0}
      ]
    ],
    progress: true,
    repeat: true
  },

  //[{type: "progress", time: 64.2},
  //{type: "repeat", time: 64.2}]
]; 
let j = 1;

let currentAnim = 0.5;
let nextAnimTime = 0.0;
const lookahead = 25;
const scheduleAheadTime = 0.1;
let currentNote = -3;
let nextNoteTime = 0.0;
const delay = 0.497;
let queue = [];
let timer, dtimer;
let playing = false;
let dancing = false;
let tune = new Audio();
let url = "https://cdn.glitch.com/1b11a1fb-599e-47a3-9eff-c7176b15bb2c%2F15%20Track%2015.mp3?v=1601421515332";
tune.src = url;
let repeats = 0;

///*
sequence.forEach(obj => {
  if (obj.events && obj.events.length) {
    obj.events.forEach(arr => arr.forEach(o => {
      if (o.dur) {
        o.dur = o.dur/5 * delay * 10;
      }
    }));
  }
});

//*/

//
tune.addEventListener('loadeddata', () => {
  //console.log("tune loaded");
  tune.currentTime = 0.5;
});
//console.log(Math.hypot(75,75))
//getCoord(34.5, 118, {x: -95, y: 0});
//getAngle(-105,33,34.5,{x: -95, y: 0});
//give th in degrees, center obj must have x and y
function getCoord(r, th, center) {
  th = th*Math.PI/180;
  let x = r*Math.cos(th) + center.x;
  let y = center.y - r*Math.sin(th);
  console.log(x,y);
  //return {x: x, y: y};
}
function getAngle(x, y, r, center) {
  let n = (x-center.x)/r;
  let th = Math.acos(n)*180/Math.PI;
  console.log(th);
}

$("#reset").click(function() {
  clearTimeout(timer);
  clearTimeout(dtimer);
  playing = false;
  dancing = false;
  $("#call").text("");
  currentNote = -3;
  currentAnim = 0.5;
  repeats = 0;
  let x = 1;
  let cnum = 1;
  dancers.sort((a,b) => Number(a.id.substring(1)) - Number(b.id.substring(1)));
  for (let i = 0; i < numdancers; i++) {
    let active = 4-i%4 + i < numdancers;
    let role = i%2 === 0 ? "lark" : "robin";
    let d = dancers[i];
    d.x = (active ? 100*x : role === "lark" ? -100 : 100)-d.pathx;
    d.y = (cnum-2)*150-50 - d.pathy;
    d.a = cnum%2 === 1 && active ? 180 : 0;
    d.who = (active ? "active" : "") + (cnum%2 === 1 && active ? " one" : " two") + " " + role;
    
    $("#d"+i).attr("transform", "translate("+d.x+","+d.y+")");
    $("#d"+i + " g").attr("transform", "rotate("+d.a+")");
    if (i%2 === 0) x*=-1;
    if (i%2 === 1) cnum++;
  }
  let nummoved = 0;
  for (let k = 0; k < numdancers; k++) {
      let dg = $(".dancer:nth-of-type("+(k+1-nummoved)+")");
      let id = dg.attr("id");
      let d = dancers.find(o => o.id === id);
      if (d && d.who.includes("robin")) {
        nummoved++;
        $("svg").append(dg.detach());
      }
    }
  
  $("rect.right").attr("transform", "translate(48, 0) rotate(-135)");
  $("rect.left").attr("transform", "translate(-48, 0) rotate(-45)");
  j = 1;
  
});

$("#button").click(function() {
  if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
  if (j < sequence.length) {
    //dance();
  }
  dancing = !dancing;
  if (dancing) {
    playing = true;
    $("#button").text("Stop");
    j = 0;
    nextNoteTime = audioCtx.currentTime;
    nextAnimTime = (sequence[j].time-currentNote)*delay + audioCtx.currentTime;
    tune.play();
    //scheduler();
    danceScheduler();
  } else {
    clearTimeout(dtimer);
    clearTimeout(timer);
    tune.pause();
    tune.load();
    $("#button").text("Go");
  }
  /*
  $(".right").animate({svgTransform: "translate(48, 0) rotate(-95)"}, 300, "linear");
  $(".left").animate({svgTransform: "translate(-48, 0) rotate(-85)"}, 300, "linear");
  let y = 1;
  for (let i = 0; i < numdancers; i++) {
    let d = dancers[i];
    let newy = d.y + y*10;
    $("#d"+i).animate({svgTransform: "translate("+d.x+", "+newy +")"}, 600, "linear");
    if (i%2 === 1) y*=-1;
  }
  */
  //
});

$("#play").click(function() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  playing = !playing;
  if (playing) {
    $("#play").text("Stop");
    nextNoteTime = audioCtx.currentTime;
    scheduler();
  } else {
    clearTimeout(timer);
    $("#play").text("Play");
    currentNote = -3;
  }
  //play(440, audioCtx.currentTime)
});



function animate(a, j1, i) {
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
            $("#"+d.id+" "+o.class).animate({svgTransform: "translate("+o.x+", 0) rotate("+obj[o.key]+")"}, obj.dur, "linear", next);
          });
        }
      }

    }
    if (obj.type === "translate") { //relative distances provided
      for (let k = 0; k < numdancers; k++) {
        let d = dancers[k];
        if (obj.who === "all" || obj.who.split(" ").every(w => d.who.includes(w))) {
          let dir = {
            x: d.a%360 > 90 && d.a%360 < 271 ? -1 : 1, 
            y: d.a%360 > 89 && d.a%360 < 270 ? 1 : -1
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
          $("#d"+k).animate({svgTransform: "translate("+coords.x+","+coords.y+")"}, obj.dur, "linear", next);
        }

      }
    }
    if (obj.type === "path") {

      for (let k = 0; k < numdancers; k++) {
        let d = dancers[k];
        if (obj.who === "all" || obj.who.split(" ").every(w => d.who.includes(w))) {
          total++;
          let xdir = d.a%360 > 90 && d.a%360 < 271 ? -1 : 1;
          let ydir = d.a%360 > 89 && d.a%360 < 270 ? 1 : -1;
          $("#anim"+k).attr("path", "M"+[d.pathx, d.pathy, obj.path, obj.dx*xdir, obj.dy*ydir].join(" "));
          //console.log($("#anim"+k).attr("path"));
          //$("#d"+k).attr("transform", "translate("+d.x+","+d.y+")");
          $("#anim"+k).attr("dur", obj.dur + "ms");
          d.pathx += obj.dx*xdir;
          d.pathy += obj.dy*ydir;
          document.getElementById("anim"+k).removeEventListener("endEvent", next);
          document.getElementById("anim"+k).addEventListener("endEvent", next);
          document.getElementById("anim"+k).beginElement();
        }


      }
    }
    if (obj.type === "rotate") { //relative rotation
      for (let k = 0; k < numdancers; k++) {
        let d = dancers[k];
        if (obj.who === "all" || obj.who.split(" ").every(w => d.who.includes(w))) {
          total++;
          let a = d.a + obj.da;
          d.a = a;
          $("#d"+k + " g").animate({svgTransform: "rotate("+a+")"}, obj.dur, "linear", next);
        }

      }
    }
    if (obj.type === "zindex") {
      let moved = 0;
      total++;
      for (let k = 0; k < numdancers; k++) {
        let dg = $(".dancer:nth-of-type("+(k+1-moved)+")");
        let id = dg.attr("id");
        //console.log(id);
        let d = dancers.find(o => o.id === id);
        if (d && d.who.includes(obj.front) && (obj.who.split(" ").every(w => d.who.includes(w)) || obj.who === "all")) {
          //console.log("moved");
          moved++;
          $("svg").append(dg.detach());
        }
      }
      next();
    }
    
  });
  
  function next() {
    anims++;
    if (anims === total) {
      i++;
      if (i < sequence[j1].events.length) {
        animate(sequence[j1].events[i], j1, i);
      } else {
        //console.log("j1 "+j1);
      }
      
    }
  }
  
}

/*
setupSample()
.then((sample) => {
  tune = sample;
  console.log("tune ready");
});
*/

$("#d1").on("click", function() {
  console.log($(this).attr("transform"));
  //$(this).animate({svgX: "-95", svgY: "0"}, 600, "linear");
  //document.getElementById("test").beginElement();
  //$("#r1").animate({svgTransform: "rotate(-180)"}, 1000, "linear");
});

function danceScheduler() {
  while (nextAnimTime < audioCtx.currentTime + scheduleAheadTime && j < sequence.length) {
    scheduleDance(sequence[j]);
    nextAnim();
  }
  dtimer = setTimeout(danceScheduler, lookahead);
}


function scheduler() {
  while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
    scheduleNote(currentNote, nextNoteTime);
    nextNote();
  }
  timer = setTimeout(scheduler, lookahead);
}

function scheduleDance(obj) {
  if (obj.call) {
    $("#call").text(obj.call);
  }
  if (obj.repeat) {
    repeats++;
    if (repeats < 9) j = 0;
  }
  if (obj.events && obj.events.length) {
    animate(obj.events[0], j, 0);
  }
  if (obj.progress) {
    dancers.filter(d => d.y + d.pathy === -200 || d.y + d.pathy === (numdancers/2-2)*150-50).forEach(d => {
      if (d.who.includes("out")) {
        d.who = d.who.replace("out", "active");
      } else if (d.who.includes("active")) {
        d.who = d.who.replace("active", "out");
        d.who = d.who.includes("one") ? d.who.replace("one", "two") : d.who.replace("two", "one");
        let k = d.id.substr(1);
        let xdir = d.x + d.pathx > 0 ? -1 : 1;
        
        $("#anim"+k).attr("dur", "2s");
        $("#anim"+k).attr("path", "M"+ [d.pathx, d.pathy, "a100 55 0 1 1", 200*xdir, "0"].join(" "));
        d.pathx += 200*xdir;
        d.a += 180;
        $("#d"+k+" g").animate({svgTransform: "rotate("+(d.a)+")"}, 2000, "linear");
        document.getElementById("anim"+k).beginElement();
      }
      
    });
  }
}

function scheduleNote(note, time) {
  queue.push({note: note, time: time});
  let hz = note < 1 || note%2 === 0 ? 440 : 880/3;
  play(hz, time)
}

function nextNote() {
  nextNoteTime += delay;
  currentNote++;
}
function nextAnim() {
  j++;
  //console.log("j "+j);
  if (j < sequence.length) {
    currentAnim = sequence[j].time;
    nextAnimTime += (currentAnim-sequence[j-1].time)*delay;
  } else {
    //console.log(dancers);
  }
}

function play(hz, t) {
  let osc = audioCtx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = hz;
  osc.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}



(function($) {
  
  function SVGManager() {
    this._settings = []; // Settings to be remembered per SVG object
    this._extensions = []; // List of SVG extensions added to SVGWrapper
      // for each entry [0] is extension name, [1] is extension class (function)
      // the function takes one parameter - the SVGWrapper instance
    this.regional = []; // Localisations, indexed by language, '' for default (English)
    this.regional[''] = {errorLoadingText: 'Error loading'};
    this.local = this.regional['']; // Current localisation
    this._uuid = new Date().getTime();
    this._ie = !!window.ActiveXObject;
  }
  $.extend(SVGManager.prototype, {
	/** Class name added to elements to indicate already configured with SVG. */
	markerClassName: 'hasSVG',
	/** Name of the data property for instance settings. */
	propertyName: 'svgwrapper',

	/** SVG namespace. */
	svgNS: 'http://www.w3.org/2000/svg',
	/** XLink namespace. */
	xlinkNS: 'http://www.w3.org/1999/xlink',

	/** SVG wrapper class. */
	//_wrapperClass: SVGWrapper,

	/* Camel-case versions of attribute names containing dashes or are reserved words. */
	_attrNames: {class_: 'class', in_: 'in',
		alignmentBaseline: 'alignment-baseline', baselineShift: 'baseline-shift',
		clipPath: 'clip-path', clipRule: 'clip-rule',
		colorInterpolation: 'color-interpolation',
		colorInterpolationFilters: 'color-interpolation-filters',
		colorRendering: 'color-rendering', dominantBaseline: 'dominant-baseline',
		enableBackground: 'enable-background', fillOpacity: 'fill-opacity',
		fillRule: 'fill-rule', floodColor: 'flood-color',
		floodOpacity: 'flood-opacity', fontFamily: 'font-family',
		fontSize: 'font-size', fontSizeAdjust: 'font-size-adjust',
		fontStretch: 'font-stretch', fontStyle: 'font-style',
		fontVariant: 'font-variant', fontWeight: 'font-weight',
		glyphOrientationHorizontal: 'glyph-orientation-horizontal',
		glyphOrientationVertical: 'glyph-orientation-vertical',
		horizAdvX: 'horiz-adv-x', horizOriginX: 'horiz-origin-x',
		imageRendering: 'image-rendering', letterSpacing: 'letter-spacing',
		lightingColor: 'lighting-color', markerEnd: 'marker-end',
		markerMid: 'marker-mid', markerStart: 'marker-start',
		stopColor: 'stop-color', stopOpacity: 'stop-opacity',
		strikethroughPosition: 'strikethrough-position',
		strikethroughThickness: 'strikethrough-thickness',
		strokeDashArray: 'stroke-dasharray', strokeDashOffset: 'stroke-dashoffset',
		strokeLineCap: 'stroke-linecap', strokeLineJoin: 'stroke-linejoin',
		strokeMiterLimit: 'stroke-miterlimit', strokeOpacity: 'stroke-opacity',
		strokeWidth: 'stroke-width', textAnchor: 'text-anchor',
		textDecoration: 'text-decoration', textRendering: 'text-rendering',
		underlinePosition: 'underline-position', underlineThickness: 'underline-thickness',
		vertAdvY: 'vert-adv-y', vertOriginY: 'vert-origin-y',
		wordSpacing: 'word-spacing', writingMode: 'writing-mode'},

	/* Add the SVG object to its container. */
	_attachSVG: function(container, settings) {
		var svg = (container.namespaceURI === this.svgNS ? container : null);
		var container = (svg ? null : container);
		if ($(container || svg).hasClass(this.markerClassName)) {
			return;
		}
		if (typeof settings === 'string') {
			settings = {loadURL: settings};
		}
		else if (typeof settings === 'function') {
			settings = {onLoad: settings};
		}
		$(container || svg).addClass(this.markerClassName);
		try {
			if (!svg) {
				svg = document.createElementNS(this.svgNS, 'svg');
				svg.setAttribute('version', '1.1');
				if (container.clientWidth > 0) {
					svg.setAttribute('width', container.clientWidth);
				}
				if (container.clientHeight > 0) {
					svg.setAttribute('height', container.clientHeight);
				}
				container.appendChild(svg);
			}
			this._afterLoad(container, svg, settings || {});
		}
		catch (e) {
			$(container).html('<p>SVG is not supported natively on this browser</p>');
		}
	},

	/* Post-processing once loaded. */
	_afterLoad: function(container, svg, settings) {
		var settings = settings || this._settings[container.id];
		this._settings[container ? container.id : ''] = null;
		var wrapper = new this._wrapperClass(svg, container);
		$.data(container || svg, $.svg.propertyName, wrapper);
		try {
			if (settings.loadURL) { // Load URL
				wrapper.load(settings.loadURL, settings);
			}
			if (settings.settings) { // Additional settings
				wrapper.configure(settings.settings);
			}
			if (settings.onLoad && !settings.loadURL) { // Onload callback
				settings.onLoad.apply(container || svg, [wrapper]);
			}
		}
		catch (e) {
			alert(e);
		}
	},

	/** Return the SVG wrapper created for a given container.
		@param container {string|Element|jQuery} Selector for the container or
				the container for the SVG object or jQuery collection where first entry is the container.
		@return {SVGWrapper} The corresponding SVG wrapper element, or <code>null</code> if not attached. */
	_getSVG: function(container) {
		return $(container).data(this.propertyName);
	},

	/** Remove the SVG functionality from a div.
		@param container {Element} The container for the SVG object. */
	_destroySVG: function(container) {
		container = $(container);
		if (!container.hasClass(this.markerClassName)) {
			return;
		}
		container.removeClass(this.markerClassName).removeData(this.propertyName);
		if (container[0].namespaceURI !== this.svgNS) {
			container.empty();
		}
	},

	/** Extend the SVGWrapper object with an embedded class.
		<p>The constructor function must take a single parameter that is
	   a reference to the owning SVG root object. This allows the 
		extension to access the basic SVG functionality.</p>
		@param name {string} The name of the <code>SVGWrapper</code> attribute to access the new class.
		@param extClass {function} The extension class constructor. */
	addExtension: function(name, extClass) {
		this._extensions.push([name, extClass]);
	},

	/** Does this node belong to SVG?
		@param node {Element} The node to be tested.
		@return {boolean} <code>true</code> if an SVG node, <code>false</code> if not. */
	isSVGElem: function(node) {
		return (node.nodeType === 1 && node.namespaceURI === $.svg.svgNS);
	}
});
  
  $.fn.svg = function(options) {
	var otherArgs = Array.prototype.slice.call(arguments, 1);
	if (typeof options === 'string' && options === 'get') {
		return $.svg['_' + options + 'SVG'].apply($.svg, [this[0]].concat(otherArgs));
	}
	return this.each(function() {
		if (typeof options === 'string') {
			$.svg['_' + options + 'SVG'].apply($.svg, [this].concat(otherArgs));
		}
		else {
			$.svg._attachSVG(this, options || {});
		} 
	});
};

// Singleton primary SVG interface
$.svg = new SVGManager();
  
  // Enable animation for all of these SVG numeric attributes -
// named as svg-* or svg* (with first character upper case)
$.each(['x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2',
		'stroke-width', 'strokeWidth', 'opacity', 'fill-opacity', 'fillOpacity',
		'stroke-opacity', 'strokeOpacity', 'stroke-dashoffset', 'strokeDashOffset',
		'font-size', 'fontSize', 'font-weight', 'fontWeight',
		'letter-spacing', 'letterSpacing', 'word-spacing', 'wordSpacing'],
	function(i, attrName) {
		var ccName = attrName.charAt(0).toUpperCase() + attrName.substr(1);
		if ($.cssProps) {
			$.cssProps['svg' + ccName] = $.cssProps['svg-' + attrName] = attrName;
		}
		$.fx.step['svg' + ccName] = $.fx.step['svg-' + attrName] = function(fx) {
			var realAttrName = $.svg._attrNames[attrName] || attrName;
			var attr = fx.elem.attributes.getNamedItem(realAttrName);
			if (!fx.set) {
				fx.start = (attr ? parseFloat(attr.nodeValue) : 0);
				var offset = ""//(fx.options.curAnim['svg' + ccName] || fx.options.curAnim['svg-' + attrName]);
				if (/^[+-]=/.exec(offset)) {
					fx.end = fx.start + parseFloat(offset.replace(/=/, ''));
				}
				$(fx.elem).css(realAttrName, '');
				fx.set = true;
			}
			var value = (fx.pos * (fx.end - fx.start) + fx.start) + (fx.unit === '%' ? '%' : '');
			(attr ? attr.nodeValue = value : fx.elem.setAttribute(realAttrName, value));
		};
	}
);
  
  // Enable animation for the SVG transform attribute
$.fx.step['svgTransform'] = $.fx.step['svg-transform'] = function(fx) {
	var attr = fx.elem.attributes.getNamedItem('transform');
	if (!fx.set) {
		fx.start = parseTransform(attr ? attr.nodeValue : '');
		fx.end = parseTransform(fx.end, fx.start);
		fx.set = true;
	}
	var transform = '';
	for (var i = 0; i < fx.end.order.length; i++) {
		switch (fx.end.order.charAt(i)) {
			case 't':
				transform += ' translate(' +
					(fx.pos * (fx.end.translateX - fx.start.translateX) + fx.start.translateX) + ',' +
					(fx.pos * (fx.end.translateY - fx.start.translateY) + fx.start.translateY) + ')';
				break;
			case 's':
				transform += ' scale(' + (fx.pos * (fx.end.scaleX - fx.start.scaleX) + fx.start.scaleX) + ',' +
					(fx.pos * (fx.end.scaleY - fx.start.scaleY) + fx.start.scaleY) + ')';
				break;
			case 'r':
				transform += ' rotate(' + (fx.pos * (fx.end.rotateA - fx.start.rotateA) + fx.start.rotateA) + ',' +
					(fx.pos * (fx.end.rotateX - fx.start.rotateX) + fx.start.rotateX) + ',' +
					(fx.pos * (fx.end.rotateY - fx.start.rotateY) + fx.start.rotateY) + ')';
				break;
			case 'x':
				transform += ' skewX(' + (fx.pos * (fx.end.skewX - fx.start.skewX) + fx.start.skewX) + ')';
			case 'y':
				transform += ' skewY(' + (fx.pos * (fx.end.skewY - fx.start.skewY) + fx.start.skewY) + ')';
				break;
			case 'm':
				var matrix = '';
				for (var j = 0; j < 6; j++) {
					matrix += ',' + (fx.pos * (fx.end.matrix[j] - fx.start.matrix[j]) + fx.start.matrix[j]);
				}				
				transform += ' matrix(' + matrix.substr(1) + ')';
				break;
		}
	}
	(attr ? attr.nodeValue = transform : fx.elem.setAttribute('transform', transform));
};

/** Decode a transform string and extract component values.
	@private
	@param value {string} The transform string to parse.
	@param original {object} The settings from the original node.
	@return {object} The combined transformation attributes. */
function parseTransform(value, original) {
	value = value || '';
	if (typeof value === 'object') {
		value = value.nodeValue;
	}
	var transform = $.extend({translateX: 0, translateY: 0, scaleX: 0, scaleY: 0,
		rotateA: 0, rotateX: 0, rotateY: 0, skewX: 0, skewY: 0, matrix: [0, 0, 0, 0, 0, 0]}, original || {});
	transform.order = '';
	var pattern = /([a-zA-Z]+)\(\s*([+-]?[\d\.]+)\s*(?:[\s,]\s*([+-]?[\d\.]+)\s*(?:[\s,]\s*([+-]?[\d\.]+)\s*(?:[\s,]\s*([+-]?[\d\.]+)\s*[\s,]\s*([+-]?[\d\.]+)\s*[\s,]\s*([+-]?[\d\.]+)\s*)?)?)?\)/g;
	var result = pattern.exec(value);
	while (result) {
		switch (result[1]) {
			case 'translate':
				transform.order += 't';
				transform.translateX = parseFloat(result[2]);
				transform.translateY = (result[3] ? parseFloat(result[3]) : 0);
				break;
			case 'scale':
				transform.order += 's';
				transform.scaleX = parseFloat(result[2]);
				transform.scaleY = (result[3] ? parseFloat(result[3]) : transform.scaleX);
				break;
			case 'rotate':
				transform.order += 'r';
				transform.rotateA = parseFloat(result[2]);
				transform.rotateX = (result[3] ? parseFloat(result[3]) : 0);
				transform.rotateY = (result[4] ? parseFloat(result[4]) : 0);
				break;
			case 'skewX':
				transform.order += 'x';
				transform.skewX = parseFloat(result[2]);
				break;
			case 'skewY':
				transform.order += 'y';
				transform.skewY = parseFloat(result[2]);
				break;
			case 'matrix':
				transform.order += 'm';
				transform.matrix = [parseFloat(result[2]), parseFloat(result[3]),
					parseFloat(result[4]), parseFloat(result[5]), parseFloat(result[6]), parseFloat(result[7])];
				break;
		}
		result = pattern.exec(value);
	}
	if (transform.order === 'm' && Math.abs(transform.matrix[0]) === Math.abs(transform.matrix[3]) &&
			transform.matrix[1] !== 0 && Math.abs(transform.matrix[1]) === Math.abs(transform.matrix[2])) {
		// Simple rotate about origin and translate
		var angle = Math.acos(transform.matrix[0]) * 180 / Math.PI;
		angle = (transform.matrix[1] < 0 ? 360 - angle : angle);
		transform.order = 'rt';
		transform.rotateA = angle;
		transform.rotateX = transform.rotateY = 0;
		transform.translateX = transform.matrix[4];
		transform.translateY = transform.matrix[5];
	}
	return transform;
}
  
})(jQuery)