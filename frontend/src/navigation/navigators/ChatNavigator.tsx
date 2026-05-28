import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ChatStackParams } from '../types';
import ChatListScreen from '../../screens/chat/ChatListScreen';
import { ChatSessionScreen } from '../../screens/chat/ChatSessionScreen';

const ChatStack = createNativeStackNavigator<ChatStackParams>();
const noHeader = { headerShown: false };

export default function ChatNavigator() {
  return (
    <ChatStack.Navigator screenOptions={noHeader}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatStack.Screen name="ChatSession" component={ChatSessionScreen} />
    </ChatStack.Navigator>
  );
}
