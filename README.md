# X.com Auto-Feed Script

[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Userscript-00485B?style=for-the-badge&logo=tampermonkey)](https://www.tampermonkey.net/)
[![License](https://img.shields.io/github/license/Esrevorter/AutoFeed?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/github/v/release/Esrevorter/AutoFeed?style=for-the-badge&label=Latest%20Version)](https://github.com/Esrevorter/AutoFeed/releases)

> **Automate your X (Twitter) experience with intelligent, safe, and customizable feed interactions.**

A powerful Tampermonkey userscript that automatically scrolls through your X.com feed and performs actions like likes, retweets, and bookmarks based on your preferences. Designed for safety with built-in rate limit detection, randomization, and session controls.

---

## ✨ Key Features

- 🤖 **Smart Automation**: Automatically scrolls and interacts with posts in your feed
- ❤️ **Customizable Actions**: Configure auto-like, retweet, bookmark, or random combinations
- 🎲 **Human-Like Behavior**: Built-in randomizers for delays and action selection to avoid detection
- 🛡️ **Safety First**: Automatic rate limit detection and session volume limits
- 📱 **Multi-Domain Support**: Works on `x.com`, `twitter.com`, and mobile variants
- 🔄 **Auto-Update**: Seamless updates directly from GitHub
- 📊 **Real-Time Stats**: Live dashboard showing actions performed and session progress
- ⏸️ **Pause/Resume**: Full control over automation sessions
- 🌐 **Background Tab Support**: Keep-alive modes for background tab operation
- 🎯 **Targeted Feeds**: Works with Following, For You, and search result feeds
- 🔍 **Smart Detection**: Identifies end-of-feed and stops gracefully
- 🎨 **Clean UI**: Non-intrusive control panel with dark mode support

---

## 📦 Installation

### Prerequisites
You need a userscript manager installed in your browser:

| Browser | Recommended Extension |
|---------|----------------------|
| Chrome/Edge/Brave | [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Firefox | [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) |
| Safari | [Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089) |
| Opera | [Tampermonkey](https://addons.opera.com/en/extensions/details/tampermonkey/) |

### Quick Install
1. **Install a userscript manager** from the links above
2. **Click here to auto-install**: [📥 Install AutoFeed Script](https://github.com/Esrevorter/AutoFeed/raw/main/AutoFeed.user.js)
3. Confirm the installation when prompted by your userscript manager

### Manual Installation
1. Install Tampermonkey or compatible extension
2. Visit the [Releases page](https://github.com/Esrevorter/AutoFeed/releases)
3. Download the latest `AutoFeed.user.js` file
4. Open your userscript manager dashboard
5. Click "Create new script" or the `+` icon
6. Copy the entire contents of the downloaded file
7. Paste into the editor and save (Ctrl+S / Cmd+S)

---

## 🚀 Usage

### Getting Started
1. Navigate to any supported X.com feed:
   - **Home Feed**: `https://x.com/home` or `https://twitter.com/home`
   - **Following**: `https://x.com/home/following`
   - **For You**: `https://x.com/home/for_you`
   - **Search Results**: `https://x.com/search?q=your_query`
   - **Profile Tweets**: `https://x.com/username` (shows tweets tab)

2. The control panel will appear automatically in the bottom-right corner

3. Configure your settings using the dropdown menus and input fields

4. Click **"▶ Start"** to begin automation

5. Monitor the real-time statistics in the panel

6. Use **"⏸ Pause"** to temporarily stop or **"⏹ Stop"** to end the session

### Supported URLs
- ✅ `https://x.com/home`
- ✅ `https://x.com/home/following`
- ✅ `https://x.com/home/for_you`
- ✅ `https://x.com/search?*`
- ✅ `https://x.com/[username]`
- ✅ `https://twitter.com/*` (all same paths)
- ✅ `https://mobile.twitter.com/*`
- ✅ `https://mobile.x.com/*`

---

## ⚙️ Configuration Options

### Action Settings
| Option | Description | Default |
|--------|-------------|---------|
| **Like** | Automatically like posts | Enabled |
| **Retweet** | Automatically retweet posts | Disabled |
| **Bookmark** | Automatically bookmark posts | Disabled |
| **Random Combo** | Randomly select 1-2 actions per post | Disabled |
| **Randomizer** | Add randomness to timing and selection | Enabled |

### Session Volume
Control how many actions occur per session to stay under radar:
- **Max Likes**: Maximum likes per session (0 = unlimited)
- **Max Retweets**: Maximum retweets per session (0 = unlimited)
- **Max Bookmarks**: Maximum bookmarks per session (0 = unlimited)

### Scroll Direction
Choose how the script navigates the feed:
- **Down**: Standard scrolling (top to bottom)
- **Up**: Reverse scrolling (bottom to top)

### Background Tab Mode
Keep the script running when the tab is not active:
- **Disabled**: Script pauses in background tabs
- **Light**: Minimal keep-alive (saves resources)
- **Aggressive**: Active keep-alive (more reliable but uses more resources)

### Delay Settings
Fine-tune the timing between actions:
- **Scroll Delay**: Time between scrolls (ms)
- **Action Delay**: Time between actions (ms)
- **Random Variation**: % variation to add randomness

---

## 🛡️ Safety & Best Practices

⚠️ **Important Guidelines:**

1. **Start Small**: Begin with low session volumes and increase gradually
2. **Use Randomization**: Always keep the randomizer enabled for human-like behavior
3. **Respect Rate Limits**: The script detects rate limits, but prevention is better
4. **Monitor Your Account**: Watch for any unusual account activity warnings
5. **Don't Overuse**: Limit automation sessions to reasonable timeframes
6. **Follow ToS**: Be aware of X's Terms of Service regarding automation
7. **Use Responsibly**: This tool is for personal convenience, not spam

**Recommended Starting Settings:**
- Max Likes: 50-100 per session
- Max Retweets: 10-20 per session
- Randomizer: ON
- Delays: Default or higher

---

## 🐛 Troubleshooting

### Common Issues

#### ❌ Script Not Starting
- **Check URL**: Ensure you're on a supported feed page
- **Refresh Page**: Try reloading the page
- **Console Errors**: Press F12 and check Console tab for errors
- **Manager Active**: Verify Tampermonkey is enabled for x.com

#### ⚠️ Rate Limit Detected
- **Wait**: Stop the script and wait 15-30 minutes
- **Reduce Volume**: Lower your session volume limits
- **Increase Delays**: Add more time between actions
- **Enable Randomizer**: Ensure randomness is turned on

#### 🎯 Actions Not Registering
- **Check Settings**: Verify action toggles are enabled
- **Network Issues**: Check your internet connection
- **X Updates**: Twitter may have changed their UI (check for script updates)
- **Privacy Extensions**: Disable ad blockers for x.com temporarily

#### 📜 End of Feed Reached Immediately
- **Scroll Manually**: Ensure content loads by scrolling once manually
- **Check Connection**: Slow internet may prevent content loading
- **Feed Type**: Some feeds (like specific searches) may have limited results

#### 🖱️ Control Panel Not Visible
- **Scroll Down**: Panel is fixed at bottom-right
- **Zoom Level**: Reset browser zoom to 100%
- **Browser Compatibility**: Try a different browser
- **Conflicting Scripts**: Disable other userscripts temporarily

### Getting Help
1. Check the [Issues page](https://github.com/Esrevorter/AutoFeed/issues)
2. Search for similar problems in existing issues
3. Create a new issue with details about your problem
4. Include: browser version, error messages, steps to reproduce

---

## 💖 Support the Developer

If this script has been useful to you, consider supporting its development!

### ☕ Buy Me a Coffee
Your coffee donations keep the code flowing!  
[![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_a_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/esrevorter)

👉 **Visit**: [buymeacoffee.com/esrevorter](https://buymeacoffee.com/esrevorter)

### ₿ Bitcoin Donations
Prefer crypto? Send BTC to:  
```
bc1qwd330n3m9exjfhmzs6r0fh4e73v0plmjv7pawppgv7k79j5ce4gqc6c7u2
```

[![Bitcoin](https://img.shields.io/badge/Bitcoin-F7931A?style=for-the-badge&logo=bitcoin&logoColor=white)](https://blockstream.info/address/bc1qwd330n3m9exjfhmzs6r0fh4e73v0plmjv7pawppgv7k79j5ce4gqc6c7u2)

### Other Ways to Support
- ⭐ **Star this repository** on GitHub
- 🐛 **Report bugs** and suggest features via Issues
- 📢 **Share** with friends who might benefit
- 💻 **Contribute** code improvements via Pull Requests

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Disclaimer**: This script is provided as-is for educational and personal use only. The developer is not responsible for any consequences resulting from its use, including but not limited to account suspensions or violations of X's Terms of Service. Use responsibly and at your own risk.

---

## 🏷️ Version History

### v4.9 (Current)
- ✅ Added support for mobile.twitter.com and mobile.x.com domains
- ✅ Integrated automatic update mechanism via GitHub
- ✅ Enhanced documentation with comprehensive troubleshooting guide
- ✅ Added donation options (Buy Me a Coffee & Bitcoin)
- ✅ Updated metadata with proper @updateURL and @downloadURL
- ✅ Improved JSDoc comments throughout the codebase

### v4.8
- 🎲 Enhanced randomization algorithms for human-like behavior
- 🛡️ Improved rate limit detection and handling
- 📊 Added real-time session statistics dashboard
- ⏸️ Refined pause/resume functionality
- 🌐 Better background tab keep-alive modes

### Older Versions
See [Releases](https://github.com/Esrevorter/AutoFeed/releases) for full changelog.

---

## 📞 Contact & Links

- **GitHub Repository**: [github.com/Esrevorter/AutoFeed](https://github.com/Esrevorter/AutoFeed)
- **Report Issues**: [github.com/Esrevorter/AutoFeed/issues](https://github.com/Esrevorter/AutoFeed/issues)
- **Buy Me a Coffee**: [buymeacoffee.com/esrevorter](https://buymeacoffee.com/esrevorter)
- **Latest Release**: [github.com/Esrevorter/AutoFeed/releases](https://github.com/Esrevorter/AutoFeed/releases)

---

<div align="center">

**Made with ❤️ by Esrevorter**

If you find this script helpful, please consider [buying me a coffee](https://buymeacoffee.com/esrevorter)!

</div>
