var polyBuffer;
var persistence;
var stateManager;

// to shut vs code up
postMessage = post;
ofunc = outlet;

// TODO: output console / error 
function loadfile(fname){
  var preCount = polyBuffer.count;
  polyBuffer.append(fname);
  if (preCount + 1 == polyBuffer.count){
    persistence.addBuffer(fname);
    stateManager.jumpToEnd();
  } else {
    outputError('did not load buffer '+fname);
  }
}

function outputError(msg){
  outlet(0, ['error', msg]);
}

function requestremove(){
  outlet(0, ['removedialog'])
}

function remove(){
  var bufNum = persistence.getBufNum(stateManager.current_buffer);

  var bufName = persistence.getBufName(stateManager.current_buffer);
  var buffer = new Buffer(bufName);
  buffer.send('sizeinsamps', 0);

  persistence.removeBuffer(stateManager.current_buffer);
  stateManager.removeCurrent();
}

function increment(){
  if (stateManager.uiActive){ stateManager.increment(); }
}

function decrement(){
  if (stateManager.uiActive){ stateManager.decrement(); }
}

function loadbang(){
  var prefix = jsarguments[1];
  persistence = new Persistence(prefix);
  polyBuffer = new PolyBuffer('pb'+prefix);

  persistence.initPolyBuffer(polyBuffer);
  stateManager = new UIStateManager();
}


function outputalldata(){
  persistence.outputAllData();
}

function UIStateManager(){
  this.current_buffer = 0;
  this.update();
  this.uiActive = true;
}

UIStateManager.prototype.update = function(){
  this.uiActive = false;
  var numBuffers = persistence.numBuffers();
  if (!numBuffers){
    this.setButton('remove', 0);
    this.setButton('next', 0);
    this.setButton('prev', 0);

    this.displayWaveInfo(false);
  } else {
    this.setButton('remove',1);
    this.setButton('prev', this.current_buffer > 0);
    this.setButton('next', this.current_buffer < numBuffers - 1);

    this.displayWaveInfo(this.current_buffer);
  }
  this.uiActive = true;
}

UIStateManager.prototype.displayWaveInfo = function(bufNum){
  this.displayWave(bufNum);
  this.displayFilename(bufNum);
  this.displayTablenum(bufNum);
}

UIStateManager.prototype.displayWave = function(bufNum){
  var args = ['wavedisplay', 'wave', 'set'];
  if (bufNum !== false){ 
    args.push(persistence.getBufName(bufNum));
  }
  outlet(0, args);
}

UIStateManager.prototype.displayFilename = function(bufNum){
  var args = ['wavedisplay', 'filename', 'set'];
  if (bufNum !== false){ 
    var path = persistence.getFilename(bufNum);
    var splitFilename = path.split('/');
    var filename = splitFilename[splitFilename.length - 1];
    args.push(filename || path); 
  }
  outlet(0, args);;
}

UIStateManager.prototype.displayTablenum = function(bufNum){
  var args = ['wavedisplay', 'tablenum', 'set'];
  if (bufNum !== false){ 
    args.push(persistence.getTablenum(bufNum));
  }
  outlet(0, args);
}

UIStateManager.prototype.setButton = function(name, value){
  outlet(0, ['buttons', name, 'active', value+0]);
}

UIStateManager.prototype.increment = function(){
  if (this.current_buffer < persistence.numBuffers() - 1){
    this.current_buffer++;
    this.update();
  }
}
UIStateManager.prototype.decrement = function(){
  if (this.current_buffer > 0){
    this.current_buffer--;
    this.update();
  }
}

UIStateManager.prototype.jumpToEnd = function(){
  this.current_buffer = persistence.numBuffers() - 1;
  this.update();
}

UIStateManager.prototype.removeCurrent = function(){
  if (this.current_buffer > 0){ this.current_buffer--; }
  this.update();
}

function Persistence(prefix){
  this.dict = new Dict('persist'+prefix)
  this.stor_object = JSON.parse(this.dict.stringify());

  if (!Object.keys(this.stor_object).length){
    this.stor_object = {
      buffers: []
    };
  } else if (!this.stor_object.buffers){
    this.stor_object.buffers = [];
  } 
  this.storeAsDict();
  this.initTableNumber();  
}

Persistence.prototype.initTableNumber = function(){
  var nextTableNum = 1;
  for (var i = 0; i < this.stor_object.buffers.length; i++){
    var tablenum = this.stor_object.buffers[i].tablenum;
    if (tablenum >= nextTableNum){
      nextTableNum = tablenum + 1;
    }
  }
  this.tablenum = nextTableNum;
}

Persistence.prototype.attachSampleInfo = function(bufNum, arr){
  // sample and channel count determined from buffer
  var buf;
  var found = false
  for (var i = 0; i < this.numBuffers(); i++){
    buf = arr[i];
    if (buf.bufNum == bufNum){
      found = true;
      var buffer = new Buffer(buf.bufName);
      buf.nSamples = buffer.framecount();
      buf.nChannels = buffer.channelcount();
      break;
    }
  }
  if (!found){ return; }

  var bufferInfo = polyBuffer.dump();
  var nItems = bufferInfo.length / 6;
  for (var i = 0; i  < nItems; i++){
    var ind = i * 6;
    var pBufName = bufferInfo[ind+1];
    if (pBufName == buf.bufName){
      buf.samplerate = bufferInfo[ind+5];
    }
  }  
}

Persistence.prototype.nextTableNum = function(){
  return this.tablenum++;
}

Persistence.prototype.getBufNum = function(ind){
  return this.stor_object.buffers[ind].bufNum;
}

Persistence.prototype.getBufName = function(ind){
  return this.stor_object.buffers[ind].bufName;
}

Persistence.prototype.getFilename = function(ind){
  return this.stor_object.buffers[ind].fname;
}

Persistence.prototype.getTablenum = function(ind){
  return this.stor_object.buffers[ind].tablenum;
}

Persistence.prototype.numBuffers = function(){
  return this.stor_object.buffers.length;
}

Persistence.prototype.addBuffer = function(fname){ 
  var bufNum = polyBuffer.count;
  var bufName  = polyBuffer.name + '.' + bufNum;
  this.stor_object.buffers.push({
    fname: fname,
    bufNum: bufNum, 
    bufName: bufName,
    tablenum: this.nextTableNum()
  });
  this.attachSampleInfo(bufNum, this.stor_object.buffers);
  this.storeAsDict();
  this.outputDataAt(bufNum);
}

Persistence.prototype.storeAsDict = function(){
  this.dict.parse(JSON.stringify(this.stor_object));
}

Persistence.prototype.removeBuffer = function(bufNum){ 
  this.stor_object.buffers.splice(bufNum, 1); 
  this.storeAsDict();
}

Persistence.prototype.initPolyBuffer = function(polyBuffer){ 
  var newBuffers = [];
  for (var i = 0; i < this.stor_object.buffers.length; i ++){
    var preCount = polyBuffer.count;
    polyBuffer.append(this.stor_object.buffers[i].fname);

    if (preCount + 1 == polyBuffer.count){
      var bufNum = polyBuffer.count;
      var bufName = polyBuffer.name + '.' + bufNum;

      newBuffers.push({
        bufNum: bufNum,
        bufName: bufName,
        fname: this.stor_object.buffers[i].fname,
        tablenum: this.stor_object.buffers[i].tablenum
      });
      this.attachSampleInfo(bufNum, newBuffers);
    } else {
      error('Cannot load file: ' + this.stor_object.buffers[i].fname);
    }
  }

  this.stor_object.buffers = newBuffers;
  this.storeAsDict();
  this.outputAllData();
}

Persistence.prototype.outputAllData = function(bufNum){
  for (var i = 0; i < this.stor_object.buffers.length; i++){
    this.performOutput(this.stor_object.buffers[i]);
  }
}

Persistence.prototype.outputDataAt = function(bufNum){
  for (var i = 0; i < this.stor_object.buffers.length; i++){
    var buf = this.stor_object.buffers[i];
    if (buf.bufNum == bufNum){
      this.performOutput(buf);
      return;
    }
  }
}

Persistence.prototype.performOutput = function(buffer){
  outlet(0, [
    'data',
    buffer.tablenum, 
    buffer.bufName, 
    buffer.samplerate,
    buffer.nSamples,
    buffer.nChannels
  ]);
}
