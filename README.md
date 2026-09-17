# The Task Wheel

A spin wheel for picking what to do next.

**Live:** https://motodale.github.io/adhd-task-manager/

## Run it

No build step and no dependencies. Open `index.html` in a browser, or serve the folder.

## Controls

| Control | What it does |
| --- | --- |
| **Spin**, or `Space` | Spins the wheel. `Space` does nothing while you type in a field. |
| Item field | Adds one slice to the wheel. Limit 30 characters. |
| Weight, 1–100 | Sets slice size. A slice of weight 3 wins three times as often as a slice of weight 1. |
| Multiplier, 1–500 | Adds that many numbered copies: `Laundry #1`, `Laundry #2`, and so on. |
| Color dot | Recolors one slice. |
| Trash icon | Deletes one slice. |
| Shuffle | Reorders the items at random. This changes how the wheel looks, not the odds. A slice still wins on its weight. |
| Clear All | Replaces the whole list with one blank slice. |
| Presets | Loads a ready-made list: Yes/No/Maybe, numbers 1–5, or daily tasks. |
| Spin Duration, 2–10s | Sets how long the wheel coasts to a stop. |
| Volume, 0–100% | Sets the volume of the ticks and the win chime. |
| Wheel Size, 300–750px | Resizes the wheel. The wheel shrinks further to fit a narrow window. |
| Remove Winner on Land | Deletes the winning slice 1.5 seconds after the wheel stops. |
| Theme button | Cycles through 7 themes. |
| Feedback button | Opens the feedback box. Report a bug or request a feature on GitHub, or send a message direct if you have no GitHub account. The direct form needs an email address so replies can reach you. |
| Spin History | Shows the last 10 winners and the time each one landed. **Clear** empties the list. |

Every setting and the wheel itself save to `localStorage`. Your wheel is still there when you come back.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page structure. Loads the five scripts. |
| `styles.css` | All styling. Each theme is a set of CSS variables. |
| `js/state.js` | Holds the wheel data. Reads and writes `localStorage`. Owns the presets, themes, and color palettes. |
| `js/wheel.js` | Draws the wheel on a canvas. Runs the spin physics. Reports which slice sits under the pointer. |
| `js/audio.js` | Synthesizes the tick and the win chime through the Web Audio API. There are no sound files. |
| `js/confetti.js` | Draws the confetti burst on a win. |
| `js/app.js` | Connects the page to the state. Renders the item list and the history list. |

## License

GPL-3.0. See [LICENSE](LICENSE). Free to use or edit, but read the license first.
