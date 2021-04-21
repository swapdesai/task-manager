const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOneId, userOne, setupDB } = require('./fixtures/db');

beforeEach(setupDB);

test('Should signup a new user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Andrew',
      email: 'andrew@example.com',
      password: 'MyPass999!',
    })
    .expect(201);

  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  expect(response.body).toMatchObject({
    user: {
      name: 'Andrew',
      email: 'andrew@example.com',
    },
    token: user.tokens[0],
  });
  expect(user.password).not.toBe('MyPass999!');
});

test('Should login an existing user', async () => {
  const response = await request(app)
    .post('/users/login')
    // eslint-disable-next-line no-undef
    .send(({ email, password } = userOne))
    .expect(200);

  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1]);
});

test('Should not login a nonexisting user', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: { userOne },
      password: 'incorrectpass',
    })
    .expect(400);
});

test('Should get profile for user', async () => {
  // eslint-disable-next-line prettier/prettier
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0]}`)
    .send()
    .expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
  // eslint-disable-next-line prettier/prettier
  await request(app)
    .get('/users/me')
    .send()
    .expect(401);
});

test('Should delete account for user', async () => {
  // eslint-disable-next-line prettier/prettier
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0]}`)
    .send()
    .expect(204);

  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test('Should not delete account for unauthenticated user', async () => {
  // eslint-disable-next-line prettier/prettier
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401);
});

test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0]}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0]}`)
    .send({
      name: 'Jess',
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.name).toEqual('Jess');
});

test('Should not update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0]}`)
    .send({
      location: 'Boston',
    })
    .expect(400);
});
