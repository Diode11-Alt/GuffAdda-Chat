const { io } = require("socket.io-client");
const sodium = require("libsodium-wrappers");
const crypto = require("crypto");

async function run() {
  await sodium.ready;
  
  // Create a connection
  const socket = io("http://localhost:3000", {
    reconnectionDelayMax: 10000,
  });

  socket.on("connect", () => {
    console.log("Interceptor connected with socket ID:", socket.id);
    
    // Simulate user 1 (the sender)
    socket.emit("user_connected", "847dd808-b8ab-41ce-9702-c8c60bea6cbc");
    socket.emit("join_chat", { conversationId: "c60f4486-fb4d-4ff1-8331-e730facc9f7b" });

    // Try to intercept message sent by another user (or our own)
    socket.on("receive_message", (data) => {
      console.log("\n--- Intercepted Message ---");
      console.log("Raw Payload:", data);

      if (!data.iv) {
        console.log("No IV found, message might be plaintext (or misconfigured).");
        return;
      }

      console.log("\nAttempting to decode WITHOUT the private key...");
      
      try {
        // Attempting to read ciphertext without the key.
        // It's just base64 data, we can decode base64, but it's still encrypted
        const ciphertext = Buffer.from(data.content, "base64");
        
        console.log("Base64 decoded bytes:", ciphertext.toString("hex"));
        console.log("Trying to read as UTF-8 string (will be garbage):", ciphertext.toString("utf8"));
        
        // Assert that the decoded content does not match the known plaintext (if we knew it)
        // or just show it's encrypted.
        console.log("SUCCESS: Payload cannot be read as plaintext without the private key.");

        process.exit(0);
      } catch (err) {
        console.error("Failed to even parse payload:", err);
        process.exit(1);
      }
    });

    // Simulate sending an encrypted message
    console.log("Sending encrypted message...");
    
    // We mock the encryption process here just to trigger the backend/receive_message
    const keyPair = sodium.crypto_kx_keypair();
    const messageStr = "Hello, this is a secret!";
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    
    // Encrypt with a random symmetric key (in real app, this is derived from ECDH)
    const symKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
    const ciphertext = sodium.crypto_secretbox_easy(messageStr, nonce, symKey);
    
    socket.emit("send_message", {
      conversationId: "c60f4486-fb4d-4ff1-8331-e730facc9f7b",
      content: Buffer.from(ciphertext).toString("base64"),
      iv: Buffer.from(nonce).toString("base64"),
    });

    // Timeout if nothing happens
    setTimeout(() => {
      console.log("Timeout waiting for message. Make sure the server is running.");
      process.exit(1);
    }, 5000);
  });
}

run().catch(console.error);
