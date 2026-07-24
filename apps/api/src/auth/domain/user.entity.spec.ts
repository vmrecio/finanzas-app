import { User } from './user.entity';

describe('User', () => {
  describe('register', () => {
    it('creates a User with the given id, normalized email, and password hash', () => {
      const user = User.register({
        id: 'user-1',
        email: 'Jane.Doe@Example.com',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$salt$hash',
      });

      expect(user.id).toBe('user-1');
      expect(user.email).toBe('jane.doe@example.com');
      expect(user.passwordHash).toBe('$argon2id$v=19$m=65536,t=3,p=4$salt$hash');
    });

    it('defaults createdAt to now when not provided', () => {
      const before = Date.now();
      const user = User.register({
        id: 'user-2',
        email: 'a@b.com',
        passwordHash: '$argon2id$hash',
      });
      const after = Date.now();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after);
    });

    it('rejects an invalid email format', () => {
      expect(() =>
        User.register({ id: 'user-3', email: 'not-an-email', passwordHash: '$argon2id$hash' }),
      ).toThrow('User email must be a valid email address');
    });

    it('rejects an empty password hash (never store plaintext, never store nothing)', () => {
      expect(() => User.register({ id: 'user-4', email: 'a@b.com', passwordHash: '' })).toThrow(
        'User passwordHash must not be empty',
      );
    });

    it('rejects a password hash equal to a plaintext-looking short value with no hash markers', () => {
      // A raw password like "hunter2" must never be accepted as a passwordHash —
      // this guards against accidentally passing the plaintext password straight through.
      expect(() =>
        User.register({ id: 'user-5', email: 'a@b.com', passwordHash: 'hunter2' }),
      ).toThrow('User passwordHash does not look like a hash');
    });
  });
});
