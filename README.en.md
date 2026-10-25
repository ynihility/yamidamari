# Yamidamari

日本語: [README.md](README.md)

![Yamidamari](cover.png)

A fully-offline virtual pet that gets attached, sulks, and changes color with her mood. It runs entirely in the browser.

![Gameplay](yamidamari.gif)

[Author: 1–2 sentences on why you made this]

## How to play

- On itch.io (free): https://ynihility.itch.io/yamidamari
- Locally: open `index.html` in your browser.

## Features

- **Raising your pet**: feed her, pet her, put her to bed. Her color and lines change with her mood
- **Evolution**
- **Dress-up**: color skins and form changes, bought in the point shop
- **Room themes**
- **Mini-games**: the Comfort Game, the Pitatto Game, and AI Runner (with a boss fight)
- **Achievements**
- **Generations and a family album**

### About the "AI pet"

No AI (LLM) runs inside the game. Her replies are picked from a set of 60+ prewritten lines. Calling her an "AI pet" is part of the character's backstory.

## Technical notes

- A single HTML file (9,449 lines as of October 2026)
- Plain JavaScript and Canvas, no external libraries
- No network requests (confirmed with grep in October 2026: 0 matches)
- Saves go to the browser's localStorage

## How it was built with Claude Code

The game was developed with Claude and Claude Code.

- **Security review before release**: I had Claude review the code before publishing. It found and I fixed issues such as XSS from a tampered save file and a bug where confirming Japanese IME input sent the message too early.
- **Automatic syntax checks**: a Claude Code hook runs a syntax-check script (`check.mjs`) every time the HTML is edited.

## Author

魔王 (X: [@YNihilty](https://x.com/YNihilty), GitHub: [ynihility](https://github.com/ynihility))

Worked in the food and beverage industry for 10 years, then started learning programming in October 2025.

## License

The source code is released under the [MIT License](LICENSE). Feel free to read, use and modify it.

The following are **not** covered by the MIT License and remain all rights reserved by the author:

- The name "Yamidamari" and the character "Yami-chan" (her design and personality)
- The image files in this repository (png, gif)
- The pixel-art design of the pet drawn by the code

Please contact the author if you want to use them in your own games or products. Showing them when sharing or reviewing this project is fine.
