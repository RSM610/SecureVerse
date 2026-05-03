import logging
import json
import os
from web3 import AsyncWeb3, AsyncHTTPProvider
from web3.middleware import ExtraDataToPOAMiddleware
from eth_account.messages import encode_defunct
from secureverse.config import settings

log = logging.getLogger(__name__)

w3 = AsyncWeb3(AsyncHTTPProvider(settings.infura_url))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)


def _load_abi(name: str):
    path = os.path.join(os.path.dirname(__file__), f"../../contracts/{name}.json")
    if not os.path.exists(path):
        log.warning(f"[DID] ABI file not found: {path}")
        return []
    abi = json.load(open(path))["abi"]
    log.info(f"[DID] Loaded ABI for {name} ({len(abi)} entries)")
    return abi


def _contract(name: str, address: str):
    checksum = AsyncWeb3.to_checksum_address(address)
    log.info(f"[DID] Using contract {name} at {checksum}")
    return w3.eth.contract(address=checksum, abi=_load_abi(name))


async def register_did(did: str, pubkey: str, sender: str, private_key: str) -> str:
    log.info(f"[DID] Registering DID: {did} from sender: {sender}")
    contract = _contract("DIDRegistry", settings.didregistry_address)
    nonce    = await w3.eth.get_transaction_count(sender)
    tx       = await contract.functions.registerDID(did, pubkey).build_transaction(
        {"from": sender, "nonce": nonce, "gas": 200_000})
    signed   = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash  = (await w3.eth.send_raw_transaction(signed.raw_transaction)).hex()
    log.info(f"[DID] register_did tx hash: {tx_hash}")
    return tx_hash


async def verify_did_ownership(did: str, challenge: bytes, signature_hex: str) -> bool:
    log.info(f"[DID] ── verify_did_ownership START ──")
    log.info(f"[DID] DID            : {did}")
    log.info(f"[DID] challenge (hex): {challenge.hex()}")
    log.info(f"[DID] signature (hex): {signature_hex[:20]}...{signature_hex[-20:]}")

    # ── Step 1: Recover signer address from signature ──
    try:
        msg       = encode_defunct(primitive=challenge)
        recovered = w3.eth.account.recover_message(msg, signature=bytes.fromhex(signature_hex))
        log.info(f"[DID] Recovered address : {recovered}")
    except Exception as e:
        log.error(f"[DID] FAILED at signature recovery: {type(e).__name__}: {e}")
        return False

    # ── Step 2: Check Infura connectivity ──
    try:
        connected = await w3.is_connected()
        log.info(f"[DID] Web3 connected    : {connected}")
        if not connected:
            log.error("[DID] FAILED: Web3 is not connected to Infura. Check INFURA_URL in .env")
            return False
    except Exception as e:
        log.error(f"[DID] FAILED checking Web3 connection: {type(e).__name__}: {e}")
        return False

    # ── Step 3: Call getOwner on DIDRegistry contract ──
    try:
        contract = _contract("DIDRegistry", settings.didregistry_address)
        owner    = await contract.functions.getOwner(did).call()
        log.info(f"[DID] Contract owner    : {owner}")
    except Exception as e:
        log.error(f"[DID] FAILED calling getOwner: {type(e).__name__}: {e}")
        log.error(f"[DID] Check: 1) DIDREGISTRY_ADDRESS in .env  2) DID was registered on-chain  3) Infura URL is for correct network (Sepolia?)")
        return False

    # ── Step 4: Check for zero address (DID not registered) ──
    zero = "0x0000000000000000000000000000000000000000"
    if owner.lower() == zero:
        log.error(f"[DID] FAILED: getOwner returned zero address — DID is not registered on-chain")
        return False

    # ── Step 5: Compare recovered address with owner ──
    match = recovered.lower() == owner.lower()
    log.info(f"[DID] Recovered : {recovered.lower()}")
    log.info(f"[DID] Owner     : {owner.lower()}")
    log.info(f"[DID] Match     : {match}")

    if not match:
        log.error("[DID] FAILED: Recovered address does not match contract owner.")
        log.error("[DID] Possible causes: wrong private key used, or DID registered under different wallet.")

    log.info(f"[DID] ── verify_did_ownership END → {match} ──")
    return match