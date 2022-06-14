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
  ain1 inch 1
  ain2 inch 2

  aout1 = ain1 * gkf1 * gkt1
  aout2 = ain2 * gkf2 * gkt1


  outs aout1, aout2
endin

</CsInstruments>
<CsScore>
f0 3600
i1 0 36000
i2 0 36000
e
</CsScore>
</CsoundSynthesizer>
