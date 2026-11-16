import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/server.js';
import User from '../src/models/User.js';
import Friendship from '../src/models/Friendship.js';
import Conversation from '../src/models/Conversation.js';

describe('BatchiT API Integration Tests', () => {
  let user1Token = '';
  let user2Token = '';
  let user1Id = '';
  let user2Id = '';
  let conversationId = '';

  const user1Data = {
    username: `testuser1_${Date.now()}`,
    email: `test1_${Date.now()}@batchit.app`,
    displayName: 'Alex Rivers',
    password: 'Password123'
  };

  const user2Data = {
    username: `testuser2_${Date.now()}`,
    email: `test2_${Date.now()}@batchit.app`,
    displayName: 'Sam Vance',
    password: 'Password123'
  };

  beforeAll(async () => {
    // Ensure DB connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://127.0.0.1:27017/batchit');
    }
  });

  afterAll(async () => {
    // Cleanup test users
    if (user1Id) await User.findByIdAndDelete(user1Id);
    if (user2Id) await User.findByIdAndDelete(user2Id);
    if (conversationId) await Conversation.findByIdAndDelete(conversationId);
  });

  it('Health Check returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('BatchiT API');
  });

  it('Registers User 1 with validation and secure tokens', async () => {
    const res = await request(app).post('/api/auth/register').send(user1Data);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe(user1Data.username.toLowerCase());
    expect(res.body.data.user.displayName).toBe(user1Data.displayName);
    expect(res.body.data.accessToken).toBeDefined();

    user1Token = res.body.data.accessToken;
    user1Id = res.body.data.user.id;
  });

  it('Registers User 2', async () => {
    const res = await request(app).post('/api/auth/register').send(user2Data);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    user2Token = res.body.data.accessToken;
    user2Id = res.body.data.user.id;
  });

  it('Fails login with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user1Data.username, password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Logs in User 1 successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: user1Data.username, password: user1Data.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('Accesses protected /api/auth/me with Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe(user1Data.username.toLowerCase());
  });

  it('Blocks unauthenticated access to protected routes', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Sends a friend request from User 1 to User 2', async () => {
    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ recipientId: user2Id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('User 2 checks pending incoming friend requests', async () => {
    const res = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.incoming.length).toBeGreaterThan(0);

    const requestId = res.body.data.incoming[0]._id;

    // Accept request
    const acceptRes = await request(app)
      .post(`/api/friends/request/${requestId}/accept`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.success).toBe(true);
    expect(acceptRes.body.data.conversationId).toBeDefined();
    conversationId = acceptRes.body.data.conversationId;
  });

  it('Sends an encrypted text message in the conversation', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        conversationId,
        type: 'text',
        content: 'Hey Sam! Welcome to BatchiT.',
        isEncrypted: false
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Hey Sam! Welcome to BatchiT.');
  });

  it('Sends a snap with duration and view-once configuration', async () => {
    const res = await request(app)
      .post('/api/snaps')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        recipients: [user2Id],
        mediaUrl: '/uploads/sample_snap.jpg',
        mediaType: 'photo',
        duration: 5,
        viewOnce: true,
        textOverlay: 'Night vibes ✨'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.duration).toBe(5);
  });

  it('Creates and fetches stories', async () => {
    const storyRes = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        mediaUrl: '/uploads/sample_story.jpg',
        mediaType: 'image',
        caption: 'First BatchiT story!',
        audience: 'friends'
      });

    expect(storyRes.status).toBe(201);
    expect(storyRes.body.success).toBe(true);

    const feedRes = await request(app)
      .get('/api/stories/feed')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(feedRes.status).toBe(200);
    expect(feedRes.body.success).toBe(true);
    expect(feedRes.body.data.length).toBeGreaterThan(0);
  });
});
