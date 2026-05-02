# Run this once to get your public key from MetaMask private key
# Usage: python get_pubkey.py
# Install first: pip install eth-keys

from eth_keys import keys

# Paste your MetaMask private key here (without 0x prefix)
PRIVATE_KEY_HEX = "privte key "

private_key_bytes = bytes.fromhex(PRIVATE_KEY_HEX)
pk = keys.PrivateKey(private_key_bytes)

wallet_address = pk.public_key.to_checksum_address()
public_key_hex = pk.public_key.to_hex()

print("=" * 60)
print("Wallet Address:", wallet_address)
print("Your DID:      ", f"did:ethr:{wallet_address}")
print("Public Key:    ", public_key_hex)
print("=" * 60)
print("\nPaste these into your .env and Register form:")
print(f"  DID:          did:ethr:{wallet_address}")
print(f"  Wallet Addr:  {wallet_address}")
print(f"  Public Key:   {public_key_hex}")
