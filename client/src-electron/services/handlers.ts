/*
 * Authors: Kevin Sirantoine, Rachel Patella, Maria Pasaylo, Michael Jagiello
 * Created: 2025-09-25
 * Updated: 2025-11-09
 *
 * This file declares ipcMain handlers for APIs exposed in electron-preload and exports them via registerHandlers() to electron-main.
 *
 * This file is a part of OpenOrganizer.
 * This file and all source code within it are governed by the copyright and license terms outlined in the LICENSE file located in the top-level directory of this distribution.
 * No part of OpenOrganizer, including this file, may be reproduced, modified, distributed, or otherwise used except in accordance with the terms specified in the LICENSE file.
 */
import {ipcMain, Notification} from "electron";
import * as db from "../../src-electron/db/sqlite-db";
import {store} from "app/src-electron/services/store";
import type {
  Note,
  Extension,
  Folder,
  Reminder,
  DailyReminder,
  WeeklyReminder,
  MonthlyReminder,
  YearlyReminder,
  Deleted,
  RangeWindow
} from "app/src-electron/types/shared-types";
import { createAccount, loginAccount, clearLocalData} from "./auth";
import { sync } from "./sync";
import * as notifs from "./notifs"
// import schedule from 'node-schedule';

export function registerHandlers()
{
  // SQLite Handlers
  // create
  ipcMain.handle('createNote', (event, newNote: Note) => {
    db.createNote(newNote);
  });

  ipcMain.handle('createReminder', (event, newRem: Reminder) => {
    db.createReminder(newRem);
    notifs.SetNotifReminder(newRem);
  });

  ipcMain.handle('createDailyReminder', (event, newDailyRem: DailyReminder) => {
    db.createDailyReminder(newDailyRem);
  });

  ipcMain.handle('createWeeklyReminder', (event, newWeeklyRem: WeeklyReminder) => {
    db.createWeeklyReminder(newWeeklyRem);
  });

  ipcMain.handle('createMonthlyReminder', (event, newMonthlyRem: MonthlyReminder) => {
    db.createMonthlyReminder(newMonthlyRem);
  });

  ipcMain.handle('createYearlyReminder', (event, newYearlyRem: YearlyReminder) => {
    db.createYearlyReminder(newYearlyRem);
  });

  ipcMain.handle('createFolder', (event, newFolder: Folder) => {
    db.createFolder(newFolder);
  });

  ipcMain.handle('createDeleted', (event, newDeleted: Deleted) => {
    db.createDeleted(newDeleted);
  });


  // read
  ipcMain.handle('readNote', (event, itemID: bigint) => {
    return db.readNote(itemID);
  });

  ipcMain.handle('readReminder', (event, itemID: bigint) => {
    const reminder = db.readReminder(itemID);
    if (reminder == undefined) return undefined;
    notifs.SetNotifReminder(reminder);
    return reminder;
  });

  ipcMain.handle('readDailyReminder', (event, itemID: bigint) => {
    return db.readDailyReminder(itemID);
  });

  ipcMain.handle('readWeeklyReminder', (event, itemID: bigint) => {
    return db.readWeeklyReminder(itemID);
  });

  ipcMain.handle('readMonthlyReminder', (event, itemID: bigint) => {
    return db.readMonthlyReminder(itemID);
  });

  ipcMain.handle('readYearlyReminder', (event, itemID: bigint) => {
    return db.readYearlyReminder(itemID);
  });

  ipcMain.handle('readFolder', (event, folderID: bigint) => {
    return db.readFolder(folderID);
  });

  // read in range
  ipcMain.handle('readNotesInRange', (event, windowStartMs: bigint, windowEndMs: bigint) => {
    return db.readNotesInRange(windowStartMs, windowEndMs);
  });

  ipcMain.handle('readRemindersInRange', (event, rangeWindow: RangeWindow) => {
    const reminders = db.readRemindersInRange(rangeWindow);
    if (reminders == undefined) return undefined;
    for (const reminder of reminders) {
      notifs.SetNotifReminder(reminder);
    }
    return reminders;
  });

  ipcMain.handle('readDailyRemindersInRange', (event, rangeWindow: RangeWindow) => {
    return db.readDailyRemindersInRange(rangeWindow);
  });

  ipcMain.handle('readWeeklyRemindersInRange', (event, rangeWindow: RangeWindow) => {
    return db.readWeeklyRemindersInRange(rangeWindow);
  });

  ipcMain.handle('readMonthlyRemindersInRange', (event, rangeWindow: RangeWindow) => {
    return db.readMonthlyRemindersInRange(rangeWindow);
  });

  ipcMain.handle('readYearlyRemindersInRange', (event, rangeWindow: RangeWindow) => {
    return db.readYearlyRemindersInRange(rangeWindow);
  });

  // read all
  ipcMain.handle('readAllFolders', (event) => {
    return db.readAllFolders();
  });

  // read IDs based on folderID
  ipcMain.handle('readNotesInFolder', (event, folderID: bigint) => {
    return db.readNotesInFolder(folderID);
  });

  ipcMain.handle('readRemindersInFolder', (event, folderID: bigint) => {
    return db.readRemindersInFolder(folderID);
  });

  ipcMain.handle('readDailyRemindersInFolder', (event, folderID: bigint) => {
    return db.readDailyRemindersInFolder(folderID);
  });

  ipcMain.handle('readWeeklyRemindersInFolder', (event, folderID: bigint) => {
    return db.readWeeklyRemindersInFolder(folderID);
  });

  ipcMain.handle('readMonthlyRemindersInFolder', (event, folderID: bigint) => {
    return db.readMonthlyRemindersInFolder(folderID);
  });

  ipcMain.handle('readYearlyRemindersInFolder', (event, folderID: bigint) => {
    return db.readYearlyRemindersInFolder(folderID);
  });

  ipcMain.handle('readFoldersInFolder', (event, parentFolderID: bigint) => {
    return db.readFoldersInFolder(parentFolderID);
  });


  // update
  ipcMain.handle('updateNote', (event, modNote: Note) => {
    db.updateNote(modNote);
  });

  ipcMain.handle('updateReminder', (event, modRem: Reminder) => {
    db.updateReminder(modRem);
    notifs.SetNotifReminder(modRem);
  });

  ipcMain.handle('updateDailyReminder', (event, modDailyRem: DailyReminder) => {
    db.updateDailyReminder(modDailyRem);
  });

  ipcMain.handle('updateWeeklyReminder', (event, modWeeklyRem: WeeklyReminder) => {
    db.updateWeeklyReminder(modWeeklyRem);
  });

  ipcMain.handle('updateMonthlyReminder', (event, modMonthlyRem: MonthlyReminder) => {
    db.updateMonthlyReminder(modMonthlyRem);
  });

  ipcMain.handle('updateYearlyReminder', (event, modYearlyRem: YearlyReminder) => {
    db.updateYearlyReminder(modYearlyRem);
  });

  ipcMain.handle('updateFolder', (event, modFolder: Folder) => {
    db.updateFolder(modFolder);
  });

  // delete
  ipcMain.handle('deleteNote', (event, itemID: bigint) => {
    return db.deleteNote(itemID);
  });

  ipcMain.handle('deleteReminder', (event, itemID: bigint) => {
    notifs.DeleteNotif(itemID);
    return db.deleteReminder(itemID);
  });

  ipcMain.handle('deleteDailyReminder', (event, itemID: bigint) => {
    return db.deleteDailyReminder(itemID);
  });

  ipcMain.handle('deleteWeeklyReminder', (event, itemID: bigint) => {
    return db.deleteWeeklyReminder(itemID);
  });

  ipcMain.handle('deleteMonthlyReminder', (event, itemID: bigint) => {
    return db.deleteMonthlyReminder(itemID);
  });

  ipcMain.handle('deleteYearlyReminder', (event, itemID: bigint) => {
    return db.deleteYearlyReminder(itemID);
  });

  ipcMain.handle('deleteExtension', (event, itemID: bigint, sequenceNum: number) => {
    db.deleteExtension(itemID, sequenceNum);
  });

  ipcMain.handle('deleteAllExtensions', (event, itemID: bigint) => {
    db.deleteAllExtensions(itemID);
  });

  ipcMain.handle('deleteFolder', (event, folderID: bigint) => {
    return db.deleteFolder(folderID);
  });

  ipcMain.handle('clearAllTables', (event) => {
    db.clearAllTables();
  });

  // sync
  ipcMain.handle('sync', async (event) => {
    await sync();
  });

  // Example Handlers
  ipcMain.handle('sqliteRead', (event, key: string) => {
    return db.read(key);
  });

  ipcMain.handle('sqliteCreate', (event, key: string, value: string) => {
    db.create(key, value);
    return true;
  });

  ipcMain.handle('sqliteUpdate', (event, key: string, value: string) => {
    db.update(key, value);
    return true;
  });

  ipcMain.handle('sqliteDelete', (event, key: string) => {
    db.deleteEntry(key);
    return true;
  });

  // electron-store Handlers
  ipcMain.handle('getStoreName', () => {
    return store.get('name');
  });

  ipcMain.handle('setStoreName', (event, name: string) => {
    store.set('name', name);
    return true;
  });
}

ipcMain.handle('createAccount', async (event, username: string, password:string)=> {
  return await createAccount(username, password);
});

ipcMain.handle('loginAccount', async (event, username: string, password:string)=> {
  return await loginAccount(username, password);
});

ipcMain.handle('clearLocalData', (event) => {
  clearLocalData();
});
