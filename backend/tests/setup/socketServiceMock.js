const createSocketServiceMock = () => ({
  initialize: jest.fn(),
  shutdown: jest.fn(),
  sendNotificationToUser: jest.fn(),
  broadcastDataUpdate: jest.fn(),
  broadcastRoomEvent: jest.fn(),
  markNotificationAsRead: jest.fn(),
  queueNotificationForOfflineUser: jest.fn(),
  sendQueuedNotifications: jest.fn(),
  disconnectUserFromAllSockets: jest.fn(),
  registerConnection: jest.fn(),
  getOnlineUsers: jest.fn(() => new Map()),
});

beforeEach(() => {
  global.__TEST_SOCKET_SERVICE__ = createSocketServiceMock();
});

afterEach(() => {
  delete global.__TEST_SOCKET_SERVICE__;
});

module.exports = {
  createSocketServiceMock,
};
