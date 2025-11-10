/*
 * Authors: Rachel Patella
 * Created: 2025-10-23
 * Updated: 2025-10-30
 *
 * This file contains helper functions to handle time and date conversions on the client
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */

import {
  parseDate,
  type Timestamp,
} from '@quasar/quasar-ui-qcalendar';

// Helper function to convert inputted date YYYY-MM-DD and time HH:MM strings into a qcalendar TimeStamp to store in DB
// If timeString is empty, it defaults to 00:00:00
// Used to convert event start and end times into local timestamps
export function convertTimeAndDateToTimestamp(dateString: string, timeString: string): Timestamp {
  const date = dateString.trim();
  const time = timeString.trim();
  // Pad seconds :00 onto time field since only HH:MM is provided
  const formatTime = time === '' ? '00:00:00' : (time.length === 5 ? `${time}:00` : time);
  // Split date/time strings into numeric components to pass to construct a local date
  const [yearString, monthString, dayString] = date.split('-');
  const [hourString, minuteString, secondString] = formatTime.split(':');
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const hour = Number(hourString);
  const minute = Number(minuteString);
  const second = Number(secondString);
  // Javascript date month is 0-based (Jan = 0) so subtract 1 from month
  const dateTime = new Date(year, month - 1, day, hour, minute, second, 0);
  //console.log("Constructed dateTime object:", dateTime);
  // Parse date object into a qcalendar timestamp
  const timeStamp = parseDate(dateTime);
  //console.log("Converted Timestamp:", timeStamp);
  // Return object that has all timestamp fields plus original date for UI rendering
  return {
  ...timeStamp,
  date: dateString
  } as Timestamp;
}

// Function to convert notification time (ex. remind me 30 mins before event start time) into a qcalendar timestamp to store in backend
// If MinutesBefore is 0, it is the same as event start time. If its negative, notification is after event time'
export function convertNotificationTimestamp(dateString: string, timeString: string, minutesBeforeEvent: number): Timestamp {
  const date = dateString.trim();
  const time = timeString.trim();
  const formatTime = time === '' ? '00:00:00' : (time.length === 5 ? `${time}:00` : time);
  // Split date/time strings into numeric components to pass to construct a local date
  const [yearString, monthString, dayString] = date.split('-');
  const [hourString, minuteString, secondString] = formatTime.split(':');
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const hour = Number(hourString);
  const minute = Number(minuteString);
  const second = Number(secondString);
  // Javascript date month is 0-based (Jan = 0) so subtract 1 from month
  const dateTime = new Date(year, month - 1, day, hour, minute, second, 0);
  // console.log("Constructed dateTime object:", dateTime);
  // Compute notification time (ex. remind me 30 mins before event start) into a usable date object for scheduling
  // Subtracts the epoch of the event start time (in ms) by the minutes before event converted to ms (* 60000)
  const notifyTime = new Date(dateTime.getTime() - Number(minutesBeforeEvent) * 60000);
  // Convert notification date object into a qcalendar timestamp
  const notifyTimestamp = parseDate(notifyTime);
  // console.log("Notification Timestamp:", notifyTimestamp);
  return notifyTimestamp as Timestamp;
}

// Function to convert a QCalendar timestamp back into a local date and epoch time for scheduling
export function timeStamptoEpoch(timestamp: Timestamp): number {
  // Q-calendar month is 1-based (Jan = 1), Javascript date month is 0-based (Jan = 0) so subtract 1 from month
  // Set seconds to 0 since notification will go off at exact minute change
  const date = new Date(timestamp.year, timestamp.month - 1, timestamp.day, timestamp.hour, timestamp.minute, 0);
  // console.log("Converted date object from timestamp:", date);
  const epochTime = date.getTime();
  // console.log("Converted epoch time from timestamp:", epochTime);
  return epochTime;
}

// Function to format a qcalendar Timestamp back into HH:MM string for time display on notification
export function timestampToTimeString(timestamp: Timestamp): string {
  // Pad hour and minute integers with leading zeroes
  // Ex. Hour = 9 -> 09 or minute =5 -> 05
  // Convert the time into a string in HH:MM format
  const hour = String(timestamp.hour).padStart(2, '0');
  const minute = String(timestamp.minute).padStart(2, '0');
  return `${hour}:${minute}`;
}

// Function to convert minute of day from backend into HH:MM format for time display
// Used in mapping database row into UI reminder to display notification time on frontend
export function minutesToHHMM(minOfDay: number): string {
    // Calculate hours: divide number of minutes by 60 to get hours
    // Floor to return actual integer hour, no decimals
    const hour = Math.floor(minOfDay / 60);
    // Calculate remaining minutes: take minutes and modulo 60 (remainder is number of minutes)
    const minute = minOfDay % 60;
    // Convert the time into a string in HH:MM format
    const hourString = String(hour).padStart(2, '0');
    const minuteString = String(minute).padStart(2, '0');
    // Pad hour and minute integers with leading zeroes
    // Ex. Hour = 9 -> 09 or minute =5 -> 05
    return `${hourString}:${minuteString}`;
  }




