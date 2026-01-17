package webdav

import "testing"

func TestEncryptDecryptSecretRoundTrip(t *testing.T) {
	key, err := ParseKey("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
	if err != nil {
		t.Fatalf("parse key: %v", err)
	}
	ciphertext, err := EncryptSecret(key, "super-secret")
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}
	plaintext, err := DecryptSecret(key, ciphertext)
	if err != nil {
		t.Fatalf("decrypt: %v", err)
	}
	if plaintext != "super-secret" {
		t.Fatalf("expected secret round-trip, got %q", plaintext)
	}
}
