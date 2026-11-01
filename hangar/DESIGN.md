# Hangar — design sheet

## Premise
An abandoned timber-and-tin hangar full of graffiti and wall screens (+ a visitor looking at the screens)
+ a red devil that dances on a painted rainbow spiral (+ a stone mask on the back wall that
erupts in colour at 26 s) = a 40 s loop about a place that plays back its own memory.

- Archetype (router row): festival/stage crossed with "home, shop, library" (interior cutaway).
- Assumption line: interior cutaway, 24 x 16 slab, 40 s loop, 4 systems (wall screens, stone mask,
  floor spiral, computer desk), 6 roles (devil, goldfish, 2 sentinels, 2 cube figures, visitor),
  64 colours. Reference: user-supplied video, first ~110 s (hangar), see refs/SOURCES.md.

## Camera side
- Locked: azimuth 45, elevation 33, fov 20.5. Interior cutaway: -X wall (screen left) and -Z wall
  (screen right) are the back walls; +X and +Z sides are open, roof planes omitted, trusses kept.
- Slab 24 x 16 x 0.42. Landmark: stone mask on -Z wall, top ~5.4 m. Foreground prop: computer desk (4.5, 5.6).
  Mid-ground: spiral (-2, 1). Threshold: entrance from +X at z 3.8, 2 m kept clear.

## Cast
| role | silhouette | locomotion | action | reaction | exit |
| devil | red, horns, tail | hop-walk between marks | arms-up flame fling (26-32 s) | flinch when fish passes | returns to spiral |
| goldfish | big orange fish | glide on S curve, high | tail/fin beat, circles spiral | none | leaves through +X |
| sentinel x2 | tall black robe, pale mask, orange horns | step forward | bow to the mask | sway | step back |
| cube figure x2 | white blocks | back-and-forth lane z 4.6 | look at screens | none | seam |
| visitor | human, red top | distance-driven walk | looks up, sits at desk | looks at burst | walks out +X |

## Beats (s)
0 establish, screens on / 3-10 visitor enters / 10-16 visitor reads the screens / 12-36 fish crosses /
16-24 devil hops to the centre, visitor sits at desk / 26 mask erupts, screens flash / 26-32 devil flames,
sentinels bow / 32-38 burst fades, visitor leaves, devil returns / 38-40 quiet seam.
QA stamps: 2, 9, 14, 21, 27, 30, 36.

## Systems
screens (5, canvas, pure function of t) / mask mouth (interior glow + confetti ribbons) /
spiral (floor, colour cycle) / desk (monitor image changes with the burst).

## Detail budget
Landmark: stone mask 30+ parts. Hero props: desk set, drum kit. Supporting: posts, trusses, planks,
graffiti panels, rugs. Ambient loops: dust motes, monitor flicker, sentinel sway.
