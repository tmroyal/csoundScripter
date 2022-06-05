<CsoundSynthesizer>
<CsInstruments>
sr      = 44100
ksmps   = 16
nchnls  = 2

massign 0, 0 ; Disable default MIDI assignments.
massign 1, 2 ; Assign MIDI channel 1 to instr 2.
giSine ftgen 1, 0, 16384, 10, 1 ; Generate a sine wave table.

chn_k "fdial1", 1      ; 3 = input + output
chn_k "fdial2", 1
chn_k "toggle1", 1

0dbfs = 1

instr 1
    gkf1 chnget "fdial1"
    gkf2 chnget "fdial2"
    gkt1 chnget "toggle1" 
endin

instr 2
    iCps cpsmidi
    iAmp veloc 0, 0dbfs
    
    amod oscil3 gkf1*20, gkf2*100*gkt1
    acar oscil3 iAmp, iCps+amod

    ; Generate and apply the envelope.
    aenv expsegr 0.001, 1, 1, 0, 1, 1, 0.001
    aout = acar * aenv

    out aout
endin
</CsInstruments>
<CsScore>
f0 3600
i1 0 36000
e
</CsScore>
</CsoundSynthesizer>
