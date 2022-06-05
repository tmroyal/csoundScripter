var stateManager;
var persistence;


function loadfile(fname){ 
  persistence.storeFName(fname);
  stateManager.jumpToEnd();
}

function remove(){
  persistence.removeFile(stateManager.currentFile);;
  stateManager.removeCurrent();
}

function outputError(msg){
  outlet(0, ['error', msg]);
}

function requestremove(){
  outlet(0, ['removedialog'])
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
  stateManager = new UIStateManager();

  persistence.outputAllData();
}

function outputalldata(){
  persistence.outputAllData();
}
function setchanname(channame){
  persistence.storeChannelName(stateManager.currentFile, channame);
}

function UIStateManager(){
  this.currentFile = 0;
  this.uiActive = true;
  this.update();
}

UIStateManager.prototype.update = function(){
  this.uiActive = false;
  var numFiles = persistence.numFiles();
  if (!numFiles){
    this.setButton('remove', 0);
    this.setButton('next', 0);
    this.setButton('prev', 0);
    
    this.setFileDisplay(false);
  } else {
    this.setButton('remove',1);
    this.setButton('prev', this.currentFile > 0);
    this.setButton('next', this.currentFile < numFiles - 1);
  
    this.setFileDisplay(this.currentFile);
  }
  this.uiActive = true;
}

UIStateManager.prototype.setFileDisplay = function(fnum){
  if (fnum === false){
    outlet(0, ['filedisplay', 'filedisp', 'set']);
    outlet(0, ['filedisplay', 'vardisp', 'set']);
  } else {
    var fdata = persistence.getFileData(fnum);
    outlet(0, ['filedisplay', 'filedisp', 'set', this.extractFilename(fdata.filename)]);
    outlet(0, ['filedisplay', 'vardisp', 'set', fdata.channelName]);
  }

}

UIStateManager.prototype.extractFilename = function(fullpath){
  var separator = fullpath[0] == '/' ? '/' : '\\';
  var components = fullpath.split(separator);
  return components[components.length - 1];

}

UIStateManager.prototype.setButton = function(name, value){
  outlet(0, ['buttons', name, 'active', value+0]);
}

UIStateManager.prototype.increment = function(){
  if (this.currentFile < persistence.numFiles() - 1){
    this.currentFile++;
    this.update();
  }
}
UIStateManager.prototype.decrement = function(){
  if (this.currentFile > 0){
    this.currentFile--;
    this.update();
  }
}

UIStateManager.prototype.jumpToEnd = function(){
  this.currentFile = persistence.numFiles() - 1;
  this.update();
}

UIStateManager.prototype.removeCurrent = function(){
  if (this.currentFile > 0){ this.currentFile--; }
  this.update();
}

function Persistence(prefix){
  this.dict = new Dict('filenamestore'+prefix);
  this.stor_object = JSON.parse(this.dict.stringify());

  if (!Object.keys(this.stor_object).length){
    this.stor_object = {
      filenames: []
    };
  } else if (!this.stor_object.filenames){
    this.stor_object.filenames = [];
  }       
  this.storeAsDict();
}

Persistence.prototype.getFileData = function(ind){
  return this.stor_object.filenames[ind];
}

Persistence.prototype.storeAsDict = function(){
  this.dict.parse(JSON.stringify(this.stor_object));
}

Persistence.prototype.storeFName = function(fname){
  var chanName = 'S'+(Math.random() + 1).toString(36).substring(2);
  var fileinfo = {
    filename: this.stripMac(fname), 
    channelName: chanName
  };

  this.stor_object.filenames.push(fileinfo);
  this.storeAsDict();

  this.performOutput(fileinfo);
}

Persistence.prototype.storeChannelName = function(ind, channelName){
  this.stor_object.filenames[ind].channelName = channelName;
  this.storeAsDict();
  this.performOutput(this.stor_object.filenames[ind]);
}

Persistence.prototype.stripMac = function(fname){
  if (fname.indexOf('Macintosh') === 0){
    fname = fname.split(':');
    fname.shift();
    fname = fname.join(':');
  }
  return fname;
}

Persistence.prototype.removeFile = function(filenum){
  this.stor_object.filenames.splice(filenum, 1);
  this.storeAsDict();
}


Persistence.prototype.outputAllData = function(){
  for (var i = 0; i < this.stor_object.filenames.length; i++){
    this.performOutput(this.stor_object.filenames[i]);
  }
}

Persistence.prototype.performOutput = function(fileinfo){
  outlet(0, [
    'data',
    fileinfo.channelName,
    fileinfo.filename
  ]);
}

Persistence.prototype.numFiles = function(){
  return this.stor_object.filenames.length;
}