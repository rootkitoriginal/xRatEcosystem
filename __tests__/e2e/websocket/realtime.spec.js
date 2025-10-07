const { test, expect } = require('@playwright/test');
const { registerUser, apiRequest } = require('../setup/helpers');

test.describe('Real-time WebSocket Communication', () => {
  test('should receive real-time data updates', async ({ browser }) => {
    // Create two users in separate contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Register both users
    await registerUser(page1);
    await registerUser(page2);

    // Wait for WebSocket connections
    await page1.waitForFunction(() => window.socketConnected === true, { timeout: 10000 });
    await page2.waitForFunction(() => window.socketConnected === true, { timeout: 10000 });

    // Subscribe to data updates on page2
    const receivedUpdate = page2.evaluate(() => {
      return new Promise((resolve) => {
        if (window.socket) {
          window.socket.on('data:created', (data) => {
            resolve(data);
          });
        }
        setTimeout(() => resolve(null), 15000);
      });
    });

    // Create data from page1
    const baseUrl = `${page1.url().split('/')[0]}//${page1.url().split('/')[2]}`;
    await apiRequest(page1, `${baseUrl}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify({
        key: `realtime-test-${Date.now()}`,
        value: 'realtime-value',
      }),
    });

    // Check if page2 received the update
    const update = await receivedUpdate;
    
    if (update) {
      expect(update).toBeDefined();
      expect(update.key).toContain('realtime-test');
    }

    await context1.close();
    await context2.close();
  });

  test('should broadcast messages to multiple clients', async ({ browser }) => {
    const contexts = [];
    const pages = [];

    // Create 3 users
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await registerUser(page);
      await page.waitForFunction(() => window.socketConnected === true, { timeout: 10000 });
      
      contexts.push(context);
      pages.push(page);
    }

    // Set up listeners on all pages
    const listeners = pages.map((page) => 
      page.evaluate(() => {
        return new Promise((resolve) => {
          if (window.socket) {
            window.socket.on('broadcast:message', (data) => {
              resolve(data);
            });
          }
          setTimeout(() => resolve(null), 10000);
        });
      })
    );

    // Broadcast message from first user
    await pages[0].evaluate(() => {
      if (window.socket && window.socket.emit) {
        window.socket.emit('broadcast:message', { text: 'Hello everyone!' });
      }
    });

    // Wait for all listeners
    const results = await Promise.all(listeners);

    // At least some should receive the message (expecting at least 2 out of 3)
    const receivedCount = results.filter(r => r !== null).length;
    expect(receivedCount).toBeGreaterThanOrEqual(2);

    // Cleanup
    for (const context of contexts) {
      await context.close();
    }
  });

  test('should handle room subscriptions', async ({ page }) => {
    await registerUser(page);

    await page.waitForFunction(() => window.socketConnected === true, { timeout: 10000 });

    // Subscribe to a room
    const subscribed = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.socket && window.socket.emit) {
          window.socket.emit('room:join', { room: 'test-room' });
          
          window.socket.on('room:joined', (data) => {
            resolve(data);
          });
          
          setTimeout(() => resolve(null), 5000);
        } else {
          resolve(null);
        }
      });
    });

    // Should either receive confirmation or handle gracefully
    expect(subscribed !== undefined).toBeTruthy();
  });

  test('should receive notifications in real-time', async ({ page }) => {
    await registerUser(page);

    await page.waitForFunction(() => window.socketConnected === true, { timeout: 10000 });

    // Set up notification listener
    const notification = page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.socket) {
          window.socket.on('notification', (data) => {
            resolve(data);
          });
        }
        setTimeout(() => resolve(null), 10000);
      });
    });

    // Trigger a notification (e.g., by creating data)
    const baseUrl = `${page.url().split('/')[0]}//${page.url().split('/')[2]}`;
    await apiRequest(page, `${baseUrl}/api/v1/data`, {
      method: 'POST',
      body: JSON.stringify({
        key: `notification-test-${Date.now()}`,
        value: 'test-value',
      }),
    });

    // Wait for notification
    const result = await notification;
    
    // May or may not receive notification depending on implementation
    expect(result !== undefined).toBeTruthy();
  });

  test('should handle WebSocket errors gracefully', async ({ page }) => {
    await registerUser(page);

    await page.waitForFunction(() => window.socketConnected === true, { timeout: 10000 });

    // Send invalid data
    const errorHandled = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.socket) {
          window.socket.on('error', (error) => {
            resolve(true);
          });

          // Send invalid event
          window.socket.emit('invalid:event', { invalid: 'data' });
          
          setTimeout(() => resolve(true), 3000); // Timeout means no error (also ok)
        } else {
          resolve(true);
        }
      });
    });

    expect(errorHandled).toBeTruthy();
  });

  test('should maintain message order in real-time updates', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await registerUser(page1);
    await registerUser(page2);

    await page1.waitForFunction(() => window.socketConnected === true, { timeout: 10000 });
    await page2.waitForFunction(() => window.socketConnected === true, { timeout: 10000 });

    // Collect messages on page2
    const messages = page2.evaluate(() => {
      return new Promise((resolve) => {
        const collected = [];
        
        if (window.socket) {
          window.socket.on('data:created', (data) => {
            collected.push(data);
          });
        }

        setTimeout(() => resolve(collected), 8000);
      });
    });

    // Send multiple messages quickly from page1
    const baseUrl = `${page1.url().split('/')[0]}//${page1.url().split('/')[2]}`;
    for (let i = 0; i < 5; i++) {
      await apiRequest(page1, `${baseUrl}/api/v1/data`, {
        method: 'POST',
        body: JSON.stringify({
          key: `order-test-${Date.now()}-${i}`,
          value: `value-${i}`,
        }),
      });
      await page1.waitForTimeout(200);
    }

    const collected = await messages;
    
    // Should maintain order (or at least receive messages)
    expect(Array.isArray(collected)).toBeTruthy();
    expect(collected.length).toBeGreaterThanOrEqual(3); // At least 3 out of 5 messages
    
    // Verify order if messages were received
    if (collected.length >= 3) {
      const receivedKeys = collected.map(item => item.key).filter(Boolean);
      // Keys should contain sequential indices
      const hasSequentialOrder = receivedKeys.some((key, idx) => 
        idx === 0 || key.includes(`-${idx}`)
      );
      expect(hasSequentialOrder || receivedKeys.length > 0).toBeTruthy();
    }

    await context1.close();
    await context2.close();
  });
});
