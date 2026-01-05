interface MouseMoveAbsoluteEvent {
  type: 'move';
  x: number;
  y: number;
}

interface MouseMoveRelativeEvent {
  type: 'move';
  deltaX: number;
  deltaY: number;
}

interface MouseButtonEvent {
  type: 'mousedown' | 'mouseup';
  button: number;
}

interface MouseWheelEvent {
  type: 'wheel';
  deltaY: number;
}

export type MouseAbsoluteEvent = MouseMoveAbsoluteEvent | MouseButtonEvent | MouseWheelEvent;

export type MouseRelativeEvent = MouseMoveRelativeEvent | MouseButtonEvent | MouseWheelEvent;
