/*
 * Authors: Michael Jagiello
 * Created: 2025-11-08
 * Updated: 2025-11-09
 *
 * This file defines all main functionality for creating, maintaining, and executing notifcations based on reminders and generated reminders.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

import * as cron from 'node-cron'
import { Notification } from "electron";
import { getDayOfYear, type Timestamp } from '@quasar/quasar-ui-qcalendar';
import { convertTimeAndDateToTimestamp } from "src/frontend-utils/time";
import type { Reminder } from '../types/shared-types';

interface Notif {
  itemID: bigint,
  origEventStartTime?: bigint,
  time: bigint,
  title: string,
  body: string
}

// all loaded reminders and generated reminders are loaded as notifs (this should never be large enough for a full iteration to matter)
// key is (itemID << 64) | (origEventStartTime | itemID)
const notifications = new Map<bigint, Notif>();

export function InitNotifications() {
  // run at the start of every minute
  cron.schedule("* * * * *", () => { CheckNotifications() });
}

// adds or updates reminder for notification details
// only adds if hasNotif == true, else deletes
export function SetNotifReminder(reminder: Reminder) {
  if (!reminder.hasNotif) {
    DeleteNotif(reminder.itemID);
    return false;
  }
  const notif: Notif = {
    itemID: reminder.itemID,
    time: TimeToBigint(reminder.notifYear, reminder.notifDay, reminder.notifMin),
    title: reminder.title,
    body: ""
  };
  notifications.set(CombineBigints64(notif.itemID, notif.itemID), notif);
  return true;
}

// adds or updates generated reminder for notification details
// only adds if hasNotif == true, else deletes
//export function SetNotifGenerated() {}

// deletes notification
// origEventStartTime is required for generated reminders
export function DeleteNotif(itemID: bigint, origEventStartTime?: bigint) {
  if (origEventStartTime == undefined) origEventStartTime = itemID;
  return notifications.delete(CombineBigints64(itemID, origEventStartTime));
}

function CheckNotifications() {
  const now = GetNowTime();
  for (const [key, notif] of notifications) {
    if (notif.time == now) {
      Notify(notif);
    }
  }
}

function Notify(notif: Notif) {
  new Notification({ title: notif.title, body: notif.body }).show();
}

// gets current time, formatted as a bigint with 4 bytes for year, 2 bytes for day of year, and 2 bytes for minute
function GetNowTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dateString = year.toString() + "-" + month.toString() + "-" + day.toString();
  const timeString = hour.toString() + ":" + minute.toString() + ":00";
  const time = convertTimeAndDateToTimestamp(dateString, timeString);
  return TimestampToBigint(time);
}

// converts Timestamp into a bigint
function TimestampToBigint(time: Timestamp) {
  const buf = Buffer.alloc(8);
  buf.writeUint32LE(time.year, 0);
  buf.writeUint16LE(getDayOfYear(time), 4);
  buf.writeUint16LE((time.hour * 60) + time.minute, 6);
  return buf.readBigInt64LE();
}

// converts year+day+minute into a bigint
function TimeToBigint(year: number, day: number, minute: number) {
  const buf = Buffer.alloc(8);
  buf.writeUint32LE(year, 0);
  buf.writeUint16LE(day, 4);
  buf.writeUint16LE(minute, 6);
  return buf.readBigInt64LE();
}

// concatenates two 64-bit bigints
function CombineBigints64(a: bigint, b: bigint) {
  return (a << 64n) | b;
}
