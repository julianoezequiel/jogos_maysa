// simple WebAudio wrappers for SFX used by cat_vs_dog
// Exposes: ensureAudio, playImpact, playHeal, playBuff on window
let _audioCtx = null;
function ensureAudio(){ if(_audioCtx) return; _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playImpact(){ ensureAudio(); const now = _audioCtx.currentTime; const o = _audioCtx.createOscillator(); const g = _audioCtx.createGain(); o.type='square'; o.frequency.setValueAtTime(220,now); g.gain.setValueAtTime(0.001,now); g.gain.exponentialRampToValueAtTime(0.12, now+0.01); g.gain.exponentialRampToValueAtTime(0.001, now+0.18); o.connect(g); g.connect(_audioCtx.destination); o.start(now); o.stop(now+0.18); }
function playHeal(){ ensureAudio(); const now = _audioCtx.currentTime; const o = _audioCtx.createOscillator(); const g = _audioCtx.createGain(); o.type='sine'; o.frequency.setValueAtTime(660,now); g.gain.setValueAtTime(0.0001,now); g.gain.linearRampToValueAtTime(0.08, now+0.02); g.gain.exponentialRampToValueAtTime(0.0001, now+0.26); o.connect(g); g.connect(_audioCtx.destination); o.start(now); o.stop(now+0.28); }
function playBuff(){ ensureAudio(); const now = _audioCtx.currentTime; const o = _audioCtx.createOscillator(); const g = _audioCtx.createGain(); o.type='triangle'; o.frequency.setValueAtTime(880,now); g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.12, now+0.02); g.gain.exponentialRampToValueAtTime(0.0001, now+0.3); o.connect(g); g.connect(_audioCtx.destination); o.start(now); o.stop(now+0.3); }

// expose to global so sketch.js can call directly
window.catDogAudio = {
	ensureAudio,
	playImpact,
	playHeal,
	playBuff
};