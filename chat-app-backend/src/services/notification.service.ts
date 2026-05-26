import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

export const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`Push token ${expoPushToken} is not a valid Expo push token`);
    return;
  }

  // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
  const messages: ExpoPushMessage[] = [
    {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
    },
  ];

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications.
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  // Send the chunks to the Expo push notification service.
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('Push notification tickets:', ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notifications chunk', error);
    }
  }

  return tickets;
};
