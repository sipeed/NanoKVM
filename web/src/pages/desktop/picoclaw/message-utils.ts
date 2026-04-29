import { generateUUIDv4 } from '@/lib/picoclaw-gateway.ts';
import type {
  GatewayAssistantMessage,
  GatewayError,
  GatewayObservation,
  GatewayToolAction,
  PicoclawChatMessage
} from '@/types';

export const HIDDEN_OVERLAY = {
  visible: false,
  message: ''
} as const;

export function createStatusMessage(text: string): PicoclawChatMessage {
  return {
    id: generateUUIDv4(),
    kind: 'status',
    text,
    createdAt: Date.now()
  };
}

export function createErrorMessage(error: GatewayError): PicoclawChatMessage {
  return {
    id: generateUUIDv4(),
    kind: 'error',
    text: error.message,
    createdAt: Date.now(),
    raw: error.raw
  };
}

export function createAssistantMessage(message: GatewayAssistantMessage): PicoclawChatMessage {
  return {
    id: message.id,
    kind: 'assistant',
    text: message.text,
    createdAt: Date.now(),
    raw: message.raw
  };
}

export function createToolActionMessage(action: GatewayToolAction): PicoclawChatMessage {
  return {
    id: action.id,
    kind: 'tool_action',
    text: action.action,
    action: action.action,
    createdAt: Date.now(),
    raw: action.raw
  };
}

export function createObservationMessage(observation: GatewayObservation): PicoclawChatMessage {
  return {
    id: observation.id,
    kind: 'observation',
    text: observation.text,
    imageBase64: observation.imageBase64,
    createdAt: Date.now()
  };
}

export function retainLatestObservationScreenshot(
  messages: PicoclawChatMessage[]
): PicoclawChatMessage[] {
  let latestObservationIndex = -1;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.kind === 'observation' && message.imageBase64) {
      latestObservationIndex = index;
      break;
    }
  }

  if (latestObservationIndex < 0) {
    return messages;
  }

  return messages.map((message, index) => {
    if (
      message.kind !== 'observation' ||
      !message.imageBase64 ||
      index === latestObservationIndex
    ) {
      return message;
    }

    return {
      ...message,
      imageBase64: undefined,
      raw: undefined
    };
  });
}
