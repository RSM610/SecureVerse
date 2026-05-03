import os, sys

def main():
    raw = os.environ.get("DEPLOYER_PRIVATE_KEY", "").strip()
    if not raw:
        print("[ERROR] DEPLOYER_PRIVATE_KEY is not set.")
        sys.exit(1)
    hex_key = raw.lstrip("0x").lstrip("0X")
    if len(hex_key) != 64:
        print(f"[ERROR] Key must be 64 hex chars (got {len(hex_key)}).")
        sys.exit(1)
    try:
        private_key_bytes = bytes.fromhex(hex_key)
    except ValueError:
        print("[ERROR] Key contains non-hex characters.")
        sys.exit(1)
    try:
        from eth_keys import keys
    except ImportError:
        print("[ERROR] Run: python -m pip install eth-keys")
        sys.exit(1)
    pk = keys.PrivateKey(private_key_bytes)
    addr = pk.public_key.to_checksum_address()
    pub  = pk.public_key.to_hex()
    print("Wallet Address:", addr)
    print("DID:           ", f"did:ethr:{addr}")
    print("Public Key:    ", pub)

if __name__ == "__main__":
    main()
