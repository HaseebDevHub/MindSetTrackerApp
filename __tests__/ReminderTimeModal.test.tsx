import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ReminderTimeModal } from '../src/components/common/ReminderTimeModal';
import { TimeWheelPicker } from '../src/components/onboarding/TimeWheelPicker';
import { AppButton } from '../src/components/common/AppButton';
import { ThemeProvider } from '../src/context/ThemeContext';

test('saves the current draft and resets scrolling state on close/reopen', () => {
  const onSave = jest.fn();
  const onCancel = jest.fn();
  const render = (visible: boolean, value = '08:00') => (
    <ThemeProvider>
      <ReminderTimeModal
        visible={visible}
        value={value}
        title="Reminder"
        onSave={onSave}
        onCancel={onCancel}
      />
    </ThemeProvider>
  );
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(render(true));
  });
  act(() => renderer!.root.findByType(TimeWheelPicker).props.onChange('09:45'));
  act(() => renderer!.root.findAllByType(AppButton)[1].props.onPress());
  expect(onSave).toHaveBeenCalledWith('09:45');
  act(() => renderer!.root.findAllByType(AppButton)[0].props.onPress());
  expect(onCancel).toHaveBeenCalledTimes(1);
  act(() => renderer!.update(render(false)));
  expect(renderer!.root.findAllByType(TimeWheelPicker)).toHaveLength(0);
  act(() => renderer!.update(render(true, '22:59')));
  expect(renderer!.root.findByType(TimeWheelPicker).props.value).toBe('22:59');
  act(() => renderer!.unmount());
});
