import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import authService from '../services/authService';

export const setupPushNotifications = async (userId) => {
  if (!Capacitor.isNativePlatform() || !userId) {
    return;
  }

  // Request permission to use push notifications
  // iOS will prompt a user for permission out of the box.
  // Android 13+ will also prompt the user for permission.
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.warn('Push notification permission denied, but continuing to fetch token for silent payloads.');
    // We update activity without token first, in case the fallback fails
    authService.updateActivity(userId).catch(console.error);
  }

  // Create the notification channel (required for Android 8+)
  if (Capacitor.getPlatform() === 'android') {
    await PushNotifications.createChannel({
      id: 'study_reminders',
      name: 'Study Reminders',
      description: 'Notifications for study reminders',
      importance: 5, // High importance for sound/banner
      visibility: 1, // Public
      vibration: true,
    });
  }

  // Configure how notifications are presented when the app is in the foreground
  await PushNotifications.setPresentationOptions({
    presentationOptions: ['badge', 'sound', 'alert'],
  });

  // Add listeners BEFORE registering to avoid missing the registration event
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token: ' + token.value);
    // Send the token to your server to keep it updated
    authService.updateActivity(userId, token.value).catch(console.error);
  });

  // Some error occurred
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Error on registration: ' + JSON.stringify(error));
    // Update activity anyway so lastActiveAt is refreshed
    authService.updateActivity(userId).catch(console.error);
  });

  // Show us the notification payload if the app is open on our device
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received: ' + JSON.stringify(notification));
  });

  // Method called when a notification is tapped from a terminated or detached state
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push action performed: ' + JSON.stringify(notification));
  });

  // Register with Apple / Google to receive push via APNS/FCM
  try {
    await PushNotifications.register();
  } catch (error) {
    console.warn('Capacitor PushNotifications.register() failed or was blocked:', error);
  }

  // Fallback: force fetch token directly using our native bridge
  if (Capacitor.getPlatform() === 'android' && window.NativeFCM) {
    const handleNativeToken = (e) => {
      const token = e.detail;
      if (token) {
        console.log('Force fetched FCM token: ' + token);
        authService.updateActivity(userId, token).catch(console.error);
      }
      window.removeEventListener('onNativeFCMToken', handleNativeToken);
    };
    window.addEventListener('onNativeFCMToken', handleNativeToken);
    window.NativeFCM.fetchToken();
  }
};
