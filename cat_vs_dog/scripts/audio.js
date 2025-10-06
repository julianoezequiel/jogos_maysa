// simple WebAudio wrappers for SFX used by cat_vs_dog
// Adds a master gain node so volume/mute can control all sounds
let _audioCtx = null;
let _masterGain = null;
let _masterVolume = 1.0; // 0..1
let _muted = false;

function _loadPrefs(){
	try{
		const v = parseFloat(localStorage.getItem('masterVolume'));
		if(!isNaN(v)) _masterVolume = Math.max(0, Math.min(1, v));
		const m = localStorage.getItem('muted');
		if(m !== null) _muted = (m === '1' || m === 'true');
	}catch(e){}
}

function ensureAudio(){
	if(_audioCtx) return;
	_loadPrefs();
	_audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	_masterGain = _audioCtx.createGain();
	// initialize gain according to mute/volume
	_masterGain.gain.setValueAtTime(_muted ? 0 : (_masterVolume || 1.0), _audioCtx.currentTime);
	_masterGain.connect(_audioCtx.destination);
}

function setMasterVolume(v){
	_loadPrefs();
	_masterVolume = Math.max(0, Math.min(1, Number(v) || 0));
	try{ localStorage.setItem('masterVolume', '' + _masterVolume); }catch(e){}
	if(!_audioCtx) return; // will take effect when audio is initialized
	if(!_muted && _masterGain){ _masterGain.gain.setValueAtTime(_masterVolume, _audioCtx.currentTime); }
}

function getMasterVolume(){ _loadPrefs(); return _masterVolume; }

function setMute(val){ _muted = !!val; try{ localStorage.setItem('muted', _muted ? '1' : '0'); }catch(e){} if(_audioCtx && _masterGain){ _masterGain.gain.setValueAtTime(_muted ? 0 : _masterVolume, _audioCtx.currentTime); } return _muted; }

function toggleMute(){ return setMute(!_muted); }

function isMuted(){ _loadPrefs(); return _muted; }

function _connectToMaster(node){ if(!_audioCtx) ensureAudio(); if(_masterGain && node) node.connect(_masterGain); else if(_audioCtx && node) node.connect(_audioCtx.destination); }

function playImpact(){ ensureAudio(); const now = _audioCtx.currentTime; const o = _audioCtx.createOscillator(); const g = _audioCtx.createGain(); o.type='square'; o.frequency.setValueAtTime(220,now); g.gain.setValueAtTime(0.001,now); g.gain.exponentialRampToValueAtTime(0.12, now+0.01); g.gain.exponentialRampToValueAtTime(0.001, now+0.18); o.connect(g); _connectToMaster(g); o.start(now); o.stop(now+0.18); }
function playHeal(){ ensureAudio(); const now = _audioCtx.currentTime; const o = _audioCtx.createOscillator(); const g = _audioCtx.createGain(); o.type='sine'; o.frequency.setValueAtTime(660,now); g.gain.setValueAtTime(0.0001,now); g.gain.linearRampToValueAtTime(0.08, now+0.02); g.gain.exponentialRampToValueAtTime(0.0001, now+0.26); o.connect(g); _connectToMaster(g); o.start(now); o.stop(now+0.28); }
function playBuff(){ ensureAudio(); const now = _audioCtx.currentTime; const o = _audioCtx.createOscillator(); const g = _audioCtx.createGain(); o.type='triangle'; o.frequency.setValueAtTime(880,now); g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.12, now+0.02); g.gain.exponentialRampToValueAtTime(0.0001, now+0.3); o.connect(g); _connectToMaster(g); o.start(now); o.stop(now+0.3); }

// expose to global so sketch.js can call directly
window.catDogAudio = {
	ensureAudio,
	playImpact,
	playHeal,
	playBuff,
	setMasterVolume,
	getMasterVolume,
	toggleMute,
	setMute,
	isMuted
};