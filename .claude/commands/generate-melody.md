# Generate Melody

Generate an ABC notation melody for the provided lyrics.

## Instructions

Create a singable melody following these guidelines:

1. **Range**: Keep within an octave + fifth (roughly C4 to G5)
2. **Time Signature**: Default to 4/4 unless lyrics suggest otherwise
3. **Tempo**: Match the poem's emotional tone
4. **Note Duration**: Map to syllables
   - Stressed syllables → longer notes or strong beats
   - Unstressed syllables → shorter notes or weak beats

## ABC Notation Format

```
X:1
T:Title of Song
C:Composer (Ghost Note)
M:4/4
L:1/8
Q:1/4=100
K:C
|: melody notes here :|
w: lyrics syllables here
```

## Key Elements

- `X:` - Tune number (always 1)
- `T:` - Title
- `M:` - Meter (time signature)
- `L:` - Default note length
- `Q:` - Tempo (quarter note = BPM)
- `K:` - Key signature
- `w:` - Lyrics line (aligned with notes)

## Note Values

- `C` - eighth note (when L:1/8)
- `C2` - quarter note
- `C4` - half note
- `C8` - whole note
- `z` - rest

## Example

For lyrics "Twinkle twinkle little star":
```
X:1
T:Twinkle Twinkle
M:4/4
L:1/4
K:C
|C C G G|A A G2|
w:Twin-kle twin-kle lit-tle star
```

## Lyrics to Set

$ARGUMENTS
