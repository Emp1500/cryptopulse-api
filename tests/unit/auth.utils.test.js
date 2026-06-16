const bcrypt = require('bcryptjs');

describe('bcrypt password helpers', () => {
  const SALT_ROUNDS = 10;

  test('hashed password differs from plaintext', async () => {
    const plain = 'mypassword123';
    const hash = await bcrypt.hash(plain, SALT_ROUNDS);
    expect(hash).not.toBe(plain);
  });

  test('correct password compares successfully', async () => {
    const plain = 'correctpassword';
    const hash = await bcrypt.hash(plain, SALT_ROUNDS);
    expect(await bcrypt.compare(plain, hash)).toBe(true);
  });

  test('wrong password fails comparison', async () => {
    const hash = await bcrypt.hash('correctpassword', SALT_ROUNDS);
    expect(await bcrypt.compare('wrongpassword', hash)).toBe(false);
  });

  test('each hash is unique (salted)', async () => {
    const plain = 'samepassword';
    const hash1 = await bcrypt.hash(plain, SALT_ROUNDS);
    const hash2 = await bcrypt.hash(plain, SALT_ROUNDS);
    expect(hash1).not.toBe(hash2);
    expect(await bcrypt.compare(plain, hash1)).toBe(true);
    expect(await bcrypt.compare(plain, hash2)).toBe(true);
  });
});
