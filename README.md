# SolChat: Secure & Decentralized Solana Messenger

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Solana](https://img.shields.io/badge/Solana-Blockchain-blueviolet)](https://solana.com)
[![React](https://img.shields.io/badge/React-UI-blue)](https://reactjs.org)
[![IPFS](https://img.shields.io/badge/IPFS-Storage-lightgrey)](https://ipfs.tech/)

SolChat is a secure, decentralized peer-to-peer messaging application built on the Solana blockchain, featuring end-to-end encryption and file sharing capabilities. It allows users to communicate directly and securely using their Solana wallets for authentication.

## Overview

In an era where digital privacy is paramount, SolChat offers a messaging solution that leverages the power of blockchain technology and decentralized storage. By using Solana for its speed and low transaction costs, and IPFS for distributed file storage, SolChat aims to provide a censorship-resistant and secure communication platform. Messages are end-to-end encrypted, ensuring that only the intended recipients can access the content.

## ✨ Features

* 🔐 **Secure Messaging:**
    * End-to-end encryption using TweetNaCl.js (libsodium-compatible).
    * Messages stored locally with optional IPFS integration for persistence and decentralization.
    * Solana wallet-based authentication for verifying user identity.
* 👥 **User Management:**
    * Custom usernames and basic profiles.
    * Recent peers list with activity status indicators.
    * Nickname support for contacts for easier identification.

* 💫 **Modern UI/UX:**
    * Real-time message status updates (sending, sent, delivered, read - if implemented).
    * Responsive design for usability across different devices.
    * Intuitive peer selection and chat interface.

## 🛠️ Tech Stack

* **Frontend:**
    * React 18 with TypeScript
    * Tailwind CSS for styling
    * Vite for fast development and optimized builds
* **Blockchain Integration:**
    * Solana Web3.js (`@solana/web3.js`) for interacting with the Solana network.
    * Solana Wallet Adapter for seamless integration with popular Solana wallets (e.g., Phantom, Solflare).
* **Storage & Encryption:**
    * IPFS / Helia (or similar IPFS client library) for decentralized message storage.
    * TweetNaCl.js for robust end-to-end encryption.
    * LocalStorage / IndexedDB for persistent client-side data (e.g., messages, user settings, peer list).

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js:** Version 18.x or higher. You can download it from [nodejs.org](https://nodejs.org/).
* **npm/yarn:** Node.js package manager. npm is included with Node.js. Yarn can be installed from [yarnpkg.com](https://yarnpkg.com/).
* **Git:** For cloning the repository (optional if downloading as a ZIP).
* **A Solana Wallet:** A browser extension wallet like [Phantom](https://phantom.app/) or [Solflare](https://solflare.com/) is required to interact with the application.
* **SOL:** A small amount of SOL in your wallet for any potential transaction fees (though SolChat aims to minimize these).

## 🚀 Installation

Follow these steps to get your development environment set up:

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/solchat-dev/solchat.git](https://github.com/solchat-dev/solchat.git)
    cd solchat
    ```
    (If the repository URL is different, please use the correct one.)

2.  **Install Dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```

3.  **Set up Environment Variables (if any):**
    Create a `.env.local` file in the root of the project by copying the example file (if one is provided, e.g., `.env.example`).
    ```bash
    cp .env.example .env.local
    ```
    Fill in any necessary environment variables, such as RPC endpoints or IPFS gateway details.
    *Example `.env.local` (contents may vary based on project structure):*
    ```env
    VITE_SOLANA_RPC_HOST="[https://api.devnet.solana.com](https://api.devnet.solana.com)" # Or your preferred RPC
    VITE_IPFS_GATEWAY="[https://ipfs.io/ipfs/](https://ipfs.io/ipfs/)"
    ```

4.  **Run the Development Server:**
    Using npm:
    ```bash
    npm run dev
    ```
    Or using yarn:
    ```bash
    yarn dev
    ```
    This will typically start the application on `http://localhost:5173` (Vite's default) or another specified port.

## ▶️ Usage

Once the application is running:

1.  **Connect Wallet:**
    * Open the application in your browser.
    * Click on the "Connect Wallet" or "Select Wallet" button.
    * Choose your preferred Solana wallet (e.g., Phantom) and approve the connection.

2.  **Set Up Profile (if first time):**
    * You might be prompted to set up a username or profile information upon first connection.

3.  **Start Messaging:**
    * **Select a Peer:** Enter the Solana address of the recipient or select a user from your recent peers/contacts list.
    * **Compose Message:** Type your message in the input field.
    * **Send:** Click the send button. The message will be encrypted and transmitted.

4.  **Manage Contacts/Peers:**
    * Access the contacts or recent peers section (e.g., via a user icon).
    * Add nicknames to known addresses for easier recognition.
    * View activity status if implemented.


## 🛡️ Security Features

* **End-to-End Encryption:** All messages are encrypted using TweetNaCl's `box` (public-key authenticated encryption). Only the sender and recipient, with their respective secret keys, can decrypt messages.
* **Wallet-Based Authentication:** User identity is tied to their Solana wallet address, ensuring message integrity and authenticity.
* **Decentralized Storage (IPFS):** Messages are stored on IPFS, making them censorship-resistant and not reliant on central servers.
* **Privacy-Focused:** Aims for direct peer-to-peer communication principles, minimizing central points of failure or data collection.

## 🖼️ Screenshots / Demo

* `![Login Screen](https://i.gyazo.com/c5a76aa731e88dbc53e88f8913fe241a.png)`
* `![Chat Interface](https://i.gyazo.com/af3d60773e21a27dc2aacd4edfb4620a.png)`


Please ensure your code adheres to the project's coding standards and includes tests where appropriate.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details. (If you don't have a LICENSE.md, you should add one. The MIT license is a common choice for open-source projects.)

## 🙏 Acknowledgments

* **Solana Foundation:** For providing the robust and scalable blockchain infrastructure.
* **IPFS/Protocol Labs:** For the decentralized storage technology.
* **TweetNaCl.js Authors:** For the reliable and easy-to-use cryptographic library.
* The broader Web3 and open-source community for inspiration and tools.

---

*This README is a template. Please update it with specific details relevant to your `solchat-dev/solchat` repository, especially the repository URL, environment variable names, and any project-specific instructions.*
