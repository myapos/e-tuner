// globals
var audioContext;
var analyser;
var processor;
var node;
var input;
var output;
var yinBuffer;
var threshold = 0.15;
var pitchInHertz = -1;
var volumeThreshold=0.0009;


//globals for game interface
var canvas1;
var canvas2;
var canvas3;
var ctx1;
var ctx2;
//var ctx3;
var xRocketShip = 0;
//var y = 450;
var xAsteroid=500;                  //pixels from right side of image
var yAsteroid=250;                  //pixels from top side of image
var dx = 1;                         //defines speed. 800/dx must be clear division ()
var dy = 4;
var backgroundWidth = 800;
var backgroundHeight = 450;
var background = new Image();
var rocketship= new Image();
var asteroid= new Image();
var constantCallibration=50;        //constantCallibration is a constant which is used for callibration for the edges of image background
var rocketshipHeight=0;
//globals for score calculation
var numOfTries=1;                   //number of missed tries to drive spaceship in asteroid

//globals for calculateSPL
var power;
var element;
var SPL;

//globals for sending scores to server
var userID=0;
var gameID=1;       //first type of game implementation 1 --> pitch game


//variable to stop setInterval
var refreshIntervalId;
//populate pitchList
//addOptionPitchList();

//populate widthList
//addOptionWidthList();



//globals for drag n drop
var dragging = false; // Keep track of when we are dragging
var draggingisover=false; // Keep track of when dragging ends
var dragoffx=0;
var dragoffy=0;
var valid = false; // when set to true, the canvas will redraw everything
var selectionx;
var selectiony;

//globals for voice callibration
var minPitch=40;
var maxPitch=600;
var pitchInRange=100;

function test(){
        alert("Hello world");
}

function hasGetUserMedia() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

//tests if get userMedia is supported. If it is capture microphone audio data
if (hasGetUserMedia()) {
  // Good to go!
   alert("Feature supported!In order to play the game 1) press ok 2) allow acces to mic 3) speak to mic");
  
  //call init
  
  init();
} else {
  alert('getUserMedia() is not supported in your browser');
}


// for logging
function fire(e) {    
    var log = document.getElementById("log");
    var inner = log.innerHTML;
    log.innerHTML = e + "<br/>"+inner + "<br/>";
  }
  
function clearLog() {
    var log = document.getElementById("log");
    log.innerHTML = '';
};

//for initialization
function init(){
    try {
    
     audioContext = new (window.webkitAudioContext  || window.AudioContext);
      
//     fire('Audio context OK');
      // shim
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
      //fire('navigator.getUserMedia ' + (navigator.getUserMedia ? 'OK' : 'fail'));
      // use
      navigator.getUserMedia(
        {audio:true},
        gotStream, 
        function(e){fire('No live audio input ' + e);}
      );
    } catch (e) {
      alert('No web audio support in this browser');
    }
  }
  
//process of Audio Stream happens here!!!!

function gotStream(stream){

//fire("Got Audio Stream OK");

//build GUI

initGUI();

//console.log("got Stream");
    
// Create an AudioNode from the stream.
var microphone = audioContext.createMediaStreamSource(stream);
analyser = audioContext.createAnalyser();
microphone.connect(analyser);
/*
processor = audioContext.createScriptProcessor(512);
processor.onaudioprocess = volumeAudioProcess;
*/
   
// Create a pcm processing "node" for the filter graph.
var bufferSize = 4096;
var myPCMProcessingNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
myPCMProcessingNode.onaudioprocess = function(e) {
input = e.inputBuffer.getChannelData(0);
output = e.outputBuffer.getChannelData(0);
for (var i = 0; i<bufferSize; i++) {
// Modify the input and send it to the output.

// output[i] = input[i]; //sxoliazontas auti tin entoli ekmidenizoume tin eksodo sta ixeia
}

//calculate SPL of input
calculateSPL(input);

//calculate pitch with autocorrelate
//myautoCorrelate(input,audioContext.sampleRate);
  
yinBuffer = new Array(input.length/2);
//calculate pitch with YIN algorithm
console.log("audioContext.sampleRate: "+audioContext.sampleRate);
my_YIN(input,audioContext.sampleRate); 
//ignore very low signals
/*
if (volume>volumeThreshold){
my_YIN(input,audioContext.sampleRate);
}
*/
}

microphone.connect(myPCMProcessingNode);
myPCMProcessingNode.connect(audioContext.destination);


var errorCallback = function(e) {
  alert("Error in getUserMedia: " + e);
};  

/*
// Get access to the microphone and start pumping data through the  graph.
navigator.getUserMedia({audio: true}, function(stream) {
  // microphone -&gt; myPCMProcessingNode -&gt; destination.
  var microphone = audioContext.createMediaStreamSource(stream);
  microphone.connect(myPCMProcessingNode);
  myPCMProcessingNode.connect(audioContext.destination);
  //microphone.start(0);
}, errorCallback);
*/     
}

function log10(val) {
  return Math.log(val) / Math.LN10;
}

function calculateSPL(buf) {

/*
 * initializations
 */
power=0;
element=0;
SPL=0;

var bufLength=buf.length;
for (var i=0; i<bufLength; i++) {
    	element = buf[i];
    	power += element * element;
 }      
 
 SPL=20*log10(Math.sqrt(power)/bufLength);
 

}
function volumeAudioProcess(event) {
      
      
var buf = event.inputBuffer.getChannelData(0);
var bufLength = buf.length;
var sum = 0;
var x;
var averaging = 0.95;
var volume;
//alert("Triggering  volumeAudioProcess OK");
//fire("Triggering  volumeAudioProcess OK");
// Do a root-mean-square on the samples: sum up the squares...

//fire("bufLength: "+bufLength);
    for (var i=0; i<bufLength; i++) {
    	x = buf[i];
//         console.log("x: "+x);
        /*
    	if (Math.abs(x)>=this.clipLevel) {
    		this.clipping = true;
    		this.lastClip = window.performance.now();
    	}*/
    	sum += x * x;
    }
    console.log("sum: "+sum);
    // ... then take the square root of the sum.
    var rms =  Math.sqrt(sum / bufLength);
    console.log("rms: "+rms);
    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    this.volume = Math.max(rms, this.volume*averaging);
    console.log("volume: "+volume);
}

function myPCMFilterFunction(inputSample) {
  var mixed_value=0;
  var noiseSample = Math.random() * 2 - 1;
  mixed_value=inputSample + noiseSample * 0.1;
//  console.log("mixed_value: "+mixed_value);
  return mixed_value;  // For example, add noise samples to input.
}

function autoCorrelate(pitchBuf,sampleRate) {
	var MIN_SAMPLES = 4;	// corresponds to an 11kHz signal
	var MAX_SAMPLES = 1000; // corresponds to a 44Hz signal
	var SIZE = 1000;
	var best_offset = -1;
	var best_correlation = 0;
	var rms = 0;

        
        //var pitchBuf = new Uint8Array(buf.length);
        analyser.getByteTimeDomainData(pitchBuf);
        
        console.log("pitchBuf.length: "+pitchBuf.length);
//        pitchBuf=buf;
	confidence = 0;
	currentPitch = 0;

	if (pitchBuf.length < (SIZE + MAX_SAMPLES - MIN_SAMPLES))
		return;  // Not enough data

	for (var i=0;i<SIZE;i++) {
		var val = (pitchBuf[i] - 128)/128;
		rms += val*val;
	}
	rms = Math.sqrt(rms/SIZE);

	for (var offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
		var correlation = 0;

		for (var i=0; i<SIZE; i++) {
			correlation += Math.abs(((pitchBuf[i] - 128)/128)-((pitchBuf[i+offset] - 128)/128));
		}
		correlation = 1 - (correlation/SIZE);
		if (correlation > best_correlation) {
			best_correlation = correlation;
			best_offset = offset;
		}
	}
	if ((rms>0.01)&&(best_correlation > 0.01)) {
		confidence = best_correlation * rms * 10000;
		currentPitch = sampleRate/best_offset;
		// console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
	}
        console.log("currentPitch: "+currentPitch);
//	var best_frequency = sampleRate/best_offset;
}

function myautoCorrelate(pitchBuf,sampleRate) {
	var MIN_SAMPLES = 4;	// corresponds to an 11kHz signal
	var MAX_SAMPLES = 1000; // corresponds to a 44Hz signal
	var SIZE = 1000;
	var best_offset = -1;
	var best_correlation = 0;
	var rms = 0;

        
        //var pitchBuf = new Uint8Array(buf.length);
//        analyser.getByteTimeDomainData(pitchBuf);
        
        console.log("pitchBuf.length: "+pitchBuf.length);
//        pitchBuf=buf;
	confidence = 0;
	currentPitch = 0;

	if (pitchBuf.length < (SIZE + MAX_SAMPLES - MIN_SAMPLES))
		return;  // Not enough data

	for (var i=0;i<SIZE;i++) {
		var val = pitchBuf[i];
		rms += val*val;
	}
	rms = Math.sqrt(rms/SIZE);

	for (var offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
		var correlation = 0;

		for (var i=0; i<SIZE; i++) {
			correlation += Math.abs((pitchBuf[i])-(pitchBuf[i+offset]));
		}
		correlation = 1 - (correlation/SIZE);
		if (correlation > best_correlation) {
			best_correlation = correlation;
			best_offset = offset;
		}
	}
	if ((rms>0.01)&&(best_correlation > 0.01)) {
		confidence = best_correlation * rms * 10000;
		currentPitch = sampleRate/best_offset;
		// console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
	}
        console.log("currentPitch: "+currentPitch);
//	var best_frequency = sampleRate/best_offset;
}

function my_YIN(pitchBuf,sampleRate){

var tauEstimate = -1;


//console.log("buf.length: "+buf.length);
//step 2
difference(pitchBuf);

//step 3
cumulativeMeanNormalizedDifference();

//step 4

tauEstimate =absoluteThreshold();

//step 5

if(tauEstimate!=-1){
	//step 6
	var localTau = bestlocal(tauEstimate);
	
	//step 5
    //var betterTau = parabolicInterpolation(tauEstimate);
	var betterTau = parabolicInterpolation(localTau);


    //conversion to Hz
    pitchInHertz = sampleRate/betterTau;
//    console.log("pitchInHertz: "+pitchInHertz);
//    fire("pitchInHertz: "+pitchInHertz)
}
//write current pitch to pitch_level in jsp page
//document.getElementById("pitch_level").innerHTML=pitchInHertz;
 
if((pitchInHertz>40)&&(pitchInHertz<600))
{
//write current pitch to pitch_level in jsp page
document.getElementById("pitch_level").innerHTML=pitchInRange.toFixed(2);
pitchInRange=pitchInHertz;
    }
//else pitchInHertz = minPitch;
}

/**
* Implements the difference function as described
 * in step 2 of the YIN paper
*/
function difference(difBuf){
var j,tau;
var delta;

//population of yinBuffer with zero values
for(tau=0;tau < yinBuffer.length;tau++){
	yinBuffer[tau] = 0;
}

//save differences from difBuf in yinBuffer
for(tau = 1 ; tau < yinBuffer.length ; tau++)
    {
	for(j = 0 ; j < yinBuffer.length ; j++)
        {
		delta = difBuf[j] - difBuf[j+tau];
        	yinBuffer[tau] += delta * delta;
                             
	}
    }
                

}

function cumulativeMeanNormalizedDifference(){
var tau;
yinBuffer[0] = 1;
//Very small optimization in comparison with AUBIO
//start the running sum with the correct value:
//the first value of the yinBuffer
var runningSum = yinBuffer[1];
//yinBuffer[1] is always 1
yinBuffer[1] = 1;
//now start at tau = 2
for(tau = 2 ; tau < yinBuffer.length ; tau++){
	runningSum += yinBuffer[tau];
	yinBuffer[tau] *= tau / runningSum;
    }
}

/*** Implements step 4 of the YIN paper
 */
function absoluteThreshold(){

/**/
var temp;
var sortedyinBuffer;
var buffwithminimums=[0];
var countmin=0;

//returns the minimum period value which is smaller than threshold
/*
for (var i=0;i<yinBuffer.length;i++){
	
	if (yinBuffer[i]<threshold){
		//first populate an array with all values smaller than threshold
		buffwithminimums[countmin]=yinBuffer[i];
		countmin++;
	}
}

//then sort array and get the first element which is the minimum of all values smaller than threshold
sortedyinBuffer=buffwithminimums.sort();
temp=sortedyinBuffer[0];

//find the position of that element in yinbuffer and return it as period
for (var i=0;i<yinBuffer.length;i++){
	
	if (yinBuffer[i]==temp){
		return i;
	}
}

//no pitch found
if(buffwithminimums.length=1)
return -1;

*/
/* Search inside the yinBuffer to find in which position exists minimum of threshold and return it*/
for(var tau = 1;tau<yinBuffer.length;tau++){
    if(yinBuffer[tau] < threshold){
	while(tau+1 < yinBuffer.length &&yinBuffer[tau+1] < yinBuffer[tau]) 
		tau++;
		return tau;
	}
}
//no pitch found

return -1;/**/
}

/**
* Implements step 5 of the YIN paper. It refines the estimated tau value
* using parabolic interpolation. This is needed to detect higher
* frequencies more precisely.
* @param tauEstimate the estimated tau value.
* @return a better, more precise tau value.
*/

function parabolicInterpolation(tauEstimate) {
var s0, s1, s2,newtauEstimate;
var ar,par;

/*boundary handling*/
var x0 = (tauEstimate < 1) ? tauEstimate : tauEstimate - 1; //handles the first position of array

var x2 = (tauEstimate + 1 < yinBuffer.length) ? tauEstimate + 1 : tauEstimate; //handles the last position of the array. Checks if exceeds array boundaries

if (x0 == tauEstimate) //applys when tauestimate is the first element of array
	return (yinBuffer[tauEstimate] <= yinBuffer[x2]) ? tauEstimate : x2; //compares only two points and is returning the smaller one

if (x2 == tauEstimate) //applys when tauestimate is the last element of array
    return (yinBuffer[tauEstimate] <= yinBuffer[x0]) ? tauEstimate : x0; //compares only two points and is returning the smaller one

/*in all other cases 3 points are interpolated. x0 is taustimate-1 position in array and x2 is tauestimate+1 position in array. So
they are the immediate neighbors to tauestimate. We are using parabola curve and we are searching for minimum on that curve.
Formulae is f(x)=a2x^2+a1x+a0. 
For more information see http://sfb649.wiwi.hu-berlin.de/fedc_homepage/xplore/tutorials/xegbohtmlnode62.html 
*/
s0 = yinBuffer[x0];
s1 = yinBuffer[tauEstimate];
s2 = yinBuffer[x2];

//newtauEstimate=0.5*(Math.pow(tauEstimate, 2)*s2 - s1*Math.pow(x2,2)-Math.pow(x0,2)*s2+Math.pow(x2, 2)*s0 +Math.pow(x0, 2)*s1 - s0*Math.pow(tauEstimate, 2))/(x2*s1 - tauEstimate*s2);
ar= Math.pow((tauEstimate-x0),2)*(s1-s2)-Math.pow((tauEstimate-x2),2)*(s1-s0);
par= (tauEstimate-x0)*(s1-s2)-(tauEstimate-x2)*(s1-s0);

newtauEstimate=tauEstimate-0.5*ar/par;
return newtauEstimate;
//console.log("newtauEstimate: "+newtauEstimate+"tauEstimate: "+tauEstimate);
//return (tauEstimate + 0.5 * (s2 - s0 ) / (2.0 * s1 - s2 - s0));
//return (0.5*(Math.pow(tauEstimate, 2)*s2 - s1*Math.pow(x2,2)-Math.pow(x0,2)*s2+Math.pow(x2, 2)*s0 +Math.pow(x0, 2)*s1 - s0*Math.pow(tauEstimate, 2))/(x2*s1 - tauEstimate*s2));

}        

/**
* Implements step 6 of the YIN paper. It refines the best local estimate for tau value
* This is needed to avoid flunctuation
* @param tauEstimate the estimated tau value.
* @return a better, more precise tau value.
*/

function bestlocal(tauEstimate){
var bestlocalestimate=tauEstimate;
var lowlimit=i-tauEstimate/2;
var highlimit=i+tauEstimate/2;

for (var i=0;i<yinBuffer.length;i++){
	
if(lowlimit.toFixed(0)>0){
	//search in vicinity for new minimum
	for(var j=lowlimit.toFixed(0);j<=highlimit.toFixed(0);j++)

		if(yinBuffer[j]<tauEstimate)
			{
			bestlocalestimate=j;
			//alert("Hello from 6 step");
			return bestlocalestimate;
			}
			
}
}

//no pitch found
	
return bestlocalestimate;
}
//functions for game interface

function initGUI() {
background.src ="http://147.52.17.225:8080/HibernateRestEasyPermissionsecurityWithTags/images/stargame/space_from_hubble_telescope_800x450.gif";
rocketship.src="http://147.52.17.225:8080/HibernateRestEasyPermissionsecurityWithTags/images/stargame/rocketship.gif";
asteroid.src="http://147.52.17.225:8080/HibernateRestEasyPermissionsecurityWithTags/images/stargame/asteroids/gif/asteroidicon2.gif";

canvas1 = document.getElementById("layer1");
ctx1 = canvas1.getContext("2d");
canvas2 = document.getElementById("layer2");
ctx2 = canvas2.getContext("2d");
canvas3 = document.getElementById("layer3");
ctx3 = canvas3.getContext("2d");
//set up mouse handlers for canvas3 which contains 
//asteroid image. We want asteroid to be draggable
//with mouse events
setupDragnDrop();
refreshIntervalId = setInterval(drawAll, 20);
}

function setupDragnDrop(){
    
      //fixes a problem where double clicking causes text to get selected on the canvas
      canvas3.addEventListener("selectstart", function(e) { e.preventDefault(); 
      //      console.log("selectstart");
      return false; }, false);
   
      // Up, down, and move are for dragging
      canvas3.addEventListener("mousedown", function(e) { 
      
      var widthAsteroid = xAsteroid;
      var heightAsteroid = yAsteroid;
      var offsetX = 100;
      var offsetY = 100;
      
      
      var mousePos = getMousePos(canvas3, e);
      //      console.log('Mouse position: ' + (mousePos.x) + ',' + mousePos.y+", xAsteroid: "+(xAsteroid)+" yAsteroid: "+(yAsteroid));
      //      console.log("heightAsteroid: "+heightAsteroid);
      
      //detect clicks inside asteroid
      if((mousePos.x>widthAsteroid)&&(mousePos.x<widthAsteroid+offsetX)
            &&(mousePos.y>(heightAsteroid))&&(mousePos.y<(heightAsteroid+offsetY)))
      
      {
          
        console.log("You clicked inside asteroid");
        //start of drag and drop operation
        dragging=true;  
        dragoffx = mousePos.x;  //save mouse position
        dragoffy = mousePos.y;
      }
      return false; }, false);
  
  /*
  The mousemove event checks to see if we have set the dragging flag to true. 
  If we have it gets the current mouse positon and moves the selected object 
  to that position, remembering the offset of where we were grabbing it. If 
  the dragging flag is false the mousemove event does nothing.*/
  canvas3.addEventListener("mousemove", function(e) {
  var curX;
  var curY;
  console.log("mousemove");
  if (dragging){
  var mouse = getMousePos(canvas3, e);
  // We don't want to drag the object by its top-left corner,
  // we want to drag from where we clicked.
  // Thats why we saved the offset and use it here
  selectionx = mouse.x;
  selectiony = mouse.y; 
  curX = document.getElementById("posX");
  curY = document.getElementById("posY");
  curX.innerHTML = selectionx;
  curY.innerHTML = selectiony;
  valid = false; // Something's dragging so we must redraw
  redraw3(selectionx,selectiony);
  draggingisover=true;
  }
      return false; }, false);
  
  /*
  The mouseup event checks to see if we have set the draggingisover flag to true. 
  If we have it redraws the asteroid in new position. Otherwise it happened a single click
  on space and nothing happens. After that flag is reseting*/
 canvas3.addEventListener('mouseup', function(e) {
 if(draggingisover==true){
 console.log("mouseup");
 dragging = false;
 
 redraw3(selectionx,selectiony);
 } 
 draggingisover=false;
  }, true);
  /*canvas3.addEventListener("mouseup", function(e) { 
      console.log("mouseup");
      return false; }, false);
  canvas3.addEventListener("dblclick", function(e) { 
      console.log("dblclick");
      return false; }, false);  */
 
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }

function redraw3(drawx,drawy) {
xAsteroid=drawx;
yAsteroid=drawy;
ctx3.clearRect(0, 0, backgroundWidth, backgroundHeight);
ctx3.drawImage(asteroid,drawx,drawy);   
}

//draws background, starship, asteroid every 20ms
function drawAll() {

draw1();
draw2();
draw3();
}

//draws background every 20ms
function draw1() {

ctx1.clearRect(0, 0, backgroundWidth, backgroundHeight);
ctx1.drawImage(background, 0, 0);

}

//draws starship every 20ms
function draw2() {

ctx2.clearRect(0, 0, backgroundWidth, backgroundHeight);     

/* SPL range is between 100Hz (silence) and 400Hz (maximum value). We want to convert
 * to the range of background dimensions range 0-450 pixels
 * 
 * OldRange = (OldMax - OldMin)
 * NewRange = (NewMax - NewMin)
 * NewValue = (((OldValue - OldMin) * NewRange) / OldRange) + NewMin
 */
console.log("minPitch: "+(minPitch)+ "maxPitch:"+maxPitch);
var OldPitchRange = (maxPitch -(minPitch)); 
var NewPitchRange = (backgroundHeight - 0);  
var NewPitchValue = (((pitchInRange - (minPitch)) * NewPitchRange) / OldPitchRange) + 2;
console.log("NewPitchValue: "+NewPitchValue+" pitchInRange: "+pitchInRange);

var maxSPL=1400;
var scaledSPL =(maxSPL-Math.abs(SPL)*10)/2;
var offsetYY = 40;
var offsetXX = 12;

//rocketshipHeight = backgroundHeight-Math.round(NewPitchValue); 

/*
 * If new pitch belongs to acceptable range of values then spaceship is drawn to new height. Cut off undesired peaks of YIN 
 * algorithm
 */
/**/
if (NewPitchValue<5) 
	{
	NewPitchValue=offsetYY;
	console.log("NewPitchValue:"+NewPitchValue);
	rocketshipHeight=backgroundHeight-Math.round(NewPitchValue); //zwgrafise sti basi tis eikonas
}
else if(NewPitchValue>backgroundHeight) {
	
	NewPitchRange=backgroundHeight;
	console.log("NewPitchValue:"+NewPitchValue);
	rocketshipHeight=offsetYY/2; //zwgrafise psila stin eikona
	console.log("rocketshipHeight:"+rocketshipHeight);
}
else{
	console.log("new pitch in range");
//else if ((NewPitchValue>5)&&(NewPitchRange<450)){
	rocketshipHeight = backgroundHeight-Math.round(NewPitchValue); 
}
/*
 
if ((NewPitchValue>offsetYY)&&(NewPitchValue<(backgroundHeight-offsetYY))){
 rocketshipHeight = backgroundHeight-Math.round(NewPitchValue);   
}*/
/*
//console.log("scaledSPL: "+SPL);
else if(NewPitchValue<5){ //ignore very low signals
rocketshipHeight = backgroundHeight-offsetYY;
}

else if(NewPitchValue>(backgroundHeight-offsetYY)) 
{
//     ctx2.drawImage(rocketship, xRocketShip, 5);   
//rocketshipHeight=5;
}
*/
//ctx2.drawImage(rocketship, xRocketShip, rocketshipHeight);
ctx2.drawImage(rocketship, xRocketShip, rocketshipHeight);
xRocketShip += dx;

//console.log("pitchInHertz: "+pitchInHertz);
if (xRocketShip + dx > backgroundWidth || xRocketShip + dx < 0){
 //dx = -dx;   
  xRocketShip=0;  
//  rocketshipHeight = backgroundHeight -offsetYY;
//  ctx2.drawImage(rocketship, xRocketShip, rocketshipHeight);
  numOfTries++; //increase missed tries by 1
}

//if (((xRocketShip + dx) == (1000-xAsteroid))&&(((450-Math.round(pitchInHertz))<(450-Math.round(yAsteroid)-offset))||((450-Math.round(pitchInHertz))>(450-Math.round(yAsteroid)+offset))||((450-Math.round(pitchInHertz))==(450-Math.round(yAsteroid)))))
//if (((xRocketShip + dx) >= (xAsteroid))&&((xRocketShip + dx)<=(xAsteroid+Math.round(2*offsetXX/3)))){
//    alert("Hey width is reached!!!")
//}
if (((xRocketShip + dx) >= (xAsteroid))&&((xRocketShip + dx)<=(xAsteroid+Math.round(2*offsetXX/3)))
        &&(rocketshipHeight<yAsteroid+3*Math.round(offsetYY))&&(rocketshipHeight>yAsteroid-Math.round(offsetYY)))
{
 //dx = -dx;   


 //Step1: calculate scores
 var ba8mos =calculateScore(numOfTries);
 alert("Reached asteroid!!Your score is:"+ba8mos+"%."); 
// console.log("ba8mos: "+ba8mos);
 
//Step2: send scores to the server and display graph
sendScores(Math.round(ba8mos));
 
//Step3: display results in graph
//call function from jscharts
//testjscharts();
//displayGraph();

//Step4: finally reset number of tries for next game. Also reset start position of rcketship
 xRocketShip=0;
 numOfTries=1; 
}

}

//draws asteroid every 20ms
function draw3() {

ctx3.clearRect(0, 0, backgroundWidth, backgroundHeight);
ctx3.drawImage(asteroid,xAsteroid, yAsteroid);   
}

/*
 * Auti i me8odos efarmozei tin formoula ipologismo twn scores
 * o opoios einai o ari8mos twn prospa8eiwn na petixei o xristis
 * ton komiti antestrammenos (otan iparxei mono enas kommitis sto 
 * diastima)
 * score= 100/a, opou a : o ari8mos twn prospa8eiwn
 * enallaktika an iparxoun parapanw kommites 8a mporouse na xrisimopoii8ei
 * o parakatw tipos
 * score= b/(n*a), opou b : o ari8mos twn kommitwn pou petixe kapoios
 * 						a : o ari8mos twn prospa8eiwn
 * 						n : o ari8mos twn kommitwn tou diastimatos
 * 
 * To score ipologizetai san dekadikos ari8mos kai epistrefetai se % pososto epitixias kai  
 * apo8ikeuetai stin basi dedomenwn
 * 
 * Klisi sinartisis
 * 
 * arguments: type --> ka8orizei ton typo tou paixnidiou 
 * (1: 1 kommitis ston xarti, 2:ar kommitvn>1)
 * 
 */

function calculateScore(tries) {
var score=0;
	
score = 100/tries;

return score;	
} //end of calculate_score

//load and populate pitch list

function addOption(selectbox,text,value ){
	var optn = document.createElement("OPTION");
	optn.text = text;
	optn.value = value;
	selectbox.options.add(optn);
}

function addOptionPitchList(){
var rangePitch=backgroundHeight;
var pitchList = new Array(rangePitch);
var i=0;

//initialization
for (i=0; i < pitchList.length;++i){
    
//pitchList[i]=i+constantCallibration; //constantCallibration is a constant which is used for callibration for the edges of image background
pitchList[i]=i+constantCallibration;
} 
    
for (i=0; i < pitchList.length;i++){

addOption(document.getElementById("pitchList"), i, pitchList[i]);
}
}

function getSelectedPitch(){

//get selected value from pitchList (yAsteroid)
//and then disable pitchList. User can select only once for pitch
var pitchListElement = document.getElementById("pitchList");
yAsteroid=pitchListElement.options[pitchListElement.selectedIndex].value;
pitchListElement.disabled=true;
}

//load and populate width list
function addOptionWidthList(){
var rangeWidth=800;
var widthList = new Array(rangeWidth/dx);
var i=0;

//initialization
for (i=0; i < widthList.length;++i){
//    widthList[i]=i+constantCallibration; //constantCallibration is a constant which is used for callibration for the edges of image background
      widthList[i]=i*dx+constantCallibration;
} 
    
for (i=0; i < Math.round(2*widthList.length/3);i++){

addOption(document.getElementById("widthList"),i, widthList[i]);
}
}

function getSelectedWidth(){

//get selected value from pitchList (yAsteroid)
//and then disable pitchList. User can select only once for pitch
var widthListElement = document.getElementById("widthList");
xAsteroid=widthListElement.options[widthListElement.selectedIndex].value;
widthListElement.disabled=true;
}

function printUserID() {
var x = document.getElementById("userID").value;
//document.getElementById("").innerHTML = x;
console.log("userID: "+x);
}

function sendScores(ba8mos){
 userID = document.getElementById("userID").value;   
 
 //send data to server. Data includes ba8mos,userID,gameID
 loadHTTPData(ba8mos,userID,gameID)
 
 
 
}

function loadHTTPData(ba8mos,userID,gameID) {

var listLength=0;
var txt="";
var newText="";
var dates=[];
var unique_dates=[];
var graph_data=[["",""],["",""]];
var sum=0;
var count=0;

//alert("Sending data to server: "+ba8mos+" "+userID+" "+gameID);
if (window.XMLHttpRequest)
  {// code for IE7+, Firefox, Chrome, Opera, Safari
  xmlhttp=new XMLHttpRequest();
  }
else
  {// code for IE6, IE5
  xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
xmlhttp.open("GET","http://147.52.17.225:8080/HibernateRestEasyPermissionsecurityWithTags/rest/RESTEasyHelloWorld/text_to_xml/".concat(ba8mos).concat("/").concat(userID).concat("/").concat(gameID),false);
xmlhttp.send();
xmlDoc=xmlhttp.responseXML;
/*
document.getElementById("to").innerHTML=
xmlDoc.getElementsByTagName("to")[0].childNodes[0].nodeValue;
document.getElementById("from").innerHTML=
xmlDoc.getElementsByTagName("from")[0].childNodes[0].nodeValue;
document.getElementById("message").innerHTML=
xmlDoc.getElementsByTagName("body")[0].childNodes[0].nodeValue;*/
console.log(xmlDoc);

 //preprocess data

listLength=xmlDoc.getElementsByTagName("scores").length;

//alert("listLength: "+listLength);
for (var i=0;i<listLength;i++)
{
//newText=" "+newText+xmlDoc.getElementsByTagName("timestamp")[i].childNodes[0].nodeValue;

dates[i]=xmlDoc.getElementsByTagName("timestamp")[i].childNodes[0].nodeValue;
//unique_dates
/*
newText=" "+newText+xmlDoc.getElementsByTagName("GameId")[i].childNodes[0].nodeValue+"<br> ";
//newText=" "+newText+xmlDoc.getElementsByTagName("LevelId")[i].childNodes[0].nodeValue+"<br> ";
newText=" "+newText+xmlDoc.getElementsByTagName("ScoreValue")[i].childNodes[0].nodeValue+"<br> ";
newText=" "+newText+xmlDoc.getElementsByTagName("timestamp")[i].childNodes[0].nodeValue+"<br> ";
newText=" "+newText+xmlDoc.getElementsByTagName("tries")[i].childNodes[0].nodeValue+"<br> ";
newText=" "+newText+xmlDoc.getElementsByTagName("userId")[i].childNodes[0].nodeValue+"<br> ";
*/
}
//find unique dates
for (var j=0;j<=dates.length-1;j++){
//check elements
if (dates[j]!=dates[j+1]){
unique_dates[unique_dates.length]=dates[j];
	}
}

for (var j=0;j<unique_dates.length;j++){

for (var k=0;k<dates.length;k++){
//check elements
/**/if (unique_dates[j]==dates[k]){
    sum=sum+parseInt(xmlDoc.getElementsByTagName("scoreValue")[k].childNodes[0].nodeValue);
    count++;
}

}

graph_data[j]=[unique_dates[j],sum/count];
/*if(unique_dates.length==1){
	graph_data[j+1]=[unique_dates[j],sum/count];	
	
} */// stin prwti mera ektelesis to paixnidi apla ipoologizei ton meso oro kai 8etei prwti kai teleutaia imnia tin prwti mera ektelesis
//reset
sum=0;
count=0;
}

// document.getElementById("log2").innerHTML=graph_data;

 //ask user if he wants to play again or to display graph in web page 
   /**/
   var retVal1 = confirm("Do you want to play again or study graph results?Press OK for playing again or cancel otherwise");
      if( retVal1==true){
         
         play_again();             //show confirmation dialog box for playing again
         return true;
      }
      else{
      //console.log("graph_data.length: "+graph_data.length);
      //for(var c=0;c<graph_data.length;c++)
 		 //console.log("graph_data["+c+"]: "+graph_data.length[c]);
      if(unique_dates.length==1){
    	  alert("First day of playing.Your performance graph will be displayed after second day of playing. Your current performance is: "+graph_data[0][1]);
      }
      else{
   	  displayGraph(graph_data); //user wants to display graph results
      }
      return false;
      }


   }
    
   function play_again(){
   	window.location = "http://147.52.17.225:8080/HibernateRestEasyPermissionsecurityWithTags/user/pitch.jsp";//user wants to play again. Redirection  
   }

 
function displayGraph(graph_data){

var myChart = new JSChart('graph', 'line');
	myChart.setDataArray(graph_data);
	myChart.setTitle('Performance of student');
	myChart.setTitleColor('#8E8E8E');
	myChart.setTitleFontSize(11);
	myChart.setAxisNameX("dates");
	myChart.setAxisNameY("scores");
	myChart.setAxisColor('#C4C4C4');
	myChart.setAxisValuesColor('#343434');
	myChart.setAxisPaddingLeft(100);
	myChart.setAxisPaddingRight(120);
	myChart.setAxisPaddingTop(50);
        myChart.setAxisValuesAngle(90); //rotation
	myChart.setAxisPaddingBottom(85);
	myChart.setAxisValuesNumberX(6);
	myChart.setGraphExtend(true);
	myChart.setGridColor('#c2c2c2');
	myChart.setLineWidth(6);
	myChart.setLineColor('#9F0505');
	myChart.setSize(800, 400);
	myChart.setBackgroundImage("jscharts/chart_bg.jpg");
	myChart.draw();
        
        //stop animation
        clearInterval(refreshIntervalId);
 }
 
function voiceCalibration(){
maxPitch=Number(document.getElementById("maxPitch").value);
minPitch=Number(document.getElementById("minPitch").value);
alert("minPitch :"+minPitch+" maxPitch :"+maxPitch);
}