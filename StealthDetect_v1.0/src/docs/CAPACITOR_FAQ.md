# Capacitor Integration FAQ

Common questions about Capacitor and native iOS integration.

## General

**Q: What is Capacitor?**  
A: Capacitor is a cross-platform native runtime that allows web apps to run as native iOS/Android apps.

**Q: How does it differ from React Native?**  
A: Capacitor uses web technologies (HTML/CSS/JS) running in a native WebView, while React Native uses native components.

## Development

**Q: How do I test native features in the browser?**  
A: Use the `isNative` check and provide web fallbacks:
```typescript
if (isNative()) {
  await Preferences.set({ key, value });
} else {
  localStorage.setItem(key, value);
}
```

**Q: How do I sync changes to iOS?**  
A: Run `npx cap sync ios` after any web build or plugin changes.

**Q: Can I use browser DevTools with iOS?**  
A: Yes! Use Safari → Develop → [Your Device] → [App] to inspect the WebView.

## Plugins

**Q: What plugins does StealthDetect use?**  
A:
- `@capacitor/preferences` - Secure storage
- `@capacitor/splash-screen` - Splash screen
- `@capacitor/status-bar` - Status bar styling
- Custom `app-scanner` - App scanning (iOS)

**Q: How do I create a custom plugin?**  
A: See `/capacitor-plugins/app-scanner/` for an example.

## Storage

**Q: Where is data stored on iOS?**  
A: Preferences API uses iOS UserDefaults (encrypted by system). KV store data is in Supabase (cloud).

**Q: Are PIN hashes stored locally?**  
A: Yes, using Capacitor Preferences (iOS) or localStorage (web). Never sent to cloud.

## Building

**Q: Why does my build fail?**  
A: Common causes:
1. Xcode version too old (need 14+)
2. Missing CocoaPods dependencies
3. Invalid signing configuration
4. Need to run `npx cap sync ios`

**Q: How do I enable native debugging?**  
A: In Xcode, set breakpoints in the native Swift/Objective-C code in `/ios`.

## Performance

**Q: Is performance good in Capacitor?**  
A: Yes for most use cases. The WebView is highly optimized on iOS.

**Q: How can I improve performance?**  
A: 
- Minimize DOM operations
- Use virtual scrolling for long lists
- Optimize images
- Lazy load components

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Plugin Development](https://capacitorjs.com/docs/plugins)
