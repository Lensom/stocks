from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode((s + pad).encode("utf-8"))


def hash_password(password: str, *, salt_bytes: int = 16, iterations: int = 210_000) -> str:
    salt = os.urandom(salt_bytes)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${_b64url_encode(salt)}${_b64url_encode(dk)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, it_s, salt_s, hash_s = stored.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        iterations = int(it_s)
        salt = _b64url_decode(salt_s)
        expected = _b64url_decode(hash_s)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


@dataclass(frozen=True)
class TokenPayload:
    sub: str
    exp: int


def create_token(*, secret: str, sub: str, ttl_seconds: int) -> str:
    payload = {"v": 1, "sub": sub, "exp": int(time.time()) + ttl_seconds}
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    sig = hmac.new(secret.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    sig_b64 = _b64url_encode(sig)
    return f"v1.{payload_b64}.{sig_b64}"


def verify_token(*, secret: str, token: str) -> TokenPayload | None:
    try:
        v, payload_b64, sig_b64 = token.split(".", 2)
        if v != "v1":
            return None
        expected = hmac.new(secret.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest()
        actual = _b64url_decode(sig_b64)
        if not hmac.compare_digest(expected, actual):
            return None
        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        exp = int(payload["exp"])
        if exp < int(time.time()):
            return None
        sub = str(payload["sub"])
        return TokenPayload(sub=sub, exp=exp)
    except Exception:
        return None

