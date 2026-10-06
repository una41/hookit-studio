import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, timingSafeEqual, } from 'node:crypto';
export function digest(value) {
    return createHash('sha256').update(value).digest('hex');
}
export function verifySignature(body, signature, secret) {
    if (!signature || !/^sha256=[0-9a-f]{64}$/.test(signature) || !secret)
        return false;
    const expected = createHmac('sha256', secret).update(body).digest();
    const received = Buffer.from(signature.slice(7), 'hex');
    return received.length === expected.length && timingSafeEqual(received, expected);
}
export function encodeToken(value, encodedKey) {
    const key = Buffer.from(encodedKey, 'base64');
    if (key.length !== 32)
        throw new Error('Invalid encryption configuration');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return {
        ciphertext: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
    };
}
export function decodeToken(value, encodedKey) {
    const key = Buffer.from(encodedKey, 'base64');
    if (key.length !== 32)
        throw new Error('Invalid encryption configuration');
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(value.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
    return Buffer.concat([
        decipher.update(Buffer.from(value.ciphertext, 'base64')),
        decipher.final(),
    ]).toString('utf8');
}
