# Solana E2EE Chat - Decentralized Messaging Demo

A privacy-first, decentralized messaging application built on Solana with end-to-end encryption.

## 🔐 Features

- **Wallet-Based Identity**: Connect with Phantom, Solflare, or Backpack wallets
- **End-to-End Encryption**: Messages encrypted with x25519 elliptic curve cryptography
- **Message Signing**: All messages signed with Solana wallet for authenticity
- **Decentralized Storage**: Messages stored on Arweave's permanent network
- **Burner Mode**: Ephemeral messaging with temporary wallets
- **No Backend**: Fully decentralized architecture

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A Solana wallet extension (Phantom, Solflare, or Backpack)
- Some SOL for transaction fees (Devnet recommended for testing)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd solana-e2ee-chat
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## 🌐 Deployment

### Deploy to Netlify

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Upload the `dist` folder manually to Netlify**

### Deploy to GitHub Pages

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json scripts:**
   ```json
   "deploy:gh": "npm run build && gh-pages -d dist"
   ```

3. **Deploy:**
   ```bash
   npm run deploy:gh
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for production configuration:

```env
VITE_SOLANA_NETWORK=mainnet-beta
VITE_ARWEAVE_GATEWAY=https://arweave.net
```

### Wallet Configuration

The app automatically detects installed wallet extensions. Supported wallets:

- **Phantom**: `window.solana`
- **Solflare**: `window.solflare`
- **Backpack**: `window.backpack`

## 🏗️ Architecture

### Core Components

- **WalletConnection**: Handles wallet detection and connection
- **ChatInterface**: Main messaging UI with encryption/decryption
- **BurnerWallet**: Temporary wallet generation for ephemeral messaging
- **EncryptionService**: x25519 encryption/decryption using TweetNaCl
- **ArweaveService**: Decentralized storage integration
- **SolanaService**: Wallet interaction and message signing

### Security Features

1. **x25519 Encryption**: Elliptic curve Diffie-Hellman key exchange
2. **Message Signing**: Ed25519 signatures via Solana wallets
3. **Key Derivation**: Deterministic encryption keys from Solana public keys
4. **Ephemeral Keys**: Per-message ephemeral key pairs for forward secrecy

### Storage Architecture

- **Local**: Temporary message cache in browser storage
- **Arweave**: Permanent decentralized storage for message history
- **Burner Mode**: Messages not persisted beyond session

## 🧪 Testing

### Manual Testing Checklist

1. **Wallet Connection**:
   - [ ] Connect Phantom wallet
   - [ ] Connect Solflare wallet  
   - [ ] Connect Backpack wallet
   - [ ] Disconnect wallet

2. **Messaging**:
   - [ ] Send encrypted message
   - [ ] Receive and decrypt message
   - [ ] Verify message signatures
   - [ ] Test with invalid recipient address

3. **Burner Mode**:
   - [ ] Generate burner wallet
   - [ ] Send ephemeral messages
   - [ ] Verify messages don't persist

4. **Storage**:
   - [ ] Verify Arweave transaction IDs
   - [ ] Test message persistence
   - [ ] Test cross-session message loading

### Demo Scenarios

1. **Basic Chat**: Two users with regular wallets exchanging messages
2. **Burner Chat**: One user with burner wallet for anonymous messaging  
3. **Cross-Platform**: Test different wallet combinations
4. **Message History**: Verify message persistence and loading

## 🔒 Security Considerations

### Production Recommendations

1. **Key Derivation**: Implement proper HKDF for key derivation from Solana keys
2. **Signature Verification**: Add full Ed25519 signature verification
3. **Rate Limiting**: Implement client-side rate limiting for message sending
4. **Input Validation**: Sanitize all user inputs and wallet addresses
5. **Error Handling**: Avoid leaking sensitive information in error messages

### Known Limitations

- Demo uses simplified key derivation (use proper KDF in production)
- Arweave integration is mocked (implement real Arweave SDK)
- No message ordering guarantees across different storage layers
- Burner wallets are not funded (manual funding required for transactions)

## 📚 API Reference

### EncryptionService

```ts
// Encrypt message for recipient
await encryptionService.encryptMessage(message: string, recipientAddress: string): Promise<string>

// Decrypt received message  
await encryptionService.decryptMessage(encryptedMessage: string, walletAddress: string): Promise<string>
```

### ArweaveService

```ts
// Store message on Arweave
await arweaveService.storeMessage(message: ChatMessage): Promise<string>

// Load messages for wallet
await arweaveService.loadMessagesForWallet(walletAddress: string): Promise<void>
```

### SolanaService

```ts
// Connect wallet
await solanaService.connect(walletId: string): Promise<void>

// Sign message
await solanaService.signMessage(message: string): Promise<string>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
---

**⚠️ Disclaimer**: This is a demo application for educational purposes. Do not use for sensitive communications without a proper security audit.
