from web3 import AsyncWeb3, AsyncHTTPProvider
from web3.middleware import ExtraDataToPOAMiddleware
from eth_account.messages import encode_defunct
import json, os
from secureverse.config import settings

w3 = AsyncWeb3(AsyncHTTPProvider(settings.infura_url))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

def _load_abi(name: str):
    path = os.path.join(os.path.dirname(__file__), f"../../contracts/{name}.json")
    return json.load(open(path))["abi"] if os.path.exists(path) else []

def _contract(name: str, address: str):
    return w3.eth.contract(
        address=AsyncWeb3.to_checksum_address(address), abi=_load_abi(name))

async def register_did(did: str, pubkey: str, sender: str, private_key: str) -> str:
    contract = _contract("DIDRegistry", settings.didregistry_address)
    nonce    = await w3.eth.get_transaction_count(sender)
    tx       = await contract.functions.registerDID(did, pubkey).build_transaction(
        {"from": sender, "nonce": nonce, "gas": 200_000})
    signed   = w3.eth.account.sign_transaction(tx, private_key)
    return (await w3.eth.send_raw_transaction(signed.raw_transaction)).hex()

async def verify_did_ownership(did: str, challenge: bytes, signature_hex: str) -> bool:
    try:
        msg       = encode_defunct(primitive=challenge)
        recovered = w3.eth.account.recover_message(msg, signature=bytes.fromhex(signature_hex))
        owner     = await _contract("DIDRegistry", settings.didregistry_address).functions.getOwner(did).call()
        return recovered.lower() == owner.lower()
    except Exception:
        return False
