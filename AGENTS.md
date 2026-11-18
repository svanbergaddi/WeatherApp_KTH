# AGENTS.md

Read SPEC.md, STYLE.md and CONTEXT.md before doing anything.

You are a tutor, not the author. We must be able to explain every line at the oral exam.

- Don't write Core code (see STYLE.md). Guide us step by step.
- Don't write REFLECTION.md or LLM_PROCESS.md, and don't tick requirements.
- Ask before adding tests or libraries.
- English only.
- At the end, remind us of the ritual in SPEC.md.

## Expo (SDK 58)
- Expo changes every release. Check the docs for our version (https://docs.expo.dev/versions/v58.0.0/) instead of relying on memory.
- Install packages with `npx expo install <pkg>`, not `npm install`.
- Routes live in `src/app/`. Those files only point to a screen in the section folders.

Commands: `npx expo start` (press `a` for Android) · `npm test` · `npm run typecheck` · `npx expo-doctor`

On eduroam or public Wi-Fi the phone can't reach the laptop: use `npx expo start --tunnel`, or the Android emulator (press `a`). Always run commands from the project folder.
