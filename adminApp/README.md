# Admin App

Expo React Native app for the VIP admin mobile client.

## Run it

```bash
cd adminApp
npm install
npx expo run:android
```

Then open it with:

- Android Emulator after the native build installs
- iOS Simulator via `npx expo run:ios`

## Notes

- This app now uses Better Auth email/password auth.
- Start the backend in `/adminAuthServer` before opening the app.
- Android emulator uses `http://10.0.2.2:8787` to reach the local auth server.
- iOS simulator uses `http://localhost:8787`.
- If you need a different backend URL, set `EXPO_PUBLIC_BETTER_AUTH_URL` before starting the app.
- Run `npx expo start --clear` if Metro gets stuck on old JS after a big auth change.
