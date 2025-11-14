export const FEEDBACK_ICON_CLICKED = 'feedback-icon';
export const TASK_TAB_CLICKED = 'task-tab';
export const SCRATCHPAD_TAB_CLICKED = 'scratchpad-tab';
export const CALENDER_TAB_CLICKED = 'calendar-tab';
export const AVATAR_ICON_CLICKED = 'avatar-icon';
export const ADD_TASK_CLICKED = 'add-task';
export const ADD_SCRATCHPAD_CLICKED = 'add-task';
export const SEND_TO_TASK = 'send-to-task';
export const DELETE_SCRATCHPAD_ITEM = 'delete-scratchpad-item';
export const FEEDBACK_SUBMIT_CLICKED = 'feedback-submit-clicked'

export function track(event:string) : void {
    console.log(`tracking event ${event}`)
    window.umami?.track(event);
}